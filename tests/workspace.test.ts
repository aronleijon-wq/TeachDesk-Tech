// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { createDemoWorkspace } from "../src/lib/demo-data.ts";
import { emptyWorkspace, hasContent, normalizeWorkspace, type Exam } from "../src/lib/types.ts";
import * as rules from "../src/lib/workspace.ts";

const newClass = { id: "class-1", name: "Matematik 3C", subject: "Matematik", room: "B214" };

function classWithExam() {
  let ws = rules.addClass(emptyWorkspace(), newClass, [
    "Sara Andersson",
    "Leo Karlsson",
    "William Johansson",
  ]);
  const exam: Exam = {
    id: "exam-1",
    title: "Derivator",
    subject: "Matematik",
    classId: newClass.id,
    date: "2099-01-10",
    time: "08:30",
    durationMin: 90,
    room: "B214",
    totalPoints: 20,
    status: "upcoming",
    objectives: [],
    versions: [],
    attendance: ws.students.map((s) => ({ studentId: s.id, status: "pending" as const })),
  };
  ws = rules.addExam(ws, exam);
  return ws;
}

test("the demo workspace is complete and each copy is independent", () => {
  const demo = createDemoWorkspace();
  assert.equal(demo.classes.length, 3);
  assert.equal(demo.students.length, 81);
  assert.notEqual(createDemoWorkspace().exams[0], demo.exams[0]);
});

test("a new workspace starts empty", () => {
  assert.equal(hasContent(emptyWorkspace()), false);
});

test("pasted student lists are read in the usual formats", () => {
  const cases: [string, string, string][] = [
    ["Sara Andersson", "Sara Andersson", ""],
    ["Andersson, Sara", "Sara Andersson", ""],
    ["Leo Karlsson, leo@skola.se", "Leo Karlsson", "leo@skola.se"],
    ["Karlsson, Leo, leo@skola.se", "Leo Karlsson", "leo@skola.se"],
    ["William\tJohansson\tw@skola.se", "William Johansson", "w@skola.se"],
    ["Nora Strand\tnora@skola.se", "Nora Strand", "nora@skola.se"],
    ["Åkesson; Tuva", "Tuva Åkesson", ""],
  ];
  for (const [line, name, email] of cases)
    assert.deepEqual(rules.parseStudentLine(line), { name, email }, line);
});

test("adding a class adds its students and skips duplicates and blank lines", () => {
  const lines = rules.parseStudentList("Sara Andersson\nLeo Karlsson\n\n  sara  andersson \n");
  const ws = rules.addClass(emptyWorkspace(), newClass, lines);
  assert.deepEqual(ws.classes, [newClass]);
  assert.deepEqual(
    ws.students.map((s) => s.name),
    ["Sara Andersson", "Leo Karlsson"],
  );
});

test("students who join a class are expected at its upcoming exams", () => {
  const ws = rules.addStudents(classWithExam(), newClass.id, ["Nora Strand"]);
  assert.equal(ws.exams[0]!.attendance.length, 4);
});

test("an absent student is queued for a retake, and taken off it when present", () => {
  let ws = classWithExam();
  const leo = ws.students[1]!;
  ws = rules.setAttendance(ws, "exam-1", leo.id, "absent");
  assert.equal(ws.retakes.length, 1);
  assert.equal(ws.retakes[0]!.status, "needs-scheduling");
  ws = rules.setAttendance(ws, "exam-1", leo.id, "completed");
  assert.equal(ws.retakes.length, 0);
});

test("averages and attendance come from exam results", () => {
  let ws = classWithExam();
  const [sara, leo] = ws.students;
  ws = rules.setScore(ws, "exam-1", sara!.id, 15);
  ws = rules.setAttendance(ws, "exam-1", leo!.id, "absent");
  assert.deepEqual(rules.studentStats(ws, ws.students[0]!), {
    average: 75,
    attendanceRate: 100,
    missingWork: 0,
    retakesToSchedule: 0,
    retakeDates: [],
    upToDate: true,
  });
  assert.equal(rules.studentStats(ws, ws.students[1]!).attendanceRate, 0);
  assert.equal(rules.studentStats(ws, ws.students[2]!).average, undefined);
});

test("the calendar shows exams and scheduled retakes", () => {
  let ws = classWithExam();
  ws = rules.setAttendance(ws, "exam-1", ws.students[1]!.id, "absent");
  ws = rules.scheduleRetake(ws, ws.retakes[0]!.id, {
    date: "2099-01-20",
    time: "14:00",
    room: "B210",
  });
  const calendar = rules.calendarEvents(ws, "2099-01-01");
  assert.ok(calendar.some((e) => e.kind === "exam" && e.date === "2099-01-10"));
  assert.ok(
    calendar.some((e) => e.kind === "retake" && e.date === "2099-01-20" && e.students === 1),
  );
});

test("the demo's lessons land on today", () => {
  const today = "2026-09-25";
  assert.equal(
    rules.calendarEvents(createDemoWorkspace(), today).filter((e) => e.date === today).length,
    4,
  );
});

test("removing a student removes their results and retakes", () => {
  let ws = classWithExam();
  const leo = ws.students[1]!;
  ws = rules.setAttendance(ws, "exam-1", leo.id, "absent");
  ws = rules.removeStudent(ws, leo.id);
  assert.equal(ws.retakes.length, 0);
  assert.ok(ws.exams[0]!.attendance.every((a) => a.studentId !== leo.id));
});

test("deleting a class removes everything in it", () => {
  assert.equal(hasContent(rules.removeClass(classWithExam(), newClass.id)), false);
});

test("stored data from an older version loads as a complete workspace", () => {
  assert.deepEqual(normalizeWorkspace(null), emptyWorkspace());
  assert.deepEqual(normalizeWorkspace("not a workspace"), emptyWorkspace());
  const partial = normalizeWorkspace({ classes: [newClass], students: "broken" });
  assert.deepEqual(partial.classes, [newClass]);
  assert.deepEqual(partial.students, []);
  assert.deepEqual(partial.events, []);
});

test("a student who missed an exam isn't up to date until they've taken the retake", () => {
  let ws = classWithExam();
  const leo = ws.students[1]!;
  assert.equal(rules.studentStats(ws, leo).upToDate, true);

  ws = rules.setAttendance(ws, "exam-1", leo.id, "absent");
  assert.equal(rules.studentStats(ws, leo).retakesToSchedule, 1);
  assert.equal(rules.studentStats(ws, leo).upToDate, false);

  ws = rules.scheduleRetake(ws, ws.retakes[0]!.id, {
    date: "2099-01-20",
    time: "14:00",
    room: "B214",
  });
  assert.deepEqual(rules.studentStats(ws, leo).retakeDates, ["2099-01-20"]);
  assert.equal(rules.studentStats(ws, leo).retakesToSchedule, 0);
  assert.equal(rules.studentStats(ws, leo).upToDate, false);

  ws = rules.setAttendance(ws, "exam-1", leo.id, "completed");
  assert.equal(rules.studentStats(ws, leo).upToDate, true);
});

test("the dashboard counts held exams without results, retakes to book and students to follow up", () => {
  let ws = classWithExam();
  const [sara, leo] = ws.students;

  // Before the exam day it's upcoming; afterwards everyone's result is still to enter.
  assert.equal(rules.attentionSummary(ws, "2099-01-01").upcoming.length, 1);
  assert.equal(rules.attentionSummary(ws, "2099-01-01").papersToGrade, 0);
  assert.equal(rules.attentionSummary(ws, "2099-01-11").upcoming.length, 0);
  assert.equal(rules.attentionSummary(ws, "2099-01-11").papersToGrade, 3);

  // Leo was absent: no paper expected from him, but his retake needs booking.
  ws = rules.setAttendance(ws, "exam-1", leo!.id, "absent");
  ws = rules.setScore(ws, "exam-1", sara!.id, 15);
  let summary = rules.attentionSummary(ws, "2099-01-11");
  assert.equal(summary.papersToGrade, 1);
  assert.deepEqual(
    summary.retakesToSchedule.map((r) => r.student.name),
    ["Leo Karlsson"],
  );
  assert.deepEqual(
    summary.studentsToFollowUp.map((s) => s.name),
    ["Leo Karlsson"],
  );

  // A booked retake no longer needs scheduling, but Leo still owes the exam.
  const slot = { date: "2099-01-20", time: "14:00", room: "B214" };
  ws = rules.scheduleRetake(ws, ws.retakes[0]!.id, slot);
  summary = rules.attentionSummary(ws, "2099-01-11");
  assert.equal(summary.retakesToSchedule.length, 0);
  assert.equal(summary.openRetakes.length, 1);
  assert.equal(summary.studentsToFollowUp.length, 1);
});

test("questions written by the teacher make up Version A, and the exam's points follow them", () => {
  let ws = classWithExam();
  const question = (id: string, points: number) => ({
    id,
    number: 0,
    type: "short-answer" as const,
    topic: "Derivator",
    skill: "",
    difficulty: "Medium" as const,
    points,
    prompt: `Fråga ${id}`,
    expectedAnswer: "",
    gradingCriteria: "",
    objective: "",
  });

  ws = rules.addQuestion(ws, "exam-1", question("q1", 4));
  ws = rules.addQuestion(ws, "exam-1", question("q2", 6));
  let exam = ws.exams[0]!;
  assert.equal(exam.versions.length, 1);
  assert.equal(exam.versions[0]!.label, "Version A");
  assert.deepEqual(
    exam.versions[0]!.questions.map((q) => [q.id, q.number]),
    [
      ["q1", 1],
      ["q2", 2],
    ],
  );
  assert.equal(exam.totalPoints, 10);

  ws = rules.updateQuestion(ws, "exam-1", exam.versions[0]!.id, {
    ...question("q2", 8),
    number: 2,
  });
  assert.equal(ws.exams[0]!.totalPoints, 12);

  ws = rules.removeQuestion(ws, "exam-1", "q1");
  exam = ws.exams[0]!;
  assert.deepEqual(
    exam.versions[0]!.questions.map((q) => [q.id, q.number]),
    [["q2", 1]],
  );
  assert.equal(exam.totalPoints, 8);
});

test("a new exam expects the whole class, and its questions become Version A", () => {
  const ws = classWithExam();
  const details = {
    title: "Integraler",
    subject: "Matematik",
    classId: newClass.id,
    date: "2099-02-01",
    time: "10:00",
    durationMin: 60,
    room: "B214",
    totalPoints: 40,
    objectives: ["Beräkna integraler"],
  };
  const question = {
    type: "calculation" as const,
    topic: "Integraler",
    skill: "",
    difficulty: "Easy" as const,
    points: 3,
    prompt: "Beräkna ∫ 2x dx.",
    expectedAnswer: "x² + C",
    gradingCriteria: "",
    objective: "",
  };

  const empty = rules.examFor(ws, "e2", details, []);
  assert.equal(empty.versions.length, 0);
  assert.equal(empty.totalPoints, 40);
  assert.equal(empty.attendance.length, 3);

  const withQuestions = rules.examFor(ws, "e2", details, [question, { ...question, points: 5 }]);
  assert.equal(withQuestions.versions[0]!.label, "Version A");
  assert.deepEqual(
    withQuestions.versions[0]!.questions.map((q) => [q.id, q.number]),
    [
      ["e2-q1", 1],
      ["e2-q2", 2],
    ],
  );
  assert.equal(withQuestions.totalPoints, 8);
});

test("AI grading counts only once approved, with the teacher's points", () => {
  let ws = classWithExam();
  const [sara, leo] = ws.students;
  ws = rules.setAttendance(ws, "exam-1", leo!.id, "absent");
  const grading = {
    versionId: "v-a",
    fileName: "leo.pdf",
    gradedAt: "2099-01-11T10:00:00Z",
    questions: [
      { number: 1, answer: "12x", points: 2, maxPoints: 2, reason: "Rätt.", unsure: false },
      { number: 2, answer: "?", points: 1, maxPoints: 4, reason: "Svårläst.", unsure: true },
    ],
    warnings: [],
    approved: false,
  };
  const record = (id: string) => ws.exams[0]!.attendance.find((a) => a.studentId === id)!;

  ws = rules.suggestGrading(ws, "exam-1", leo!.id, grading);
  assert.equal(record(leo!.id).score, undefined);
  assert.equal(record(leo!.id).status, "absent");

  // The teacher raises question 2 to 3 points and approves: Leo took it, so his retake is done.
  ws = rules.approveGrading(ws, "exam-1", leo!.id, [2, 3]);
  assert.equal(record(leo!.id).score, 5);
  assert.equal(record(leo!.id).status, "completed");
  assert.equal(record(leo!.id).aiGrading?.approved, true);
  assert.equal(record(leo!.id).versionId, "v-a");
  assert.equal(ws.retakes.length, 0);

  // Discarding removes a suggestion; a score entered by hand replaces an AI grading.
  ws = rules.suggestGrading(ws, "exam-1", sara!.id, grading);
  ws = rules.discardGrading(ws, "exam-1", sara!.id);
  assert.equal(record(sara!.id).aiGrading, undefined);
  ws = rules.setScore(ws, "exam-1", leo!.id, 4);
  assert.equal(record(leo!.id).aiGrading, undefined);
  assert.equal(record(leo!.id).score, 4);
});
