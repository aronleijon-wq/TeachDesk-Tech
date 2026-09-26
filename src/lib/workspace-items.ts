// A workspace is saved as separate items — one per class, student, exam, retake,
// assignment and calendar event — so teachers working on different things never
// overwrite each other. This file converts between the two and works out what changed.
// It has no dependencies so it can be tested on its own.
import type { Workspace } from "./types";

export type ItemKind = "class" | "student" | "exam" | "retake" | "assignment" | "event";

/** The workspace list each kind of item belongs to. */
const LIST_FOR: Record<ItemKind, keyof Workspace> = {
  class: "classes",
  student: "students",
  exam: "exams",
  retake: "retakes",
  assignment: "assignments",
  event: "events",
};
const KINDS = Object.keys(LIST_FOR) as ItemKind[];

/** A stored item, as read from the database. */
export interface StoredItem {
  kind: string;
  id: string;
  data: unknown;
  version: number;
}

/** A change to save. `version` is the one it's based on (0 = new); `data: null` deletes. */
export interface ItemChange {
  kind: ItemKind;
  id: string;
  data: object | null;
  version: number;
}

/** What was last saved, by item: its version and its content. */
export type SavedItems = ReadonlyMap<string, { version: number; content: string }>;

const keyOf = (kind: string, id: string) => `${kind}:${id}`;
const isKind = (kind: string): kind is ItemKind => kind in LIST_FOR;

/** JSON with object keys sorted, so the same content always compares equal. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => stableJson(v ?? null)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Builds a workspace from stored items, which arrive oldest first. Exams are shown
 * newest first, like when they're created.
 */
export function workspaceFromItems(items: StoredItem[]): Workspace {
  const lists: Record<ItemKind, unknown[]> = {
    class: [],
    student: [],
    exam: [],
    retake: [],
    assignment: [],
    event: [],
  };
  for (const item of items) {
    if (isKind(item.kind) && item.data && typeof item.data === "object")
      lists[item.kind].push(item.data);
  }
  lists.exam.reverse();
  return Object.fromEntries(
    KINDS.map((kind) => [LIST_FOR[kind], lists[kind]]),
  ) as unknown as Workspace;
}

/** The saved state matching a set of stored items. */
export function savedFromItems(items: StoredItem[]): SavedItems {
  return new Map(
    items.map((item) => [
      keyOf(item.kind, item.id),
      { version: item.version, content: stableJson(item.data) },
    ]),
  );
}

/** Everything in `ws` that differs from what was saved: new, changed and removed items. */
export function changesSince(ws: Workspace, saved: SavedItems): ItemChange[] {
  const changes: ItemChange[] = [];
  const present = new Set<string>();

  for (const kind of KINDS) {
    for (const entry of ws[LIST_FOR[kind]] as { id: string }[]) {
      const key = keyOf(kind, entry.id);
      present.add(key);
      const before = saved.get(key);
      if (!before) changes.push({ kind, id: entry.id, data: entry, version: 0 });
      else if (before.content !== stableJson(entry))
        changes.push({ kind, id: entry.id, data: entry, version: before.version });
    }
  }

  for (const [key, before] of saved) {
    if (present.has(key)) continue;
    const [kind, ...rest] = key.split(":");
    if (kind && isKind(kind))
      changes.push({ kind, id: rest.join(":"), data: null, version: before.version });
  }
  return changes;
}

/** The saved state after `changes` were stored successfully. */
export function afterSave(saved: SavedItems, changes: ItemChange[]): SavedItems {
  const next = new Map(saved);
  for (const change of changes) {
    const key = keyOf(change.kind, change.id);
    if (change.data === null) next.delete(key);
    else next.set(key, { version: change.version + 1, content: stableJson(change.data) });
  }
  return next;
}

/** True if the stored versions differ from what we have, i.e. someone else saved. */
export function versionsDiffer(
  saved: SavedItems,
  stored: { kind: string; id: string; version: number }[],
): boolean {
  return (
    stored.length !== saved.size ||
    stored.some((item) => saved.get(keyOf(item.kind, item.id))?.version !== item.version)
  );
}
