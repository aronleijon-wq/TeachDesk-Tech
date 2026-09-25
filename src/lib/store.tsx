import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  assignments as seedAssignments,
  exams as seedExams,
  retakes as seedRetakes,
  students,
  type Assignment,
  type AttendanceStatus,
  type Exam,
  type ExamVersion,
  type Question,
  type Retake,
} from "./demo-data";

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

// Each account's workspace is saved in this browser under its own key. Bump the
// version when the saved shape changes incompatibly; older saves are then ignored.
const STORAGE_VERSION = 1;
const storageKey = (userId: string) => `teachdesk:workspace:${userId}`;

interface SavedWorkspace {
  version: number;
  exams: Exam[];
  retakes: Retake[];
  assignments: Assignment[];
  demoMode: boolean;
  profile: Profile;
}

function readSaved(key: string): SavedWorkspace | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedWorkspace;
    if (saved?.version !== STORAGE_VERSION || !Array.isArray(saved.exams)) return null;
    return saved;
  } catch {
    return null;
  }
}

interface StoreValue {
  exams: Exam[];
  retakes: Retake[];
  assignments: Assignment[];
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  setAttendance: (examId: string, studentId: string, status: AttendanceStatus) => void;
  setScore: (examId: string, studentId: string, score: number) => void;
  scheduleRetake: (retakeId: string, date: string, time: string, room: string, versionId?: string | undefined) => void;
  addVersion: (examId: string, version: ExamVersion) => void;
  updateQuestion: (examId: string, versionId: string, question: Question) => void;
  addExam: (exam: Exam) => void;
  setRubric: (assignmentId: string, rubric: NonNullable<Assignment["rubric"]>) => void;
  approveVersion: (examId: string, versionId: string) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  resetWorkspace: () => void;
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
  const [exams, setExams] = useState<Exam[]>(seedExams);
  const [retakes, setRetakes] = useState<Retake[]>(seedRetakes);
  const [assignments, setAssignments] = useState<Assignment[]>(seedAssignments);
  const [demoMode, setDemoMode] = useState(true);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  // False until the saved workspace has been read, so nothing renders (or is
  // edited) against seed data that is about to be replaced.
  const [loaded, setLoaded] = useState(false);
  const saveFailed = useRef(false);

  const applySaved = useCallback((saved: SavedWorkspace | null) => {
    setExams(saved?.exams ?? seedExams);
    setRetakes(saved?.retakes ?? seedRetakes);
    setAssignments(saved?.assignments ?? seedAssignments);
    setDemoMode(saved?.demoMode ?? true);
    // The sign-in email always wins over a saved one.
    setProfile({ ...(saved?.profile ?? defaultProfile), email: defaultProfile.email });
  }, [defaultProfile]);

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
    const saved: SavedWorkspace = { version: STORAGE_VERSION, exams, retakes, assignments, demoMode, profile };
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
  }, [key, loaded, exams, retakes, assignments, demoMode, profile]);

  const resetWorkspace = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage blocked: resetting the in-memory state is still useful.
    }
    applySaved(null);
  }, [applySaved, key]);

  const setAttendance = useCallback((examId: string, studentId: string, status: AttendanceStatus) => {
    setExams((prev) =>
      prev.map((e) =>
        e.id !== examId
          ? e
          : {
              ...e,
              attendance: e.attendance.map((a) =>
                a.studentId === studentId ? { ...a, status } : a,
              ),
            },
      ),
    );
    setRetakes((prev) => {
      const exists = prev.some((r) => r.examId === examId && r.studentId === studentId);
      if (status === "absent" && !exists) {
        return [
          ...prev,
          { id: `r-${examId}-${studentId}`, examId, studentId, status: "needs-scheduling" as const },
        ];
      }
      if (status !== "absent" && exists) {
        return prev.filter((r) => !(r.examId === examId && r.studentId === studentId));
      }
      return prev;
    });
  }, []);

  const setScore = useCallback((examId: string, studentId: string, score: number) => {
    setExams((prev) =>
      prev.map((e) =>
        e.id !== examId
          ? e
          : {
              ...e,
              attendance: e.attendance.map((a) =>
                a.studentId === studentId ? { ...a, score, status: "completed" as const } : a,
              ),
            },
      ),
    );
  }, []);

  const scheduleRetake = useCallback(
    (retakeId: string, date: string, time: string, room: string, versionId?: string | undefined) => {
      setRetakes((prev) =>
        prev.map((r) =>
          r.id === retakeId
            ? { ...r, status: "scheduled" as const, date, time, room, ...(versionId ? { versionId } : {}) }
            : r,
        ),
      );
    },
    [],
  );

  const addVersion = useCallback((examId: string, version: ExamVersion) => {
    setExams((prev) =>
      prev.map((e) => (e.id === examId ? { ...e, versions: [...e.versions, version] } : e)),
    );
  }, []);

  const updateQuestion = useCallback((examId: string, versionId: string, question: Question) => {
    setExams((prev) =>
      prev.map((e) =>
        e.id !== examId
          ? e
          : {
              ...e,
              versions: e.versions.map((v) =>
                v.id !== versionId
                  ? v
                  : { ...v, questions: v.questions.map((q) => (q.id === question.id ? question : q)) },
              ),
            },
      ),
    );
  }, []);

  const approveVersion = useCallback((examId: string, versionId: string) => {
    setExams((prev) =>
      prev.map((e) =>
        e.id !== examId
          ? e
          : { ...e, versions: e.versions.map((v) => (v.id === versionId ? { ...v, approved: true } : v)) },
      ),
    );
  }, []);

  const addExam = useCallback((exam: Exam) => setExams((prev) => [exam, ...prev]), []);

  const setRubric = useCallback((assignmentId: string, rubric: NonNullable<Assignment["rubric"]>) => {
    setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? { ...a, rubric } : a)));
  }, []);

  const value = useMemo(
    () => ({
      exams, retakes, assignments, demoMode, setDemoMode,
      setAttendance, setScore, scheduleRetake, addVersion, updateQuestion, addExam, setRubric,
      approveVersion, profile, setProfile, resetWorkspace,
    }),
    [exams, retakes, assignments, demoMode, setAttendance, setScore, scheduleRetake, addVersion, updateQuestion, addExam, setRubric, approveVersion, profile, resetWorkspace],
  );

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
  const { exams, retakes, assignments } = useStore();
  return useMemo(() => {
    const missedExams = exams.flatMap((e) =>
      e.attendance
        .filter((a) => a.status === "absent")
        .map((a) => ({ exam: e, student: students.find((s) => s.id === a.studentId)! })),
    );
    const toGrade = assignments.reduce((sum, a) => sum + a.toGrade, 0);
    const needsScheduling = retakes.filter((r) => r.status === "needs-scheduling");
    const missingWork = students.filter((s) => s.missingWork > 0);
    const upcoming = exams.filter((e) => e.status === "upcoming");
    return { missedExams, toGrade, needsScheduling, missingWork, upcoming, retakes };
  }, [exams, retakes, assignments]);
}
