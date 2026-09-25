import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createDemoWorkspace } from "./demo-data";
import { emptyWorkspace, type Student, type Workspace } from "./types";
import * as rules from "./workspace";

export interface Profile {
  name: string;
  email: string;
  role: string;
  school: string;
  plan: string;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase() || "?";
}

function profileFor(account: { name: string; email: string }): Profile {
  return { name: account.name, email: account.email, role: "Teacher", school: "", plan: "Trial" };
}

// Each account is saved in this browser under its own key. It holds two workspaces —
// the teacher's own and the demo — and which one is showing. Bump the version when the
// saved shape changes incompatibly; older saves then keep only the profile.
const STORAGE_VERSION = 2;
const storageKey = (userId: string) => `teachdesk:workspace:${userId}`;

type Mode = "own" | "demo";

interface Saved {
  version: number;
  mode: Mode;
  own: Workspace;
  demo: Workspace;
  profile: Profile;
}

function readSaved(key: string): Partial<Saved> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Saved>;
    if (saved.version === STORAGE_VERSION && saved.own && saved.demo) return saved;
    return saved.profile ? { profile: saved.profile } : null;
  } catch {
    return null;
  }
}

/** A workspace rule with the workspace argument filled in by the store. */
type Bound<F> = F extends (ws: Workspace, ...args: infer A) => Workspace ? (...args: A) => void : never;

interface StoreValue extends Workspace {
  demoMode: boolean;
  setDemoMode: (on: boolean) => void;
  resetDemo: () => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;

  classById: (id: string) => Workspace["classes"][number] | undefined;
  studentById: (id: string) => Student | undefined;
  classSize: (classId: string) => number;
  studentStats: (student: Student) => ReturnType<typeof rules.studentStats>;

  setAttendance: Bound<typeof rules.setAttendance>;
  setScore: Bound<typeof rules.setScore>;
  scheduleRetake: Bound<typeof rules.scheduleRetake>;
  addExam: Bound<typeof rules.addExam>;
  addVersion: Bound<typeof rules.addVersion>;
  approveVersion: Bound<typeof rules.approveVersion>;
  updateQuestion: Bound<typeof rules.updateQuestion>;
  setRubric: Bound<typeof rules.setRubric>;
  addStudents: Bound<typeof rules.addStudents>;
  removeStudent: Bound<typeof rules.removeStudent>;
  removeClass: Bound<typeof rules.removeClass>;
  /** Creates a class with its students and returns the new class id. */
  addClass: (details: Parameters<typeof rules.addClass>[1], studentLines: string[]) => string;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({
  userId,
  account,
  children,
}: {
  userId: string;
  account: { name: string; email: string };
  children: ReactNode;
}) {
  const key = storageKey(userId);
  const [defaultProfile] = useState(() => profileFor(account));
  const [mode, setMode] = useState<Mode>("demo");
  const [own, setOwn] = useState<Workspace>(emptyWorkspace);
  const [demo, setDemo] = useState<Workspace>(createDemoWorkspace);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  // False until the saved data has been read, so nothing renders (or is edited)
  // against defaults that are about to be replaced.
  const [loaded, setLoaded] = useState(false);
  const saveFailed = useRef(false);

  const applySaved = useCallback(
    (saved: Partial<Saved> | null) => {
      // New accounts start in the demo so there is something to explore.
      setMode(saved?.mode ?? "demo");
      setOwn(saved?.own ?? emptyWorkspace());
      setDemo(saved?.demo ?? createDemoWorkspace());
      // The sign-in email always wins over a saved one.
      setProfile({ ...(saved?.profile ?? defaultProfile), email: defaultProfile.email });
    },
    [defaultProfile],
  );

  useEffect(() => {
    applySaved(readSaved(key));
    setLoaded(true);
    // Keep other open tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) applySaved(readSaved(key));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applySaved, key]);

  useEffect(() => {
    if (!loaded) return;
    const saved: Saved = { version: STORAGE_VERSION, mode, own, demo, profile };
    try {
      window.localStorage.setItem(key, JSON.stringify(saved));
      saveFailed.current = false;
    } catch {
      if (!saveFailed.current) {
        saveFailed.current = true;
        toast.error("Couldn't save your latest changes", {
          description: "This browser's storage is full or blocked. Changes will be lost on refresh.",
        });
      }
    }
  }, [key, loaded, mode, own, demo, profile]);

  const active = mode === "demo" ? demo : own;
  const setActive = mode === "demo" ? setDemo : setOwn;

  const value = useMemo<StoreValue>(() => {
    // Applies a workspace rule to whichever workspace is showing.
    const bind =
      <A extends unknown[]>(rule: (ws: Workspace, ...args: A) => Workspace) =>
      (...args: A) =>
        setActive((ws) => rule(ws, ...args));

    return {
      ...active,
      demoMode: mode === "demo",
      setDemoMode: (on) => setMode(on ? "demo" : "own"),
      resetDemo: () => setDemo(createDemoWorkspace()),
      profile,
      setProfile,

      classById: (id) => active.classes.find((c) => c.id === id),
      studentById: (id) => active.students.find((s) => s.id === id),
      classSize: (classId) => rules.classSize(active, classId),
      studentStats: (student) => rules.studentStats(active, student),

      setAttendance: bind(rules.setAttendance),
      setScore: bind(rules.setScore),
      scheduleRetake: bind(rules.scheduleRetake),
      addExam: bind(rules.addExam),
      addVersion: bind(rules.addVersion),
      approveVersion: bind(rules.approveVersion),
      updateQuestion: bind(rules.updateQuestion),
      setRubric: bind(rules.setRubric),
      addStudents: bind(rules.addStudents),
      removeStudent: bind(rules.removeStudent),
      removeClass: bind(rules.removeClass),
      addClass: (details, studentLines) => {
        const { ws, classId } = rules.addClass(active, details, studentLines);
        setActive(() => ws);
        return classId;
      },
    };
  }, [active, setActive, mode, profile]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading your workspace…
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useAttentionSummary() {
  const { exams, retakes, assignments, students } = useStore();
  return useMemo(() => {
    const missedExams = exams.flatMap((e) =>
      e.attendance
        .filter((a) => a.status === "absent")
        .flatMap((a) => {
          const student = students.find((s) => s.id === a.studentId);
          return student ? [{ exam: e, student }] : [];
        }),
    );
    const toGrade = assignments.reduce((sum, a) => sum + a.toGrade, 0);
    const needsScheduling = retakes.filter((r) => r.status === "needs-scheduling");
    const missingWork = students.filter((s) => s.missingWork > 0);
    const upcoming = exams.filter((e) => e.status === "upcoming");
    return { missedExams, toGrade, needsScheduling, missingWork, upcoming, retakes };
  }, [exams, retakes, assignments, students]);
}

/** The calendar for the workspace that is showing: lessons plus exams, retakes and deadlines. */
export function useCalendar() {
  const { classes, students, exams, retakes, assignments, events } = useStore();
  return useMemo(() => {
    const today = rules.todayIso();
    const all = rules.calendarEvents({ classes, students, exams, retakes, assignments, events }, today);
    return { today: all.filter((e) => e.date === today), upcoming: all.filter((e) => e.date > today) };
  }, [classes, students, exams, retakes, assignments, events]);
}
