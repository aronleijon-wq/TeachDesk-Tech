// What TeachDesk keeps in the browser. The demo workspace is example data, so it stays on
// this device, and so does which workspace the teacher last opened here. Before TeachDesk
// saved to the database, everything lived here; that older data is read once so it can be
// moved to the teacher's account, then removed.
import { hasContent, normalizeWorkspace, type Workspace } from "./types";

const demoKey = (userId: string) => `teachdesk:demo:${userId}`;
const openSchoolKey = (userId: string) => `teachdesk:open-school:${userId}`;
const legacyKey = (userId: string) => `teachdesk:workspace:${userId}`;

/** Reads a saved value; null if missing, unreadable, or storage is blocked. */
function read(key: string): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// --- Demo workspace ---------------------------------------------------------------

/** The demo as the teacher left it on this device, or null to start from fresh demo data. */
export function readDemoWorkspace(userId: string): Workspace | null {
  const saved = read(demoKey(userId));
  const demo = saved && normalizeWorkspace(saved);
  return demo && hasContent(demo) ? demo : null;
}

/** Returns false if the browser refused to save (storage full or blocked). */
export function writeDemoWorkspace(userId: string, demo: Workspace): boolean {
  try {
    window.localStorage.setItem(demoKey(userId), JSON.stringify(demo));
    return true;
  } catch {
    return false;
  }
}

// --- Which workspace is open --------------------------------------------------------

/**
 * The workspace the teacher opened last on this device: a school's id, null for their
 * personal workspace, or undefined if they haven't chosen one here.
 */
export function readOpenSchool(userId: string): string | null | undefined {
  const schoolId = read(openSchoolKey(userId))?.["schoolId"];
  return typeof schoolId === "string" || schoolId === null ? schoolId : undefined;
}

export function writeOpenSchool(userId: string, schoolId: string | null) {
  try {
    window.localStorage.setItem(openSchoolKey(userId), JSON.stringify({ schoolId }));
  } catch {
    // Storage blocked: the default workspace opens next time.
  }
}

// --- Data from before database saving ---------------------------------------------

export interface LegacyAccount {
  own: Workspace | null;
  demo: Workspace | null;
  profile: { name?: string; role?: string; school?: string };
  showDemo: boolean | null;
}

/** Everything saved in this browser by earlier versions of TeachDesk (storage versions 1 and 2). */
export function readLegacyAccount(userId: string): LegacyAccount | null {
  const saved = read(legacyKey(userId));
  if (!saved) return null;

  const workspace = (value: unknown) => {
    const ws = value ? normalizeWorkspace(value) : null;
    return ws && hasContent(ws) ? ws : null;
  };

  const savedProfile = (saved["profile"] ?? {}) as Record<string, unknown>;
  const profile: LegacyAccount["profile"] = {};
  for (const field of ["name", "role", "school"] as const) {
    const value = savedProfile[field];
    if (typeof value === "string" && value.trim()) profile[field] = value.trim();
  }

  let showDemo: boolean | null = null;
  if (saved["mode"] === "demo" || saved["mode"] === "own")
    showDemo = saved["mode"] === "demo"; // version 2
  else if (typeof saved["demoMode"] === "boolean") showDemo = saved["demoMode"]; // version 1

  // Version 1 only held demo edits; version 2 also has the teacher's own workspace.
  const isV2 = saved["version"] === 2;
  return {
    own: isV2 ? workspace(saved["own"]) : null,
    demo: isV2 ? workspace(saved["demo"]) : null,
    profile,
    showDemo,
  };
}

export function clearLegacyAccount(userId: string) {
  try {
    window.localStorage.removeItem(legacyKey(userId));
  } catch {
    // Storage blocked: nothing was saved there anyway.
  }
}
