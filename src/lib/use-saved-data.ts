// React hooks that connect TeachDesk's data to where it is saved: the profile and the
// teacher's own workspace in the database, and the demo workspace in the browser.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createAutosave, type SaveState } from "./autosave";
import { readDemoWorkspace, writeDemoWorkspace } from "./browser-storage";
import {
  createProfile,
  fetchProfile,
  fetchWorkspace,
  saveWorkspace,
  updateProfile,
  type EditableProfile,
  type StoredProfile,
} from "./cloud";
import { createDemoWorkspace } from "./demo-data";
import { emptyWorkspace, type Workspace } from "./types";

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

// --- The teacher's own workspace ------------------------------------------------------

/**
 * The teacher's own workspace, saved in the database. Changes show at once and are saved a
 * moment later. `moveFromBrowser` is used when the account has no saved workspace yet.
 */
export function useCloudWorkspace(userId: string, moveFromBrowser: Workspace | null) {
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  // The save loop runs outside React renders, so it reads the latest values from refs.
  const current = useRef(workspace);
  const version = useRef(0);

  const show = useCallback((ws: Workspace) => {
    current.current = ws;
    setWorkspace(ws);
  }, []);

  const autosave = useMemo(
    () =>
      createAutosave({
        save: async () => {
          const result = await saveWorkspace(userId, current.current, version.current);
          if (result.outcome === "saved") version.current = result.version;
          return result.outcome;
        },
        onConflict: async () => {
          const latest = await fetchWorkspace(userId).catch(() => null);
          if (!latest) {
            toast.error("Couldn't load the latest version", {
              description: "Refresh the page to continue.",
            });
            return;
          }
          version.current = latest.version;
          show(latest.data);
          toast.warning("Updated from another device", {
            description:
              "Your workspace was changed somewhere else, so the latest version was loaded. Your last change wasn't saved.",
          });
        },
        onStateChange: setSaveState,
      }),
    [userId, show],
  );

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const stored = await fetchWorkspace(userId);
      version.current = stored?.version ?? 0;
      show(stored?.data ?? moveFromBrowser ?? emptyWorkspace());
      // Classes kept in this browser before database saving are saved to the account now.
      if (!stored && moveFromBrowser) autosave.changed();
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [userId, moveFromBrowser, show, autosave]);

  useEffect(() => {
    void load();
    return () => autosave.dispose();
  }, [load, autosave]);

  // Pick up changes made on another device when the teacher comes back to this tab.
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible" || autosave.hasUnsaved) return;
      const stored = await fetchWorkspace(userId).catch(() => null);
      if (stored && stored.version !== version.current && !autosave.hasUnsaved) {
        version.current = stored.version;
        show(stored.data);
      }
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [userId, autosave, show]);

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
