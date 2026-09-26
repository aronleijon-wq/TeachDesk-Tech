// An exam version laid out for paper, in the teacher's language: the student copy with room
// for the answers, or the teacher's answer key (facit).
import { defineMessages, formatLongDate, useLanguage, useMessages } from "@/lib/i18n";
import type { Exam, ExamVersion, Question } from "@/lib/types";

const messages = defineMessages({
  en: {
    answerKey: "answer key",
    minutes: "minutes",
    points: "points",
    name: "Name",
    className: "Class",
    pointsShort: "p",
    answer: "Answer",
    criteria: "Marking",
  },
  sv: {
    answerKey: "facit",
    minutes: "minuter",
    points: "poäng",
    name: "Namn",
    className: "Klass",
    pointsShort: "p",
    answer: "Svar",
    criteria: "Bedömning",
  },
});

/** How many ruled lines to leave for an answer; calculations get a box of that height. */
function answerLines(q: Question) {
  if (q.type === "multiple-choice") return 1;
  if (q.type === "short-answer") return 2;
  return Math.min(12, 3 + q.points * 2);
}

export function PrintableExam({
  exam,
  version,
  answers,
  heading,
}: {
  exam: Exam;
  version: ExamVersion;
  /** The answer key instead of the student copy. */
  answers: boolean;
  /** School and class, at the top of the page. */
  heading: string;
}) {
  const points = version.questions.reduce((sum, q) => sum + q.points, 0);
  const { language } = useLanguage();
  const t = useMessages(messages);
  return (
    <article className="rounded-lg border border-border bg-white p-10 text-black shadow-card print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b border-black/20 pb-4">
        <div className="flex justify-between gap-4 text-sm">
          <span>{heading}</span>
          <span>{exam.date && formatLongDate(exam.date, language)}</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">
          {exam.title}
          {answers && ` — ${t.answerKey}`}
        </h1>
        <p className="mt-1 text-sm">
          {version.label} · {exam.durationMin} {t.minutes} · {points} {t.points}
        </p>
        {!answers && (
          <p className="mt-6 flex gap-8 text-sm">
            <span>{t.name}: ______________________________</span>
            <span>{t.className}: __________</span>
          </p>
        )}
      </header>

      <ol className="mt-6 space-y-7">
        {version.questions.map((q) => (
          <li key={q.id} className="break-inside-avoid">
            <div className="flex justify-between gap-4">
              <p className="whitespace-pre-line">
                <span className="font-semibold">{q.number}.</span> {q.prompt}
              </p>
              <span className="shrink-0 text-sm">
                ({q.points} {t.pointsShort})
              </span>
            </div>
            {answers ? (
              <div className="mt-2 rounded border border-black/15 bg-black/[0.04] p-3 text-sm">
                <p>
                  <span className="font-medium">{t.answer}:</span> {q.expectedAnswer || "—"}
                </p>
                {q.gradingCriteria && (
                  <p className="mt-1">
                    <span className="font-medium">{t.criteria}:</span> {q.gradingCriteria}
                  </p>
                )}
              </div>
            ) : q.type === "calculation" ? (
              <div
                className="mt-3 rounded border border-black/30"
                style={{ height: `${answerLines(q) * 1.75}rem` }}
              />
            ) : (
              <div className="mt-3 space-y-7">
                {Array.from({ length: answerLines(q) }, (_, i) => (
                  <div key={i} className="border-b border-black/30" />
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}
