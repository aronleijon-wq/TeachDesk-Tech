// The notes the dashboard and the notification bell show for what needs the teacher's
// attention, worded once so both always agree. Kept free of React so it can be tested.
import { defineMessages, type Language } from "./messages";
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

const messages = defineMessages({
  en: {
    retakes: (n: number) => count(n, "retake needs scheduling", "retakes need scheduling"),
    missed: (exams: string) => `Missed ${exams}`,
    papers: (n: number) => count(n, "exam paper to grade", "exam papers to grade"),
    submissions: (n: number) =>
      count(n, "assignment submission to grade", "assignment submissions to grade"),
    followUp: (n: number) => count(n, "student has missing work", "students have missing work"),
    followUpDetail: "Missed exams or assignments to follow up",
    andMore: (first: string, more: number) => `${first} and ${more} more`,
  },
  sv: {
    retakes: (n) => `${n} omprov behöver bokas`,
    missed: (exams) => `Missade ${exams}`,
    papers: (n) => `${n} prov att rätta`,
    submissions: (n) => count(n, "inlämning att bedöma", "inlämningar att bedöma"),
    followUp: (n) => count(n, "elev att följa upp", "elever att följa upp"),
    followUpDetail: "Missade prov eller uppgifter",
    andMore: (first, more) => `${first} och ${more} till`,
  },
});

/** "Derivatives — Exam 1", or "Derivatives — Exam 1 and 2 more". */
function listed(titles: string[], language: Language) {
  const [first = "", ...rest] = unique(titles);
  return rest.length > 0 ? messages[language].andMore(first, rest.length) : first;
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
  language: Language,
): AttentionNote[] {
  const t = messages[language];
  const notes: AttentionNote[] = [];
  const { retakesToSchedule, examsToGrade, assignmentsToGrade, studentsToFollowUp } = summary;

  if (retakesToSchedule.length > 0) {
    notes.push({
      kind: "retakes",
      title: t.retakes(retakesToSchedule.length),
      detail: t.missed(
        listed(
          retakesToSchedule.map((r) => r.exam.title),
          language,
        ),
      ),
      names: unique(retakesToSchedule.map((r) => r.student.name)),
      ...examLink(retakesToSchedule.map((r) => r.exam.id)),
    });
  }

  if (summary.papersToGrade > 0) {
    notes.push({
      kind: "exam-results",
      title: t.papers(summary.papersToGrade),
      detail: listed(
        examsToGrade.map((e) => e.exam.title),
        language,
      ),
      names: [],
      ...examLink(examsToGrade.map((e) => e.exam.id)),
    });
  }

  if (summary.submissionsToGrade > 0) {
    notes.push({
      kind: "assignments",
      title: t.submissions(summary.submissionsToGrade),
      detail: unique(assignmentsToGrade.map((a) => className(a.classId) ?? a.subject)).join(", "),
      names: [],
      to: "/app/assignments",
    });
  }

  if (studentsToFollowUp.length > 0) {
    notes.push({
      kind: "follow-up",
      title: t.followUp(studentsToFollowUp.length),
      detail: t.followUpDetail,
      names: studentsToFollowUp.map((s) => s.name),
      to: "/app/students",
    });
  }

  return notes;
}
