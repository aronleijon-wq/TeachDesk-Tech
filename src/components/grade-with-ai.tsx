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

/**
 * Grading with AI, on an exam's Grading tab: upload the students' finished tests, one file
 * per student. AI suggests points for every question, and the teacher reviews and approves
 * each student before the score counts. The files are only sent to be read, never stored.
 */
export function GradeWithAi({ exam }: { exam: Exam }) {
  const { profile, studentById, suggestGrading } = useStore();
  const hasPro = profile.access.level === "pro";
  const versions = exam.versions.filter((v) => v.questions.length > 0);
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const version = versions.find((v) => v.id === versionId) ?? versions[0];
  const [papers, setPapers] = useState<Paper[]>([]);
  const started = useRef(new Set<number>());

  const students = exam.attendance.flatMap((a) => studentById(a.studentId) ?? []);
  const toReview = exam.attendance.flatMap((a) =>
    a.aiGrading && !a.aiGrading.approved ? [{ studentId: a.studentId, grading: a.aiGrading }] : [],
  );

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
      const picked = await readPickedFile(paper.file);
      if (picked.kind !== "binary") throw new Error("Upload the test as a PDF or a photo.");
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
        error: e instanceof Error ? e.message : "Couldn't grade this paper.",
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
        title="Grade with AI"
        description="Upload the students' finished tests. AI suggests points for every question; nothing counts until you approve it."
        action={<StatusPill tone="primary">Pro</StatusPill>}
      >
        {!version ? (
          <p className="text-sm text-muted-foreground">
            Add the exam's questions on the Questions tab first. AI grades against them and their
            expected answers.
          </p>
        ) : !hasPro ? (
          <ProNote />
        ) : (
          <div className="space-y-3">
            {versions.length > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">The tests are for</span>
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
              prompt="Drop the students' tests here, or click to choose them"
              hint="One file per student: a PDF, or a photo for one-page tests · max 10 MB each. TeachDesk doesn't keep the files."
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
            {busy && (
              <p className="text-xs text-muted-foreground">
                Stay on this tab while grading: about half a minute per test, three at a time.
              </p>
            )}
          </div>
        )}
      </Panel>

      {toReview.length > 0 && (
        <Panel
          title={`To review (${toReview.length})`}
          description="Check each suggestion, change points where you disagree, and approve."
        >
          <div className="space-y-3">
            {toReview.map(({ studentId, grading }) => (
              <ReviewCard
                // A new grading of the same student starts a fresh review.
                key={`${studentId}-${grading.gradedAt}`}
                examId={exam.id}
                studentId={studentId}
                name={studentById(studentId)?.name ?? "Student"}
                grading={grading}
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
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      <span className="min-w-0 truncate">{paper.file.name}</span>
      <span className="flex items-center gap-2 text-muted-foreground">
        {paper.status === "waiting" && "Waiting"}
        {paper.status === "grading" && (
          <>
            <Loader2 className="size-4 animate-spin" /> Grading…
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
              <SelectValue placeholder="Whose test is this?" />
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
              aria-label={`Try ${paper.file.name} again`}
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
}: {
  examId: string;
  studentId: string;
  name: string;
  grading: AiGrading;
}) {
  const { approveGrading, discardGrading } = useStore();
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState(grading.questions.map((q) => q.points));
  const total = sum(points);
  const max = sum(grading.questions.map((q) => q.maxPoints));
  const toCheck = grading.questions.filter((q) => q.unsure).length + grading.warnings.length;

  const approve = () => {
    approveGrading(examId, studentId, points);
    toast.success(`${name}: ${total} of ${max} points saved`);
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{grading.fileName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toCheck > 0 && <StatusPill tone="warning">{toCheck} to check</StatusPill>}
          <span className="text-sm tabular-nums">
            {total} / {max} p
          </span>
          <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide" : "Review"}
          </Button>
          <Button size="sm" onClick={approve}>
            Approve
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
                    Question {q.number}
                    {q.unsure && <StatusPill tone="warning">Check</StatusPill>}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-muted-foreground">
                    {q.answer ? `“${q.answer}”` : "No answer found"}
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
                    aria-label={`Points for question ${q.number}`}
                    className="h-8 w-20"
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      const next = Number.isFinite(value)
                        ? Math.min(q.maxPoints, Math.max(0, value))
                        : 0;
                      setPoints((all) => all.map((p, j) => (j === i ? next : p)));
                    }}
                  />
                  / {q.maxPoints}
                </label>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Button size="sm" onClick={approve}>
              Approve {total} / {max} p
            </Button>
            <Button size="sm" variant="ghost" onClick={() => discardGrading(examId, studentId)}>
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
