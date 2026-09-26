// The notes the dashboard and the notification bell show for what needs the teacher's
// attention, worded once so both always agree. Kept free of React so it can be tested.
import type { AttentionSummary } from "./workspace";

export type AttentionKind = "retakes" | "exam-results" | "assignments" | "follow-up";

export interface AttentionNote {
  kind: AttentionKind;
  title: string;
  detail: string;
  /** Students it's about, for a short list. */
  names: string[];
  /** Where to deal with it: one exam, or the page listing everything. */
  to: string;
  params?: { examId: string };
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const unique = <T>(items: T[]) => [...new Set(items)];

/** "Derivatives — Exam 1", or "Derivatives — Exam 1 and 2 more". */
function listed(titles: string[]) {
  const [first = "", ...rest] = unique(titles);
  return rest.length > 0 ? `${first} and ${rest.length} more` : first;
}

/** Opens the exam if everything is about one exam, otherwise the exams page. */
const examLink = (examIds: string[]): Pick<AttentionNote, "to" | "params"> => {
  const [only, ...others] = unique(examIds);
  return only && others.length === 0
    ? { to: "/app/exams/$examId", params: { examId: only } }
    : { to: "/app/exams" };
};

/** The notes to show, most urgent first; empty when nothing needs attention. */
export function attentionNotes(
  summary: AttentionSummary,
  className: (classId: string) => string | undefined,
): AttentionNote[] {
  const notes: AttentionNote[] = [];
  const { retakesToSchedule, examsToGrade, assignmentsToGrade, studentsToFollowUp } = summary;

  if (retakesToSchedule.length > 0) {
    notes.push({
      kind: "retakes",
      title: count(retakesToSchedule.length, "retake needs scheduling", "retakes need scheduling"),
      detail: `Missed ${listed(retakesToSchedule.map((r) => r.exam.title))}`,
      names: unique(retakesToSchedule.map((r) => r.student.name)),
      ...examLink(retakesToSchedule.map((r) => r.exam.id)),
    });
  }

  if (summary.papersToGrade > 0) {
    notes.push({
      kind: "exam-results",
      title: count(summary.papersToGrade, "exam paper to grade", "exam papers to grade"),
      detail: listed(examsToGrade.map((e) => e.exam.title)),
      names: [],
      ...examLink(examsToGrade.map((e) => e.exam.id)),
    });
  }

  if (summary.submissionsToGrade > 0) {
    notes.push({
      kind: "assignments",
      title: count(
        summary.submissionsToGrade,
        "assignment submission to grade",
        "assignment submissions to grade",
      ),
      detail: unique(assignmentsToGrade.map((a) => className(a.classId) ?? a.subject)).join(", "),
      names: [],
      to: "/app/assignments",
    });
  }

  if (studentsToFollowUp.length > 0) {
    notes.push({
      kind: "follow-up",
      title: count(
        studentsToFollowUp.length,
        "student has missing work",
        "students have missing work",
      ),
      detail: "Missed exams or assignments to follow up",
      names: studentsToFollowUp.map((s) => s.name),
      to: "/app/students",
    });
  }

  return notes;
}
