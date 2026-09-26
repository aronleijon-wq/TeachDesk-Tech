// React hooks that connect TeachDesk's data to where it is saved: the profile, schools and
// workspaces in the database, and the demo workspace in the browser.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createAutosave, type SaveState } from "./autosave";
import { readDemoWorkspace, writeDemoWorkspace } from "./browser-storage";
import {
  createProfile,
  fetchItems,
  fetchItemVersions,
  fetchProfile,
  openWorkspace,
  saveItems,
  updateProfile,
  type EditableProfile,
  type StoredProfile,
} from "./cloud";
import { createDemoWorkspace } from "./demo-data";
import { fetchSchools, type School } from "./schools";
import { emptyWorkspace, type Workspace } from "./types";
import {
  afterSave,
  changesSince,
  savedFromItems,
  versionsDiffer,
  workspaceFromItems,
  type SavedItems,
} from "./workspace-items";

export type LoadStatus = "loading" | "ready" | "error";
export type WorkspaceChange = (ws: Workspace) => Workspace;

// --- Profile --------------------------------------------------------------------------

/** The teacher's profile, created with `defaults` on their first visit. */
export function useProfile(userId: string, defaults: EditableProfile) {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setProfile((await fetchProfile(userId)) ?? (await createProfile(userId, defaults)));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [userId, defaults]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Shows the change at once and saves it. If saving fails it is undone and the error passed on. */
  const save = useCallback(
    async (changes: Partial<EditableProfile>) => {
      const before = profile;
      setProfile((p) => p && { ...p, ...changes });
      try {
        await updateProfile(userId, changes);
      } catch (error) {
        setProfile(before);
        throw error;
      }
    },
    [userId, profile],
  );

  return { profile, status, save, reload: load };
}

// --- Schools ------------------------------------------------------------------------

/** The schools the teacher belongs to. */
export function useSchools(userId: string) {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setSchools(await fetchSchools(userId));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { schools, status, reload: load };
}

// --- A workspace in the database -----------------------------------------------------

/**
 * A school's shared workspace, or with `schoolId` null the teacher's personal one, saved
 * in the database item by item. Changes show at once and are saved a moment later.
 * `moveFromBrowser` fills a brand-new workspace with data kept in this browser before
 * database saving existed.
 *
 * Use one per workspace: give the component a `key` that changes with `schoolId`.
 */
export function useCloudWorkspace(schoolId: string | null, moveFromBrowser: Workspace | null) {
  // Read once: the data is only ever moved when this workspace first loads.
  const [toMove] = useState(moveFromBrowser);
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  // The save loop runs outside React renders, so it reads the latest values from refs.
  const workspaceId = useRef<string | null>(null);
  const current = useRef(workspace);
  const saved = useRef<SavedItems>(new Map());

  const show = useCallback((ws: Workspace) => {
    current.current = ws;
    setWorkspace(ws);
  }, []);

  /** Loads everything stored and makes it the saved state. */
  const loadStored = useCallback(async () => {
    const id = workspaceId.current ?? (workspaceId.current = await openWorkspace(schoolId));
    const items = await fetchItems(id);
    saved.current = savedFromItems(items);
    return workspaceFromItems(items);
  }, [schoolId]);

  const autosave = useMemo(
    () =>
      createAutosave({
        save: async () => {
          if (!workspaceId.current) return "failed";
          const changes = changesSince(current.current, saved.current);
          if (changes.length === 0) return "saved";
          const outcome = await saveItems(workspaceId.current, changes);
          if (outcome === "saved") saved.current = afterSave(saved.current, changes);
          return outcome;
        },
        onConflict: async () => {
          try {
            show(await loadStored());
            toast.warning("Updated with changes made elsewhere", {
              description:
                "Something you edited was changed at the same time — by a colleague or on another device — so the latest version was loaded. Please check your last change.",
            });
          } catch {
            toast.error("Couldn't load the latest version", {
              description: "Refresh the page to continue.",
            });
          }
        },
        onStateChange: setSaveState,
      }),
    [show, loadStored],
  );

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const stored = await loadStored();
      const isNew = saved.current.size === 0;
      show(isNew && toMove ? toMove : stored);
      // Classes kept in this browser before database saving are saved to the account now.
      if (isNew && toMove) autosave.changed();
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [loadStored, toMove, show, autosave]);

  useEffect(() => {
    void load();
    return () => autosave.dispose();
  }, [load, autosave]);

  // Pick up changes by colleagues or from other devices when the teacher returns to this tab.
  useEffect(() => {
    const refresh = async () => {
      const id = workspaceId.current;
      if (document.visibilityState !== "visible" || !id || autosave.hasUnsaved) return;
      try {
        if (!versionsDiffer(saved.current, await fetchItemVersions(id))) return;
        const latest = await loadStored();
        if (!autosave.hasUnsaved) show(latest);
      } catch {
        // Offline for now; the next visit or save will catch up.
      }
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [autosave, loadStored, show]);

  // Ask before the tab is closed while changes are still on their way to the database.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (autosave.hasUnsaved) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [autosave]);

  const update = useCallback(
    (change: WorkspaceChange) => {
      show(change(current.current));
      autosave.changed();
    },
    [show, autosave],
  );

  /** Saves pending changes now; resolves to false if some couldn't be saved (e.g. offline). */
  const flush = useCallback(async () => {
    await autosave.flush();
    return !autosave.hasUnsaved;
  }, [autosave]);

  return { workspace, status, saveState, update, flush, reload: load };
}

// --- Demo workspace -------------------------------------------------------------------

/** The demo workspace: example data, kept in this browser only. */
export function useDemoWorkspace(userId: string, moveFromBrowser: Workspace | null) {
  const [workspace, setWorkspace] = useState(
    () => readDemoWorkspace(userId) ?? moveFromBrowser ?? createDemoWorkspace(),
  );
  const warned = useRef(false);

  useEffect(() => {
    if (writeDemoWorkspace(userId, workspace) || warned.current) return;
    warned.current = true;
    toast.error("Couldn't save the demo in this browser", {
      description: "Its storage is full or blocked, so demo changes are lost on refresh.",
    });
  }, [userId, workspace]);

  const update = useCallback((change: WorkspaceChange) => setWorkspace(change), []);
  const reset = useCallback(() => setWorkspace(createDemoWorkspace()), []);

  return { workspace, update, reset };
}
