// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyWorkspace, type Workspace } from "@/lib/types";
import {
  afterSave,
  changesSince,
  savedFromItems,
  stableJson,
  versionsDiffer,
  workspaceFromItems,
  type StoredItem,
} from "@/lib/workspace-items";

const klass = { id: "c1", name: "Matte 3C", subject: "Matte", room: "B214" };
const sara = { id: "s1", name: "Sara Andersson", classId: "c1", email: "", missingWork: 0 };
const stored: StoredItem[] = [
  { kind: "class", id: "c1", data: klass, version: 1 },
  { kind: "student", id: "s1", data: sara, version: 3 },
  { kind: "exam", id: "e-old", data: { id: "e-old" }, version: 1 },
  { kind: "exam", id: "e-new", data: { id: "e-new" }, version: 1 },
  { kind: "unknown", id: "x", data: { id: "x" }, version: 1 },
];

test("stored items become a workspace, with exams newest first", () => {
  const ws = workspaceFromItems(stored);
  assert.deepEqual(ws.classes, [klass]);
  assert.deepEqual(ws.students, [sara]);
  assert.deepEqual(
    ws.exams.map((e) => e.id),
    ["e-new", "e-old"],
  );
  assert.deepEqual(ws.events, []);
});

test("an unchanged workspace has nothing to save, whatever the key order", () => {
  const saved = savedFromItems(stored);
  const ws = workspaceFromItems(stored);
  const reordered: Workspace = {
    ...ws,
    classes: [{ room: "B214", subject: "Matte", name: "Matte 3C", id: "c1" }],
  };
  assert.deepEqual(changesSince(reordered, saved), []);
});

test("new, changed and removed items are found, with the version they're based on", () => {
  const saved = savedFromItems(stored);
  const ws = workspaceFromItems(stored);
  const changed: Workspace = {
    ...ws,
    students: [
      { ...sara, name: "Sara A." },
      { ...sara, id: "s2", name: "Leo Karlsson" },
    ],
    exams: ws.exams.filter((e) => e.id !== "e-old"),
  };
  assert.deepEqual(changesSince(changed, saved), [
    { kind: "student", id: "s1", data: { ...sara, name: "Sara A." }, version: 3 },
    { kind: "student", id: "s2", data: { ...sara, id: "s2", name: "Leo Karlsson" }, version: 0 },
    { kind: "exam", id: "e-old", data: null, version: 1 },
  ]);
});

test("after saving, versions move on and the new state has nothing left to save", () => {
  const saved = savedFromItems(stored);
  const ws: Workspace = {
    ...workspaceFromItems(stored),
    students: [],
    classes: [{ ...klass, room: "C104" }],
  };
  const changes = changesSince(ws, saved);
  const next = afterSave(saved, changes);
  assert.equal(next.get("class:c1")?.version, 2);
  assert.equal(next.has("student:s1"), false);
  assert.deepEqual(changesSince(ws, next), []);
});

test("an empty workspace saves every item of a filled one as new", () => {
  const filled: Workspace = { ...emptyWorkspace(), classes: [klass], students: [sara] };
  const changes = changesSince(filled, new Map());
  assert.deepEqual(
    changes.map((c) => [c.kind, c.version]),
    [
      ["class", 0],
      ["student", 0],
    ],
  );
});

test("someone else's save is noticed from the versions alone", () => {
  const saved = savedFromItems(stored);
  const same = stored.map(({ kind, id, version }) => ({ kind, id, version }));
  assert.equal(versionsDiffer(saved, same), false);
  assert.equal(
    versionsDiffer(
      saved,
      same.map((i) => (i.id === "s1" ? { ...i, version: 4 } : i)),
    ),
    true,
  );
  assert.equal(versionsDiffer(saved, same.slice(1)), true);
});

test("stable JSON ignores key order and missing values", () => {
  assert.equal(
    stableJson({ b: 1, a: [1, { d: undefined, c: 2 }] }),
    stableJson({ a: [1, { c: 2 }], b: 1 }),
  );
  assert.notEqual(stableJson({ a: 1 }), stableJson({ a: 2 }));
});
