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

const { rememberReturnPath, safeReturnPath, takeReturnPath } = await import("@/lib/return-path");

test("only pages in the app or an invitation are allowed after sign-in", () => {
  for (const path of ["/app", "/app/students", "/app?x=1", "/invite/abc123"]) {
    assert.equal(safeReturnPath(path), path);
  }
  for (const path of [
    "//evil.example",
    "https://evil.example/app",
    "/apple",
    "/",
    "/login",
    "app",
    42,
    null,
  ]) {
    assert.equal(safeReturnPath(path), undefined, String(path));
  }
});

test("a remembered path is given back once", () => {
  rememberReturnPath("/invite/abc123");
  assert.equal(takeReturnPath(), "/invite/abc123");
  assert.equal(takeReturnPath(), undefined);
});

test("a path remembered more than a day ago is forgotten", () => {
  const dayAgo = Date.now() - 25 * 60 * 60 * 1000;
  rememberReturnPath("/invite/abc123", dayAgo);
  assert.equal(takeReturnPath(), undefined);
  assert.equal(store.size, 0);
});

test("anything unexpected in storage is ignored", () => {
  store.set(
    "teachdesk:after-sign-in",
    JSON.stringify({ path: "https://evil.example", until: Date.now() + 1000 }),
  );
  assert.equal(takeReturnPath(), undefined);
  store.set("teachdesk:after-sign-in", "not json");
  assert.equal(takeReturnPath(), undefined);
});
