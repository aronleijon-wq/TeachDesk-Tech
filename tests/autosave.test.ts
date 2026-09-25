// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { createAutosave, type SaveOutcome, type SaveState } from "../src/lib/autosave.ts";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** An autosave whose `save` answers with the given outcomes, recording what happened. */
function setup(outcomes: SaveOutcome[], saveMs = 0) {
  const states: SaveState[] = [];
  let saves = 0;
  let conflicts = 0;
  const autosave = createAutosave({
    save: async () => {
      saves++;
      await wait(saveMs);
      return outcomes.shift() ?? "saved";
    },
    onConflict: async () => {
      conflicts++;
    },
    onStateChange: (s) => states.push(s),
    delayMs: 10,
    retryMs: 20,
  });
  return { autosave, states, count: () => ({ saves, conflicts }) };
}

test("several quick changes are saved once", async () => {
  const { autosave, states, count } = setup([]);
  autosave.changed();
  autosave.changed();
  autosave.changed();
  await wait(40);
  assert.equal(count().saves, 1);
  assert.equal(states.at(-1), "saved");
  assert.equal(autosave.hasUnsaved, false);
});

test("a change made during a save is saved right after it", async () => {
  const { autosave, count } = setup([], 20);
  autosave.changed();
  await wait(15); // first save is running now
  autosave.changed();
  await autosave.flush();
  assert.equal(count().saves, 2);
  assert.equal(autosave.hasUnsaved, false);
});

test("a failed save is retried until it succeeds", async () => {
  const { autosave, states, count } = setup(["failed", "failed"]);
  autosave.changed();
  await wait(15);
  assert.equal(states.at(-1), "offline");
  assert.equal(autosave.hasUnsaved, true);
  await wait(60);
  assert.equal(count().saves, 3);
  assert.equal(states.at(-1), "saved");
  assert.equal(autosave.hasUnsaved, false);
});

test("a conflict loads the other version instead of saving again", async () => {
  const { autosave, states, count } = setup(["conflict"]);
  autosave.changed();
  await autosave.flush();
  assert.deepEqual(count(), { saves: 1, conflicts: 1 });
  assert.equal(states.at(-1), "saved");
  assert.equal(autosave.hasUnsaved, false);
});

test("flush saves right away and waits for the save", async () => {
  const { autosave, count } = setup([], 5);
  autosave.changed();
  await autosave.flush();
  assert.equal(count().saves, 1);
  assert.equal(autosave.hasUnsaved, false);
});

test("dispose cancels a pending save", async () => {
  const { autosave, count } = setup([]);
  autosave.changed();
  autosave.dispose();
  await wait(30);
  assert.equal(count().saves, 0);
});
