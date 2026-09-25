// Debounced saving for data that changes often, like a teacher's workspace.
// Kept free of React and Supabase so it can be tested on its own.

export type SaveState = "saved" | "saving" | "offline";
export type SaveOutcome = "saved" | "conflict" | "failed";

export interface Autosave {
  /** Call after every change; the latest data is saved once changes pause. */
  changed: () => void;
  /** Saves right away and resolves when everything is saved (or has failed for now). */
  flush: () => Promise<void>;
  /** True while there are changes that haven't reached the database. */
  readonly hasUnsaved: boolean;
  /** Stops pending timers, e.g. when the page is closed. */
  dispose: () => void;
}

/**
 * Saves at most one version at a time. A change made while a save is running is saved
 * right after it. Failed saves are retried; a conflict (someone else saved first) is
 * handed to `onConflict`, which loads their version instead of overwriting it.
 */
export function createAutosave(options: {
  save: () => Promise<SaveOutcome>;
  onConflict: () => Promise<void>;
  onStateChange: (state: SaveState) => void;
  delayMs?: number;
  retryMs?: number;
}): Autosave {
  const { save, onConflict, onStateChange, delayMs = 800, retryMs = 5000 } = options;
  let pending = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | null = null;

  const schedule = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), ms);
  };

  async function run() {
    while (pending) {
      pending = false;
      onStateChange("saving");
      const outcome = await save();
      if (outcome === "conflict") {
        // Their version replaces ours, including any change made during the save.
        pending = false;
        await onConflict();
      } else if (outcome === "failed") {
        pending = true;
        onStateChange("offline");
        schedule(retryMs);
        return;
      }
    }
    onStateChange("saved");
  }

  function flush(): Promise<void> {
    clearTimeout(timer);
    if (!running) running = run().finally(() => (running = null));
    return running;
  }

  return {
    changed() {
      pending = true;
      onStateChange("saving");
      schedule(delayMs);
    },
    flush,
    get hasUnsaved() {
      return pending || running !== null;
    },
    dispose() {
      clearTimeout(timer);
    },
  };
}
