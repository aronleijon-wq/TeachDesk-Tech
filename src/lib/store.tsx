import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import type { SaveState } from "./autosave";
import {
  clearLegacyAccount,
  readLegacyAccount,
  readOpenSchool,
  writeOpenSchool,
  type LegacyAccount,
} from "./browser-storage";
import type { EditableProfile } from "./cloud";
import { accessFor, type Access } from "./pricing";
import type { School } from "./schools";
import type { ClassGroup, QuestionDraft, Student, Workspace } from "./types";
import { useCloudWorkspace, useDemoWorkspace, useProfile, useSchools } from "./use-saved-data";
import * as rules from "./workspace";

/** The signed-in teacher as shown in the app. */
export interface Profile {
  name: string;
  email: string;
  role: string;
  school: string;
  /** What the teacher can use right now: Pro (paid, through their school, or a trial) or Free. */
  access: Access;
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

  /** The schools the teacher belongs to. */
  schools: School[];
  /** The school whose shared workspace is open, or null for the teacher's personal one. */
  openSchool: School | null;
  /**
   * Opens a school's workspace, or with null the personal one, and leaves the demo. Fails
   * if changes to the open workspace can't be saved first (e.g. no internet).
   */
  openWorkspace: (schoolId: string | null) => Promise<void>;

  /** True while the example workspace is showing instead of a real one. */
  demoMode: boolean;
  setDemoMode: (on: boolean) => Promise<void>;
  resetDemo: () => void;

  /** Whether the open workspace has reached the database (always "saved" in the demo). */
  saveState: SaveState;
  /** Saves pending changes right away (e.g. before signing out); false if some couldn't be saved. */
  flush: () => Promise<boolean>;

  classById: (id: string) => ClassGroup | undefined;
  studentById: (id: string) => Student | undefined;
  classSize: (classId: string) => number;
  studentStats: (student: Student) => ReturnType<typeof rules.studentStats>;

  setAttendance: Bound<typeof rules.setAttendance>;
  setScore: Bound<typeof rules.setScore>;
  suggestGrading: Bound<typeof rules.suggestGrading>;
  approveGrading: Bound<typeof rules.approveGrading>;
  discardGrading: Bound<typeof rules.discardGrading>;
  scheduleRetake: Bound<typeof rules.scheduleRetake>;
  addExam: Bound<typeof rules.addExam>;
  removeExam: Bound<typeof rules.removeExam>;
  addVersion: Bound<typeof rules.addVersion>;
  approveVersion: Bound<typeof rules.approveVersion>;
  addQuestion: Bound<typeof rules.addQuestion>;
  removeQuestion: Bound<typeof rules.removeQuestion>;
  updateQuestion: Bound<typeof rules.updateQuestion>;
  addStudents: Bound<typeof rules.addStudents>;
  removeStudent: Bound<typeof rules.removeStudent>;
  removeClass: Bound<typeof rules.removeClass>;
  /** Creates a class with its students and returns the new class id. */
  addClass: (details: Omit<ClassGroup, "id">, studentLines: string[]) => string;
  /** Creates an exam for a class, with any questions as Version A, and returns its id. */
  createExam: (details: rules.ExamDetails, questions: QuestionDraft[]) => string;
}

const StoreContext = createContext<StoreValue | null>(null);

/**
 * Loads the signed-in teacher's profile, schools and demo, then opens a workspace: the one
 * they opened last on this device, else their first school's, else their personal one.
 */
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
  const [legacyMoved, setLegacyMoved] = useState(false);
  const [profileDefaults] = useState<EditableProfile>(() => ({
    name: legacy?.profile.name ?? account.name,
    role: legacy?.profile.role ?? "Teacher",
    school: legacy?.profile.school ?? "",
    // New teachers start in the demo so there is something to explore.
    showDemo: legacy?.showDemo ?? true,
  }));

  const teacher = useProfile(userId, profileDefaults);
  const member = useSchools(userId);
  const demo = useDemoWorkspace(userId, legacy?.demo ?? null);
  const [chosenSchool, setChosenSchool] = useState(() => readOpenSchool(userId));

  const stored = teacher.profile;
  const schools = member.schools;
  // Its own memo, so the profile only changes identity when the profile itself changes.
  const profile = useMemo<Profile | null>(
    () =>
      stored &&
      schools && {
        // Teachers who joined through an invitation haven't chosen a name yet.
        name: stored.name || account.name,
        email: account.email,
        role: stored.role,
        school: stored.school,
        access: accessFor(stored.plan, stored.trialEndsAt, schools),
      },
    [stored, schools, account.name, account.email],
  );

  const chooseSchool = useCallback(
    (schoolId: string | null) => {
      writeOpenSchool(userId, schoolId);
      setChosenSchool(schoolId);
    },
    [userId],
  );

  // Once the personal workspace holds everything from the old browser storage, remove it
  // so students' details don't linger on this device.
  const onLegacyMoved = useCallback(() => {
    clearLegacyAccount(userId);
    setLegacyMoved(true);
  }, [userId]);

  if (teacher.status === "error" || member.status === "error") {
    return (
      <LoadError
        onRetry={() => {
          if (teacher.status === "error") void teacher.reload();
          if (member.status === "error") void member.reload();
        }}
      />
    );
  }
  if (!stored || !schools || !profile) {
    return <FullPageMessage>Loading your workspace…</FullPageMessage>;
  }

  const openSchool =
    chosenSchool === null
      ? null
      : (schools.find((s) => s.id === chosenSchool) ?? schools[0] ?? null);

  return (
    <WorkspaceStore
      // A new store for each workspace, so switching always starts from a clean slate.
      key={openSchool?.id ?? "personal"}
      school={openSchool}
      schools={schools}
      onOpenSchool={chooseSchool}
      profile={profile}
      saveProfile={teacher.save}
      demo={demo}
      demoMode={stored.showDemo}
      legacy={openSchool || legacyMoved ? null : legacy}
      onLegacyMoved={onLegacyMoved}
    >
      {children}
    </WorkspaceStore>
  );
}

/** The open workspace — or the demo, while it's showing — and everything the app does with it. */
function WorkspaceStore({
  school,
  schools,
  onOpenSchool,
  profile,
  saveProfile,
  demo,
  demoMode,
  legacy,
  onLegacyMoved,
  children,
}: {
  school: School | null;
  schools: School[];
  onOpenSchool: (schoolId: string | null) => void;
  profile: Profile;
  saveProfile: (changes: Partial<EditableProfile>) => Promise<void>;
  demo: ReturnType<typeof useDemoWorkspace>;
  demoMode: boolean;
  /** Old browser data still to move into the personal workspace, if it's the one open. */
  legacy: LegacyAccount | null;
  onLegacyMoved: () => void;
  children: ReactNode;
}) {
  const cloud = useCloudWorkspace(school?.id ?? null, legacy?.own ?? null);

  const moved = legacy !== null && cloud.status === "ready" && cloud.saveState === "saved";
  useEffect(() => {
    if (moved) onLegacyMoved();
  }, [moved, onLegacyMoved]);

  const { workspace: ws, update } = demoMode ? demo : cloud;
  const { reset: resetDemo } = demo;
  const { saveState: cloudSaveState, flush } = cloud;

  const value = useMemo<StoreValue>(() => {
    // Applies a workspace rule to whichever workspace is showing.
    const bind =
      <A extends unknown[]>(rule: (ws: Workspace, ...args: A) => Workspace) =>
      (...args: A) =>
        update((current) => rule(current, ...args));

    return {
      ...ws,
      profile,
      saveProfile: (changes) => saveProfile(changes),

      schools,
      openSchool: school,
      openWorkspace: async (schoolId) => {
        // Finish saving this workspace before leaving it.
        if (!(await flush())) {
          throw new Error(
            "Some changes haven't been saved yet. Check your internet connection and try again.",
          );
        }
        onOpenSchool(schoolId);
        // Leaving the demo is saved to the profile, so the teacher's other devices follow.
        if (demoMode) await saveProfile({ showDemo: false });
      },

      demoMode,
      setDemoMode: (on) => saveProfile({ showDemo: on }),
      resetDemo,

      saveState: demoMode ? "saved" : cloudSaveState,
      flush,

      classById: (id) => ws.classes.find((c) => c.id === id),
      studentById: (id) => ws.students.find((s) => s.id === id),
      classSize: (classId) => rules.classSize(ws, classId),
      studentStats: (student) => rules.studentStats(ws, student),

      setAttendance: bind(rules.setAttendance),
      setScore: bind(rules.setScore),
      suggestGrading: bind(rules.suggestGrading),
      approveGrading: bind(rules.approveGrading),
      discardGrading: bind(rules.discardGrading),
      scheduleRetake: bind(rules.scheduleRetake),
      addExam: bind(rules.addExam),
      removeExam: bind(rules.removeExam),
      addVersion: bind(rules.addVersion),
      approveVersion: bind(rules.approveVersion),
      addQuestion: bind(rules.addQuestion),
      removeQuestion: bind(rules.removeQuestion),
      updateQuestion: bind(rules.updateQuestion),
      addStudents: bind(rules.addStudents),
      removeStudent: bind(rules.removeStudent),
      removeClass: bind(rules.removeClass),
      addClass: (details, studentLines) => {
        const klass = { id: rules.newId("class"), ...details };
        update((current) => rules.addClass(current, klass, studentLines));
        return klass.id;
      },
      createExam: (details, questions) => {
        const id = rules.newId("exam");
        update((current) => rules.addExam(current, rules.examFor(current, id, details, questions)));
        return id;
      },
    };
  }, [
    ws,
    update,
    profile,
    saveProfile,
    schools,
    school,
    onOpenSchool,
    demoMode,
    resetDemo,
    cloudSaveState,
    flush,
  ]);

  if (cloud.status === "error") {
    return (
      <LoadError onRetry={() => void cloud.reload()}>
        {school && (
          <Button variant="link" className="mt-2" onClick={() => onOpenSchool(null)}>
            Open your personal workspace instead
          </Button>
        )}
      </LoadError>
    );
  }
  if (cloud.status !== "ready") {
    return (
      <FullPageMessage>
        {school ? `Opening ${school.name}…` : "Loading your workspace…"}
      </FullPageMessage>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function LoadError({ onRetry, children }: { onRetry: () => void; children?: ReactNode }) {
  return (
    <FullPageMessage>
      <p>Couldn't load your workspace. Check your internet connection and try again.</p>
      <Button className="mt-4" onClick={onRetry}>
        Try again
      </Button>
      {children}
    </FullPageMessage>
  );
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

/** What needs the teacher's attention in the workspace that is showing. */
export function useAttentionSummary() {
  const { classes, students, exams, retakes, assignments, events } = useStore();
  return useMemo(
    () => rules.attentionSummary({ classes, students, exams, retakes, assignments, events }),
    [classes, students, exams, retakes, assignments, events],
  );
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
