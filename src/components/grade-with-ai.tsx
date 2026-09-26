import { CheckCircle2, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DropZone, ProNote } from "@/components/exam-draft";
import { Panel, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gradePaper, type GradedPaper } from "@/lib/exam-ai.functions";
import { matchStudent } from "@/lib/grading";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { readPickedFile } from "@/lib/picked-file";
import { useStore } from "@/lib/store";
import type { AiGrading, Exam, ExamVersion } from "@/lib/types";

/** Papers graded at the same time. */
const AT_ONCE = 3;

/** An uploaded test on its way through grading. */
interface Paper {
  id: number;
  file: File;
  status: "waiting" | "grading" | "done" | "unmatched" | "failed";
  /** The version it was graded against. */
  versionId?: string;
  result?: GradedPaper;
  studentId?: string;
  error?: string | undefined;
}

const sum = (numbers: number[]) => numbers.reduce((total, n) => total + n, 0);

const messages = defineMessages({
  en: {
    approvedMany: (n: number) => `${n} students approved`,
    pdfOrPhoto: "Upload the test as a PDF or a photo.",
    couldntGrade: "Couldn't grade this paper.",
    title: "Grade with AI",
    description:
      "Upload the students' finished tests. AI suggests points for every question; nothing counts until you approve it.",
    addQuestionsFirst:
      "Add the exam's questions on the Questions tab first. AI grades against them and their expected answers.",
    testsAreFor: "The tests are for",
    dropPrompt: "Drop the students' tests here, or click to choose them",
    dropHint:
      "One file per student: a PDF, or a photo for one-page tests · max 10 MB each. TeachDesk doesn't keep the files.",
    stayOnTab: "Stay on this tab while grading: about half a minute per test, three at a time.",
    toReview: (n: number) => `To review (${n})`,
    toReviewText: "Check each suggestion, change points where you disagree, and approve.",
    approveNothingToCheck: (n: number) => `Approve ${n} with nothing to check`,
    student: "Student",
    waiting: "Waiting",
    grading: "Grading…",
    whose: "Whose test is this?",
    tryAgain: (file: string) => `Try ${file} again`,
    saved: (name: string, total: number, max: number) => `${name}: ${total} of ${max} points saved`,
    toCheck: (n: number) => `${n} to check`,
    hide: "Hide",
    review: "Review",
    approve: "Approve",
    question: (n: number) => `Question ${n}`,
    check: "Check",
    noAnswer: "No answer found",
    pointsFor: (n: number) => `Points for question ${n}`,
    approveTotal: (total: number, max: number) => `Approve ${total} / ${max} p`,
    discard: "Discard",
  },
  sv: {
    approvedMany: (n) => `${n} elever godkända`,
    pdfOrPhoto: "Ladda upp provet som PDF eller foto.",
    couldntGrade: "Det gick inte att rätta provet.",
    title: "Rätta med AI",
    description:
      "Ladda upp elevernas färdiga prov. AI föreslår poäng för varje fråga; inget räknas förrän du godkänner det.",
    addQuestionsFirst:
      "Lägg först till provets frågor under fliken Frågor. AI rättar mot dem och deras förväntade svar.",
    testsAreFor: "Proven gäller",
    dropPrompt: "Släpp elevernas prov här, eller klicka för att välja dem",
    dropHint:
      "En fil per elev: en PDF, eller ett foto för prov på en sida · max 10 MB per fil. TeachDesk sparar inte filerna.",
    stayOnTab:
      "Stanna på den här fliken under rättningen: ungefär en halv minut per prov, tre åt gången.",
    toReview: (n) => `Att granska (${n})`,
    toReviewText: "Granska varje förslag, ändra poängen där du inte håller med och godkänn.",
    approveNothingToCheck: (n) => `Godkänn ${n} utan anmärkningar`,
    student: "Elev",
    waiting: "Väntar",
    grading: "Rättar…",
    whose: "Vems prov är det här?",
    tryAgain: (file) => `Försök igen med ${file}`,
    saved: (name, total, max) => `${name}: ${total} av ${max} poäng sparade`,
    toCheck: (n) => `${n} att kontrollera`,
    hide: "Dölj",
    review: "Granska",
    approve: "Godkänn",
    question: (n) => `Fråga ${n}`,
    check: "Kontrollera",
    noAnswer: "Inget svar hittades",
    pointsFor: (n) => `Poäng för fråga ${n}`,
    approveTotal: (total, max) => `Godkänn ${total} / ${max} p`,
    discard: "Släng förslaget",
  },
});

/**
 * Grading with AI, on an exam's Grading tab: upload the students' finished tests, one file
 * per student. AI suggests points for every question, and the teacher reviews and approves
 * each student before the score counts. The files are only sent to be read, never stored.
 */
export function GradeWithAi({ exam }: { exam: Exam }) {
  const { profile, studentById, suggestGrading, approveGrading } = useStore();
  const { language } = useLanguage();
  const t = useMessages(messages);
  const hasPro = profile.access.level === "pro";
  const versions = exam.versions.filter((v) => v.questions.length > 0);
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const version = versions.find((v) => v.id === versionId) ?? versions[0];
  const [papers, setPapers] = useState<Paper[]>([]);
  const started = useRef(new Set<number>());

  const students = exam.attendance.flatMap((a) => studentById(a.studentId) ?? []);
  const toReview = exam.attendance.flatMap((a) =>
    a.aiGrading && !a.aiGrading.approved
      ? [
          {
            studentId: a.studentId,
            grading: a.aiGrading,
            // A new grading of the same student starts a fresh review.
            key: `${a.studentId}-${a.aiGrading.gradedAt}`,
          },
        ]
      : [],
  );
  // Points the teacher has changed on a suggestion, until it's approved.
  const [changedPoints, setChangedPoints] = useState<Record<string, number[]>>({});
  const pointsFor = ({ key, grading }: (typeof toReview)[number]) =>
    changedPoints[key] ?? grading.questions.map((q) => q.points);
  // Suggestions with nothing flagged can be approved all at once.
  const nothingToCheck = toReview.filter(
    ({ grading }) => grading.warnings.length === 0 && grading.questions.every((q) => !q.unsure),
  );

  const approveNothingToCheck = () => {
    for (const item of nothingToCheck) approveGrading(exam.id, item.studentId, pointsFor(item));
    toast.success(t.approvedMany(nothingToCheck.length));
  };

  const update = (id: number, changes: Partial<Paper>) =>
    setPapers((list) => list.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  /** Keeps a graded paper's suggestions on the student's result, for review. */
  const keep = (paper: Paper, result: GradedPaper, studentId: string, gradedVersionId: string) => {
    suggestGrading(exam.id, studentId, {
      versionId: gradedVersionId,
      fileName: paper.file.name,
      gradedAt: new Date().toISOString(),
      questions: result.questions,
      warnings: result.warnings,
      approved: false,
    });
    update(paper.id, { status: "done", studentId });
  };

  const grade = async (paper: Paper, against: ExamVersion) => {
    update(paper.id, { status: "grading", versionId: against.id });
    try {
      const picked = await readPickedFile(paper.file, language);
      if (picked.kind !== "binary") throw new Error(t.pdfOrPhoto);
      const result = await gradePaper({
        data: {
          examTitle: exam.title,
          subject: exam.subject,
          questions: against.questions.map((q) => ({
            number: q.number,
            type: q.type,
            points: q.points,
            prompt: q.prompt,
            expectedAnswer: q.expectedAnswer,
            gradingCriteria: q.gradingCriteria,
          })),
          paper: { mediaType: picked.mediaType, data: picked.data },
        },
      });
      const studentId = matchStudent(result.studentName, paper.file.name, students);
      if (studentId) keep(paper, result, studentId, against.id);
      else update(paper.id, { status: "unmatched", result });
    } catch (e) {
      update(paper.id, {
        status: "failed",
        error: e instanceof Error ? e.message : t.couldntGrade,
      });
    }
  };

  // After every change, start grading waiting papers, a few at a time.
  useEffect(() => {
    if (!version) return;
    const inProgress = (p: Paper) => p.status === "waiting" || p.status === "grading";
    const running = papers.filter((p) => started.current.has(p.id) && inProgress(p)).length;
    const next = papers.filter((p) => p.status === "waiting" && !started.current.has(p.id));
    for (const paper of next.slice(0, Math.max(0, AT_ONCE - running))) {
      started.current.add(paper.id);
      void grade(paper, version);
    }
  });

  const addFiles = (files: File[]) =>
    setPapers((list) => [
      ...list,
      ...files.map((file, i) => ({ id: Date.now() + i, file, status: "waiting" as const })),
    ]);

  const retry = (paper: Paper) => {
    started.current.delete(paper.id);
    update(paper.id, { status: "waiting", error: undefined });
  };

  const busy = papers.some((p) => p.status === "waiting" || p.status === "grading");

  return (
    <div className="space-y-4">
      <Panel
        title={t.title}
        description={t.description}
        action={<StatusPill tone="primary">Pro</StatusPill>}
      >
        {!version ? (
          <p className="text-sm text-muted-foreground">{t.addQuestionsFirst}</p>
        ) : !hasPro ? (
          <ProNote />
        ) : (
          <div className="space-y-3">
            {versions.length > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t.testsAreFor}</span>
                <Select value={version.id} onValueChange={setVersionId}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DropZone
              fileName={undefined}
              multiple
              prompt={t.dropPrompt}
              hint={t.dropHint}
              onFiles={addFiles}
            />
            {papers.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border text-sm">
                {papers.map((paper) => (
                  <PaperRow
                    key={paper.id}
                    paper={paper}
                    studentName={paper.studentId ? studentById(paper.studentId)?.name : undefined}
                    students={students}
                    onChooseStudent={(studentId) =>
                      paper.result &&
                      paper.versionId &&
                      keep(paper, paper.result, studentId, paper.versionId)
                    }
                    onRetry={() => retry(paper)}
                  />
                ))}
              </ul>
            )}
            {busy && <p className="text-xs text-muted-foreground">{t.stayOnTab}</p>}
          </div>
        )}
      </Panel>

      {toReview.length > 0 && (
        <Panel
          title={t.toReview(toReview.length)}
          description={t.toReviewText}
          action={
            nothingToCheck.length > 1 && (
              <Button size="sm" variant="outline" onClick={approveNothingToCheck}>
                {t.approveNothingToCheck(nothingToCheck.length)}
              </Button>
            )
          }
        >
          <div className="space-y-3">
            {toReview.map((item) => (
              <ReviewCard
                key={item.key}
                examId={exam.id}
                studentId={item.studentId}
                name={studentById(item.studentId)?.name ?? t.student}
                grading={item.grading}
                points={pointsFor(item)}
                onPointsChange={(points) =>
                  setChangedPoints((all) => ({ ...all, [item.key]: points }))
                }
              />
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function PaperRow({
  paper,
  studentName,
  students,
  onChooseStudent,
  onRetry,
}: {
  paper: Paper;
  studentName: string | undefined;
  students: { id: string; name: string }[];
  onChooseStudent: (studentId: string) => void;
  onRetry: () => void;
}) {
  const t = useMessages(messages);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      <span className="min-w-0 truncate">{paper.file.name}</span>
      <span className="flex items-center gap-2 text-muted-foreground">
        {paper.status === "waiting" && t.waiting}
        {paper.status === "grading" && (
          <>
            <Loader2 className="size-4 animate-spin" /> {t.grading}
          </>
        )}
        {paper.status === "done" && (
          <>
            <CheckCircle2 className="size-4 text-success" /> {studentName}
          </>
        )}
        {paper.status === "unmatched" && (
          <Select onValueChange={onChooseStudent}>
            <SelectTrigger className="h-8 w-48">
              <SelectValue placeholder={t.whose} />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {paper.status === "failed" && (
          <>
            <span className="text-destructive">{paper.error}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              aria-label={t.tryAgain(paper.file.name)}
            >
              <RotateCcw className="size-4" />
            </Button>
          </>
        )}
      </span>
    </li>
  );
}

/** One student's suggested grading: check it, change points, then approve or discard. */
function ReviewCard({
  examId,
  studentId,
  name,
  grading,
  points,
  onPointsChange,
}: {
  examId: string;
  studentId: string;
  name: string;
  grading: AiGrading;
  /** The points per question: AI's suggestion, or the teacher's changes to it. */
  points: number[];
  onPointsChange: (points: number[]) => void;
}) {
  const { approveGrading, discardGrading } = useStore();
  const t = useMessages(messages);
  const [open, setOpen] = useState(false);
  const total = sum(points);
  const max = sum(grading.questions.map((q) => q.maxPoints));
  const toCheck = grading.questions.filter((q) => q.unsure).length + grading.warnings.length;

  const approve = () => {
    approveGrading(examId, studentId, points);
    toast.success(t.saved(name, total, max));
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{grading.fileName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toCheck > 0 && <StatusPill tone="warning">{t.toCheck(toCheck)}</StatusPill>}
          <span className="text-sm tabular-nums">
            {total} / {max} p
          </span>
          <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
            {open ? t.hide : t.review}
          </Button>
          <Button size="sm" onClick={approve}>
            {t.approve}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {grading.warnings.length > 0 && (
            <ul className="list-disc space-y-1 rounded-md bg-warning/10 py-2 pl-7 pr-3 text-xs">
              {grading.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <ol className="space-y-3">
            {grading.questions.map((q, i) => (
              <li key={q.number} className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="flex items-center gap-2 font-medium">
                    {t.question(q.number)}
                    {q.unsure && <StatusPill tone="warning">{t.check}</StatusPill>}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-muted-foreground">
                    {q.answer ? `“${q.answer}”` : t.noAnswer}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <Sparkles className="mr-1 inline size-3 text-primary" />
                    {q.reason}
                  </p>
                </div>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Input
                    type="number"
                    min={0}
                    max={q.maxPoints}
                    step={0.5}
                    value={points[i]}
                    aria-label={t.pointsFor(q.number)}
                    className="h-8 w-20"
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      const next = Number.isFinite(value)
                        ? Math.min(q.maxPoints, Math.max(0, value))
                        : 0;
                      onPointsChange(points.map((p, j) => (j === i ? next : p)));
                    }}
                  />
                  / {q.maxPoints}
                </label>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Button size="sm" onClick={approve}>
              {t.approveTotal(total, max)}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => discardGrading(examId, studentId)}>
              {t.discard}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
