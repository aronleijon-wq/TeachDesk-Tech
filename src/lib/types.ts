// Shared data types for a TeachDesk workspace.

export type ExamStatus = "draft" | "upcoming" | "completed" | "needs-grading";
export type AttendanceStatus = "completed" | "absent" | "pending";
export type RetakeStatus = "needs-scheduling" | "scheduled" | "completed";

export interface Student {
  id: string;
  name: string;
  classId: string;
  email: string;
  /** Demo students carry fixed figures; real students' figures are computed from exam results. */
  average?: number | undefined;
  attendanceRate?: number | undefined;
  missingWork: number;
}

export interface ClassGroup {
  id: string;
  name: string;
  subject: string;
  room: string;
}

export interface Question {
  id: string;
  number: number;
  type: "multiple-choice" | "short-answer" | "open-ended" | "calculation";
  topic: string;
  skill: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  prompt: string;
  expectedAnswer: string;
  gradingCriteria: string;
  objective: string;
}

/** A question before it's added to an exam, which gives it its id and number. */
export type QuestionDraft = Omit<Question, "id" | "number">;

export interface ExamVersion {
  id: string;
  label: string;
  origin: "original" | "ai-generated";
  createdAt: string;
  approved: boolean;
  questions: Question[];
  equivalenceScore?: number | undefined;
}

export interface Attendance {
  studentId: string;
  status: AttendanceStatus;
  score?: number | undefined;
  versionId?: string | undefined;
  /** AI's suggested grading of the student's paper; it only counts once the teacher approves it. */
  aiGrading?: AiGrading | undefined;
}

/** AI's suggested points for one student's paper, question by question. */
export interface AiGrading {
  /** The version of the exam the paper was graded against. */
  versionId: string;
  /** The uploaded file, so the teacher can find the paper. */
  fileName: string;
  /** When AI graded it (ISO time). */
  gradedAt: string;
  questions: {
    number: number;
    /** What the student wrote, in short. */
    answer: string;
    points: number;
    maxPoints: number;
    reason: string;
    /** Hard to read or ambiguous: worth a closer look. */
    unsure: boolean;
  }[];
  warnings: string[];
  approved: boolean;
}

export interface Retake {
  id: string;
  examId: string;
  studentId: string;
  status: RetakeStatus;
  date?: string | undefined;
  time?: string | undefined;
  room?: string | undefined;
  versionId?: string | undefined;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  classId: string;
  date: string;
  time: string;
  durationMin: number;
  room: string;
  totalPoints: number;
  status: ExamStatus;
  objectives: string[];
  versions: ExamVersion[];
  attendance: Attendance[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  classId: string;
  due: string;
  submitted: number;
  total: number;
  toGrade: number;
  rubric?: { criterion: string; points: number; descriptor: string }[] | undefined;
}

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  classId?: string;
  room?: string;
  kind: "lesson" | "exam" | "retake" | "planning" | "deadline";
  students?: number;
}

/** Everything one teacher works with. There is one real workspace and one demo workspace per account. */
export interface Workspace {
  classes: ClassGroup[];
  students: Student[];
  exams: Exam[];
  retakes: Retake[];
  assignments: Assignment[];
  /** Lessons and planning slots. Exams, retakes and deadlines are added to the calendar automatically. */
  events: CalendarEvent[];
}

export const emptyWorkspace = (): Workspace => ({
  classes: [],
  students: [],
  exams: [],
  retakes: [],
  assignments: [],
  events: [],
});

/**
 * Turns stored data back into a complete workspace. Saves made by an older version of
 * TeachDesk may lack newer lists; those start empty instead of breaking the app.
 */
export function normalizeWorkspace(raw: unknown): Workspace {
  const stored = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const list = <T>(key: keyof Workspace): T[] =>
    Array.isArray(stored[key]) ? (stored[key] as T[]) : [];
  return {
    classes: list("classes"),
    students: list("students"),
    exams: list("exams"),
    retakes: list("retakes"),
    assignments: list("assignments"),
    events: list("events"),
  };
}

/** True when a workspace holds anything the teacher created. */
export const hasContent = (ws: Workspace) => Object.values(ws).some((items) => items.length > 0);
