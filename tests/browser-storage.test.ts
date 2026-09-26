// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";

// A stand-in for the browser's localStorage.
const store = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  },
});

const { clearLegacyAccount, readDemoWorkspace, readLegacyAccount, writeDemoWorkspace } =
  await import("@/lib/browser-storage");
const { createDemoWorkspace } = await import("@/lib/demo-data");

const own = { classes: [{ id: "c1", name: "Matte 3C", subject: "Matte", room: "" }] };
const legacy = (userId: string, saved: unknown) =>
  store.set(`teachdesk:workspace:${userId}`, JSON.stringify(saved));

test("a version 2 save gives the own workspace, demo, profile and demo switch", () => {
  legacy("u1", {
    version: 2,
    mode: "own",
    own,
    demo: createDemoWorkspace(),
    profile: { name: " Aron ", email: "x@y", role: "Lärare", school: "", plan: "Trial" },
  });
  const account = readLegacyAccount("u1")!;
  assert.deepEqual(account.own?.classes, own.classes);
  assert.equal(account.demo?.classes.length, 3);
  assert.deepEqual(account.profile, { name: "Aron", role: "Lärare" });
  assert.equal(account.showDemo, false);
});

test("an empty own workspace has nothing to move", () => {
  legacy("u2", { version: 2, mode: "demo", own: { classes: [] }, demo: {}, profile: {} });
  const account = readLegacyAccount("u2")!;
  assert.equal(account.own, null);
  assert.equal(account.demo, null);
  assert.equal(account.showDemo, true);
});

test("a version 1 save only gives the profile and demo switch", () => {
  legacy("u3", {
    version: 1,
    exams: [],
    demoMode: false,
    profile: { name: "Erik Lindqvist", school: "Stockholm Gymnasium" },
  });
  const account = readLegacyAccount("u3")!;
  assert.equal(account.own, null);
  assert.deepEqual(account.profile, { name: "Erik Lindqvist", school: "Stockholm Gymnasium" });
  assert.equal(account.showDemo, false);
});

test("missing or unreadable data reads as nothing", () => {
  assert.equal(readLegacyAccount("nobody"), null);
  store.set("teachdesk:workspace:u4", "{not json");
  assert.equal(readLegacyAccount("u4"), null);
});

test("old data can be cleared, and the demo is kept under its own key", () => {
  clearLegacyAccount("u1");
  assert.equal(readLegacyAccount("u1"), null);
  assert.equal(readDemoWorkspace("u1"), null);
  assert.equal(writeDemoWorkspace("u1", createDemoWorkspace()), true);
  assert.equal(readDemoWorkspace("u1")?.students.length, 81);
});
