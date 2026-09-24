import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>(seedExams);
  const [retakes, setRetakes] = useState<Retake[]>(seedRetakes);
  const [assignments, setAssignments] = useState<Assignment[]>(seedAssignments);
  const [demoMode, setDemoMode] = useState(true);

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

  const addExam = useCallback((exam: Exam) => setExams((prev) => [exam, ...prev]), []);

  const setRubric = useCallback((assignmentId: string, rubric: NonNullable<Assignment["rubric"]>) => {
    setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? { ...a, rubric } : a)));
  }, []);

  const value = useMemo(
    () => ({
      exams, retakes, assignments, demoMode, setDemoMode,
      setAttendance, setScore, scheduleRetake, addVersion, updateQuestion, addExam, setRubric,
    }),
    [exams, retakes, assignments, demoMode, setAttendance, setScore, scheduleRetake, addVersion, updateQuestion, addExam, setRubric],
  );

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
