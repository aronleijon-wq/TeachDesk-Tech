import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { SaveState } from "./autosave";
import { clearLegacyAccount, readLegacyAccount } from "./browser-storage";
import type { EditableProfile } from "./cloud";
import type { ClassGroup, Student, Workspace } from "./types";
import { useCloudWorkspace, useDemoWorkspace, useProfile } from "./use-saved-data";
import * as rules from "./workspace";

/** The signed-in teacher as shown in the app. */
export interface Profile {
  name: string;
  email: string;
  role: string;
  school: string;
  plan: string;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    (
      (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")
    ).toUpperCase() || "?"
  );
}

/** A workspace rule with the workspace argument filled in by the store. */
type Bound<F> = F extends (ws: Workspace, ...args: infer A) => Workspace
  ? (...args: A) => void
  : never;

interface StoreValue extends Workspace {
  profile: Profile;
  saveProfile: (changes: Pick<EditableProfile, "name" | "role" | "school">) => Promise<void>;

  /** True while the example workspace is showing instead of the teacher's own. */
  demoMode: boolean;
  setDemoMode: (on: boolean) => Promise<void>;
  resetDemo: () => void;

  /** Whether the teacher's own workspace has reached the database (always "saved" in the demo). */
  saveState: SaveState;
  /** Saves pending changes right away (e.g. before signing out); false if some couldn't be saved. */
  flush: () => Promise<boolean>;

  classById: (id: string) => ClassGroup | undefined;
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
  addClass: (details: Omit<ClassGroup, "id">, studentLines: string[]) => string;
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
  // Data saved in this browser by earlier versions of TeachDesk, read once so it can move
  // to the teacher's account.
  const [legacy] = useState(() => readLegacyAccount(userId));
  const [profileDefaults] = useState<EditableProfile>(() => ({
    name: legacy?.profile.name ?? account.name,
    role: legacy?.profile.role ?? "Teacher",
    school: legacy?.profile.school ?? "",
    // New teachers start in the demo so there is something to explore.
    showDemo: legacy?.showDemo ?? true,
  }));

  const teacher = useProfile(userId, profileDefaults);
  const own = useCloudWorkspace(userId, legacy?.own ?? null);
  const demo = useDemoWorkspace(userId, legacy?.demo ?? null);

  // Once everything from the old browser storage is safely in the database, remove it so
  // students' details don't linger on this device.
  const moved = teacher.status === "ready" && own.status === "ready" && own.saveState === "saved";
  useEffect(() => {
    if (legacy && moved) clearLegacyAccount(userId);
  }, [legacy, moved, userId]);

  const stored = teacher.profile;
  const demoMode = stored?.showDemo ?? true;
  const { workspace: ws, update } = demoMode ? demo : own;
  const { save: saveTeacher } = teacher;
  const { reset: resetDemo } = demo;
  const { saveState: ownSaveState, flush } = own;

  // Its own memo, so the profile only changes identity when the profile itself changes.
  const shownProfile = useMemo<Profile | null>(
    () =>
      stored && {
        name: stored.name,
        email: account.email,
        role: stored.role,
        school: stored.school,
        plan: stored.plan,
      },
    [stored, account.email],
  );

  const value = useMemo<StoreValue | null>(() => {
    if (!shownProfile) return null;
    // Applies a workspace rule to whichever workspace is showing.
    const bind =
      <A extends unknown[]>(rule: (ws: Workspace, ...args: A) => Workspace) =>
      (...args: A) =>
        update((current) => rule(current, ...args));

    return {
      ...ws,
      profile: shownProfile,
      saveProfile: (changes) => saveTeacher(changes),

      demoMode,
      setDemoMode: (on) => saveTeacher({ showDemo: on }),
      resetDemo,

      saveState: demoMode ? "saved" : ownSaveState,
      flush,

      classById: (id) => ws.classes.find((c) => c.id === id),
      studentById: (id) => ws.students.find((s) => s.id === id),
      classSize: (classId) => rules.classSize(ws, classId),
      studentStats: (student) => rules.studentStats(ws, student),

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
        const klass = { id: rules.newId("class"), ...details };
        update((current) => rules.addClass(current, klass, studentLines));
        return klass.id;
      },
    };
  }, [shownProfile, saveTeacher, demoMode, resetDemo, ownSaveState, flush, ws, update]);

  if (teacher.status === "error" || own.status === "error") {
    return (
      <FullPageMessage>
        <p>Couldn't load your workspace. Check your internet connection and try again.</p>
        <Button
          className="mt-4"
          onClick={() => {
            if (teacher.status === "error") void teacher.reload();
            if (own.status === "error") void own.reload();
          }}
        >
          Try again
        </Button>
      </FullPageMessage>
    );
  }

  if (!value || teacher.status !== "ready" || own.status !== "ready") {
    return <FullPageMessage>Loading your workspace…</FullPageMessage>;
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function FullPageMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
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
    const all = rules.calendarEvents(
      { classes, students, exams, retakes, assignments, events },
      today,
    );
    return {
      today: all.filter((e) => e.date === today),
      upcoming: all.filter((e) => e.date > today),
    };
  }, [classes, students, exams, retakes, assignments, events]);
}
