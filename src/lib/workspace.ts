// Rules for changing a workspace. Every function is pure: it takes a workspace
// and returns a new one, so the store can apply it to whichever workspace is active.
import type {
  Assignment,
  AttendanceStatus,
  CalendarEvent,
  ClassGroup,
  Exam,
  ExamVersion,
  Question,
  Student,
  Workspace,
} from "./types";

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const mapExam = (ws: Workspace, examId: string, fn: (e: Exam) => Exam): Workspace => ({
  ...ws,
  exams: ws.exams.map((e) => (e.id === examId ? fn(e) : e)),
});

// --- Exams ------------------------------------------------------------------

/** Marking a student absent puts them in the retake queue; marking them present takes them out. */
export function setAttendance(ws: Workspace, examId: string, studentId: string, status: AttendanceStatus): Workspace {
  const next = mapExam(ws, examId, (e) => ({
    ...e,
    attendance: e.attendance.map((a) => (a.studentId === studentId ? { ...a, status } : a)),
  }));
  const queued = ws.retakes.some((r) => r.examId === examId && r.studentId === studentId);
  if (status === "absent" && !queued) {
    return {
      ...next,
      retakes: [...ws.retakes, { id: `r-${examId}-${studentId}`, examId, studentId, status: "needs-scheduling" }],
    };
  }
  if (status !== "absent" && queued) {
    return { ...next, retakes: ws.retakes.filter((r) => !(r.examId === examId && r.studentId === studentId)) };
  }
  return next;
}

export const setScore = (ws: Workspace, examId: string, studentId: string, score: number): Workspace =>
  mapExam(ws, examId, (e) => ({
    ...e,
    attendance: e.attendance.map((a) => (a.studentId === studentId ? { ...a, score, status: "completed" } : a)),
  }));

export const scheduleRetake = (
  ws: Workspace,
  retakeId: string,
  slot: { date: string; time: string; room: string; versionId?: string | undefined },
): Workspace => ({
  ...ws,
  retakes: ws.retakes.map((r) =>
    r.id === retakeId
      ? { ...r, status: "scheduled", date: slot.date, time: slot.time, room: slot.room, ...(slot.versionId ? { versionId: slot.versionId } : {}) }
      : r,
  ),
});

export const addExam = (ws: Workspace, exam: Exam): Workspace => ({ ...ws, exams: [exam, ...ws.exams] });

export const addVersion = (ws: Workspace, examId: string, version: ExamVersion): Workspace =>
  mapExam(ws, examId, (e) => ({ ...e, versions: [...e.versions, version] }));

export const approveVersion = (ws: Workspace, examId: string, versionId: string): Workspace =>
  mapExam(ws, examId, (e) => ({ ...e, versions: e.versions.map((v) => (v.id === versionId ? { ...v, approved: true } : v)) }));

export const updateQuestion = (ws: Workspace, examId: string, versionId: string, question: Question): Workspace =>
  mapExam(ws, examId, (e) => ({
    ...e,
    versions: e.versions.map((v) =>
      v.id === versionId ? { ...v, questions: v.questions.map((q) => (q.id === question.id ? question : q)) } : v,
    ),
  }));

export const setRubric = (ws: Workspace, assignmentId: string, rubric: NonNullable<Assignment["rubric"]>): Workspace => ({
  ...ws,
  assignments: ws.assignments.map((a) => (a.id === assignmentId ? { ...a, rubric } : a)),
});

// --- Classes and students -----------------------------------------------------

export function addClass(ws: Workspace, details: Omit<ClassGroup, "id">, studentNames: string[]): { ws: Workspace; classId: string } {
  const classId = newId("class");
  const withClass = { ...ws, classes: [...ws.classes, { id: classId, ...details }] };
  return { ws: addStudents(withClass, classId, studentNames), classId };
}

/**
 * Reads one pasted line into a name and optional email. Handles the formats class lists
 * usually come in: "Sara Andersson", "Andersson, Sara" (surname first), spreadsheet
 * columns ("Sara ⇥ Andersson ⇥ sara@skola.se") and an email anywhere on the line.
 */
export function parseStudentLine(line: string): { name: string; email: string } {
  const byTab = line.includes("\t");
  const parts = line.split(byTab ? /\t/ : /[,;]/).map((p) => p.trim().replace(/\s+/g, " ")).filter(Boolean);
  const email = parts.find((p) => p.includes("@")) ?? "";
  const nameParts = parts.filter((p) => p !== email);
  // Columns are read left to right; "Surname, First name" is turned around.
  const name = !byTab && nameParts.length === 2 ? `${nameParts[1]} ${nameParts[0]}` : nameParts.join(" ");
  return { name, email };
}

/** Adds students from pasted lines (see parseStudentLine). Names already in the class are skipped. */
export function addStudents(ws: Workspace, classId: string, lines: string[]): Workspace {
  const existing = new Set(ws.students.filter((s) => s.classId === classId).map((s) => s.name.toLowerCase()));
  const added: Student[] = [];
  for (const line of lines) {
    const { name, email } = parseStudentLine(line);
    if (!name || existing.has(name.toLowerCase())) continue;
    existing.add(name.toLowerCase());
    added.push({ id: newId("student"), name, classId, email, missingWork: 0 });
  }
  if (added.length === 0) return ws;
  // Students who join a class are also expected at its exams that haven't been held yet.
  const exams = ws.exams.map((e) =>
    e.classId === classId && e.status !== "completed"
      ? { ...e, attendance: [...e.attendance, ...added.map((s) => ({ studentId: s.id, status: "pending" as const }))] }
      : e,
  );
  return { ...ws, students: [...ws.students, ...added], exams };
}

/** Parses a pasted student list into lines, ignoring blanks. */
export const parseStudentList = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export function removeStudent(ws: Workspace, studentId: string): Workspace {
  return {
    ...ws,
    students: ws.students.filter((s) => s.id !== studentId),
    exams: ws.exams.map((e) => ({ ...e, attendance: e.attendance.filter((a) => a.studentId !== studentId) })),
    retakes: ws.retakes.filter((r) => r.studentId !== studentId),
  };
}

/** Removes a class together with its students, exams, retakes and assignments. */
export function removeClass(ws: Workspace, classId: string): Workspace {
  const examIds = new Set(ws.exams.filter((e) => e.classId === classId).map((e) => e.id));
  return {
    ...ws,
    classes: ws.classes.filter((c) => c.id !== classId),
    students: ws.students.filter((s) => s.classId !== classId),
    exams: ws.exams.filter((e) => !examIds.has(e.id)),
    retakes: ws.retakes.filter((r) => !examIds.has(r.examId)),
    assignments: ws.assignments.filter((a) => a.classId !== classId),
    events: ws.events.filter((ev) => ev.classId !== classId),
  };
}

// --- Figures ------------------------------------------------------------------

export const classSize = (ws: Workspace, classId: string) => ws.students.filter((s) => s.classId === classId).length;

/** A student's average and attendance: fixed figures for demo students, otherwise from their exam results. */
export function studentStats(ws: Workspace, student: Student) {
  const records = ws.exams.flatMap((e) =>
    e.attendance.filter((a) => a.studentId === student.id).map((a) => ({ ...a, total: e.totalPoints })),
  );
  const scored = records.filter((r) => r.score != null && r.total > 0);
  const held = records.filter((r) => r.status !== "pending");
  const average =
    student.average ?? (scored.length ? Math.round((scored.reduce((s, r) => s + r.score! / r.total, 0) / scored.length) * 1000) / 10 : undefined);
  const attendanceRate =
    student.attendanceRate ??
    (held.length ? Math.round((held.filter((r) => r.status === "completed").length / held.length) * 100) : undefined);
  return { average, attendanceRate, missingWork: student.missingWork };
}

// --- Calendar -----------------------------------------------------------------

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Lessons and planning from the workspace, plus exams, scheduled retakes and assignment deadlines. */
export function calendarEvents(ws: Workspace, today = todayIso()): CalendarEvent[] {
  const lessons = ws.events.map((ev) => ({ ...ev, date: ev.date === "today" ? today : ev.date }));
  const exams: CalendarEvent[] = ws.exams
    .filter((e) => e.status !== "draft")
    .map((e) => ({
      id: `exam-${e.id}`,
      date: e.date,
      time: e.time,
      title: e.title,
      classId: e.classId,
      room: e.room,
      kind: "exam",
      students: e.attendance.length || classSize(ws, e.classId),
    }));
  const retakeSlots = new Map<string, CalendarEvent>();
  for (const r of ws.retakes) {
    if (r.status !== "scheduled" || !r.date) continue;
    const exam = ws.exams.find((e) => e.id === r.examId);
    const key = `${r.examId}|${r.date}|${r.time}|${r.room}`;
    const slot = retakeSlots.get(key);
    if (slot) slot.students = (slot.students ?? 0) + 1;
    else
      retakeSlots.set(key, {
        id: `retake-${key}`,
        date: r.date,
        time: r.time ?? "",
        title: `Retake — ${exam?.title ?? "exam"}`,
        ...(exam ? { classId: exam.classId } : {}),
        ...(r.room ? { room: r.room } : {}),
        kind: "retake",
        students: 1,
      });
  }
  const deadlines: CalendarEvent[] = ws.assignments.map((a) => ({
    id: `deadline-${a.id}`,
    date: a.due,
    time: "23:59",
    title: `Deadline — ${a.title}`,
    classId: a.classId,
    kind: "deadline",
  }));
  return [...lessons, ...exams, ...retakeSlots.values(), ...deadlines].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );
}
