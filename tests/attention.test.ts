// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { attentionNotes } from "@/lib/attention";
import { emptyWorkspace, type Exam, type Workspace } from "@/lib/types";
import * as rules from "@/lib/workspace";

const klass = { id: "c1", name: "Matematik 3C", subject: "Matematik", room: "B214" };
const afterTheExams = "2099-02-01";
const className = () => "Matematik 3C";

function withExam(ws: Workspace, id: string, title: string): Workspace {
  const exam: Exam = {
    id,
    title,
    subject: "Matematik",
    classId: klass.id,
    date: "2099-01-10",
    time: "08:30",
    durationMin: 60,
    room: "B214",
    totalPoints: 20,
    status: "upcoming",
    objectives: [],
    versions: [],
    attendance: ws.students.map((s) => ({ studentId: s.id, status: "pending" as const })),
  };
  return rules.addExam(ws, exam);
}

function classOfTwo() {
  const ws = rules.addClass(emptyWorkspace(), klass, ["Sara Andersson", "Leo Karlsson"]);
  const [sara, leo] = ws.students;
  return { ws, sara: sara!, leo: leo! };
}

test("with nothing waiting there are no notes", () => {
  const { ws } = classOfTwo();
  assert.deepEqual(attentionNotes(rules.attentionSummary(ws, afterTheExams), className), []);
});

test("notes say what needs doing, most urgent first, and open the exam it's about", () => {
  const { ws: start, sara, leo } = classOfTwo();
  let ws = withExam(start, "e1", "Derivator");
  ws = rules.setAttendance(ws, "e1", leo.id, "absent");
  ws = rules.setAttendance(ws, "e1", sara.id, "completed");

  const notes = attentionNotes(rules.attentionSummary(ws, afterTheExams), className);
  assert.deepEqual(
    notes.map((n) => [n.kind, n.title, n.detail]),
    [
      ["retakes", "1 retake needs scheduling", "Missed Derivator"],
      ["exam-results", "1 exam paper to grade", "Derivator"],
      ["follow-up", "1 student has missing work", "Missed exams or assignments to follow up"],
    ],
  );
  assert.deepEqual(notes[0]!.names, ["Leo Karlsson"]);
  assert.deepEqual([notes[0]!.to, notes[0]!.params], ["/app/exams/$examId", { examId: "e1" }]);
});

test("things spread over several exams link to the exams page", () => {
  const { ws: start, sara, leo } = classOfTwo();
  let ws = withExam(withExam(start, "e1", "Derivator"), "e2", "Integraler");
  ws = rules.setAttendance(ws, "e1", leo.id, "absent");
  ws = rules.setAttendance(ws, "e2", sara.id, "absent");

  const [retakes, results] = attentionNotes(rules.attentionSummary(ws, afterTheExams), className);
  assert.equal(retakes!.title, "2 retakes need scheduling");
  assert.equal(retakes!.detail, "Missed Integraler and 1 more");
  assert.equal(retakes!.to, "/app/exams");
  assert.equal(retakes!.params, undefined);
  assert.equal(results!.title, "2 exam papers to grade");
});
