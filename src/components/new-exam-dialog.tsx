import { Link } from "@tanstack/react-router";
import { BookCopy, Check, Loader2, PenLine, Sparkles, Upload, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { extractExamQuestions, generateExam, type ExamDraft } from "@/lib/exam-ai.functions";
import { useStore } from "@/lib/store";
import type { Exam, Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { newId, todayIso } from "@/lib/workspace";

/** Where the new exam's questions come from. */
type Source = "write" | "upload" | "ai" | "reuse";

const SOURCES: { id: Source; icon: LucideIcon; title: string; description: string; pro?: true }[] =
  [
    {
      id: "write",
      icon: PenLine,
      title: "Write the questions yourself",
      description: "Add them on the exam's Questions tab after creating it.",
    },
    {
      id: "upload",
      icon: Upload,
      title: "Use an existing exam",
      description: "Paste it, or upload a PDF or photo. AI reads the questions.",
      pro: true,
    },
    {
      id: "ai",
      icon: Sparkles,
      title: "Generate with AI",
      description: "From your topics and learning objectives.",
      pro: true,
    },
    {
      id: "reuse",
      icon: BookCopy,
      title: "Reuse an earlier exam",
      description: "Start from the questions of an exam you've made before.",
    },
  ];

const STEPS = ["Basics", "Questions", "Details", "Review"];
const DIFFICULTIES = ["Easy", "Mixed", "Hard"] as const;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const binaryTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
type BinaryType = (typeof binaryTypes)[number];

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const pointsOf = (draft: ExamDraft) => draft.questions.reduce((sum, q) => sum + q.points, 0);

/** Creates an exam. Mount it while open, so each new exam starts from an empty form. */
export function NewExamDialog({
  open,
  onOpenChange,
  aiFirst,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiFirst?: boolean;
  onCreated: (id: string) => void;
}) {
  const { addExam, classes, students, exams, profile } = useStore();
  const hasPro = profile.access.level === "pro";
  const firstClass = classes[0];

  const [step, setStep] = useState(0);
  const [source, setSource] = useState<Source>(aiFirst ? "ai" : "write");
  const [form, setForm] = useState({
    title: "",
    subject: firstClass?.subject ?? "",
    classId: firstClass?.id ?? "",
    date: "",
    time: "08:30",
    duration: "90",
    room: firstClass?.room ?? "",
    points: "40",
    topics: "",
    difficulty: "Mixed" as (typeof DIFFICULTIES)[number],
    objectives: "",
  });
  // The questions to start from: read from an existing exam, generated, or reused.
  const [draft, setDraft] = useState<ExamDraft | null>(null);
  const [working, setWorking] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Pick a class once one exists (e.g. created after this dialog was opened).
  useEffect(() => {
    if (!form.classId && firstClass) {
      setForm((f) => ({
        ...f,
        classId: firstClass.id,
        subject: f.subject || firstClass.subject,
        room: f.room || firstClass.room,
      }));
    }
  }, [form.classId, firstClass]);

  const chooseSource = (next: Source) => {
    setSource(next);
    setDraft(null);
    setDraftError(null);
  };

  /** Runs an AI step that fills in the questions; a failure is shown in the dialog. */
  const fillWith = async (make: () => Promise<ExamDraft>, noneFound: string) => {
    setWorking(true);
    setDraftError(null);
    try {
      const result = await make();
      if (result.questions.length === 0) {
        setDraft(null);
        setDraftError(result.warnings.join(" ") || noneFound);
        return;
      }
      setDraft(result);
      setForm((f) => ({
        ...f,
        points: String(pointsOf(result)),
        objectives: f.objectives.trim() ? f.objectives : result.objectives.join("\n"),
      }));
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const readExistingExam = () =>
    fillWith(
      async () =>
        extractExamQuestions({
          data: {
            subject: form.subject,
            examTitle: form.title,
            ...(pastedText.trim() ? { text: pastedText } : {}),
            ...(file
              ? { file: { mediaType: file.type as BinaryType, data: await readAsBase64(file) } }
              : {}),
          },
        }),
      "No questions were found in that content.",
    );

  const generateWithAi = () =>
    fillWith(
      () =>
        generateExam({
          data: {
            subject: form.subject,
            examTitle: form.title || "Exam",
            topics: form.topics,
            objectives: lines(form.objectives),
            difficulty: form.difficulty,
            totalPoints: Number(form.points) || 40,
            durationMin: Number(form.duration) || 90,
          },
        }),
      "No questions came back. Try describing the topics in more detail.",
    );

  const reusable = exams.filter((e) => e.versions[0]?.questions.length);
  const reuse = (examId: string) => {
    const earlier = exams.find((e) => e.id === examId);
    const questions = earlier?.versions[0]?.questions ?? [];
    const reused = { questions, objectives: earlier?.objectives ?? [], warnings: [] };
    setDraft(reused);
    setForm((f) => ({
      ...f,
      points: String(pointsOf(reused)),
      objectives: reused.objectives.join("\n"),
    }));
  };

  const pickFile = (f: File | undefined) => {
    setDraftError(null);
    setDraft(null);
    if (!f) return setFile(null);
    if (f.size > MAX_FILE_BYTES) return setDraftError("That file is larger than 10 MB.");
    if (f.type.startsWith("text/") || /\.(txt|md)$/i.test(f.name)) {
      // Plain text goes into the paste box so the teacher can see and tidy it.
      void f.text().then(setPastedText);
      return setFile(null);
    }
    if (!binaryTypes.includes(f.type as BinaryType)) {
      return setDraftError(
        "Use a PDF, a photo (PNG/JPG) or a text file. For Word files, save as PDF first.",
      );
    }
    setFile(f);
  };

  // Each step can continue once it has what it needs.
  const ready = [
    Boolean(form.classId && form.date),
    source === "write" || source === "ai" || Boolean(draft),
    source !== "ai" || Boolean(draft),
  ];

  const create = () => {
    const id = newId("exam");
    const questions: Question[] = (draft?.questions ?? []).map((q, i) => ({
      ...q,
      id: `${id}-q${i + 1}`,
      number: i + 1,
    }));
    const exam: Exam = {
      id,
      title: form.title.trim() || "Untitled exam",
      subject: form.subject,
      classId: form.classId,
      date: form.date,
      time: form.time,
      durationMin: Number(form.duration) || 90,
      room: form.room,
      totalPoints: questions.reduce((sum, q) => sum + q.points, 0) || Number(form.points) || 0,
      status: "upcoming",
      objectives: lines(form.objectives),
      versions: questions.length
        ? [
            {
              id: `${id}-a`,
              label: "Version A",
              origin: "original",
              createdAt: todayIso(),
              approved: true,
              questions,
            },
          ]
        : [],
      // Everyone in the class is expected; attendance is marked on the exam page.
      attendance: students
        .filter((s) => s.classId === form.classId)
        .map((s) => ({ studentId: s.id, status: "pending" as const })),
    };
    addExam(exam);
    toast.success("Exam created", {
      description: questions.length
        ? `${questions.length} questions in Version A.`
        : "Add its questions on the exam's Questions tab.",
    });
    onOpenChange(false);
    onCreated(id);
  };

  const sourceInfo = SOURCES.find((s) => s.id === source);
  const needsPro = Boolean(sourceInfo?.pro) && !hasPro;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New exam</DialogTitle>
          <DialogDescription>Four short steps. You can change everything later.</DialogDescription>
        </DialogHeader>

        <ol className="flex flex-wrap items-center gap-2 text-xs">
          {STEPS.map((name, i) => (
            <li key={name} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  i < step
                    ? "bg-success text-success-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={cn(i === step ? "font-medium" : "text-muted-foreground")}>
                {name}
              </span>
              {i < STEPS.length - 1 && <span className="text-border">—</span>}
            </li>
          ))}
        </ol>

        <div className="mt-2 space-y-4">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Exam title" className="sm:col-span-2">
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Derivatives — Exam 2"
                />
              </Field>
              <Field label="Subject">
                <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
              </Field>
              <Field label="Class">
                <Select
                  value={form.classId}
                  onValueChange={(id) => {
                    const klass = classes.find((c) => c.id === id);
                    setForm((f) => ({
                      ...f,
                      classId: id,
                      subject: klass?.subject || f.subject,
                      room: klass?.room || f.room,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No classes yet" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {classes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add your class on the Students page first.
                  </p>
                )}
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label="Start time">
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </Field>
              <Field label="Duration (minutes)">
                <Input
                  type="number"
                  min={10}
                  value={form.duration}
                  onChange={(e) => set("duration", e.target.value)}
                />
              </Field>
              <Field label="Room">
                <Input value={form.room} onChange={(e) => set("room", e.target.value)} />
              </Field>
              <Field label="Total points">
                <Input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => set("points", e.target.value)}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {SOURCES.map((option) => (
                  <SourceOption
                    key={option.id}
                    {...option}
                    active={source === option.id}
                    onSelect={() => chooseSource(option.id)}
                  />
                ))}
              </div>

              {needsPro && <ProNote />}

              {source === "upload" && !needsPro && (
                <div className="space-y-3">
                  <Field label="Paste the exam text">
                    <Textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => {
                        setPastedText(e.target.value);
                        setDraft(null);
                      }}
                      placeholder={"1. Differentiate f(x) = 3x² + 5x − 2. (3 p)\n2. ..."}
                    />
                  </Field>
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      pickFile(e.dataTransfer.files?.[0]);
                    }}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-6 text-center transition-colors hover:border-primary/50"
                  >
                    <Upload className="size-5 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">
                      {file?.name ?? "…or drop a file here"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, photo (PNG/JPG) or text file · max 10 MB · Word: save as PDF first
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,application/pdf,image/*,text/plain"
                      className="hidden"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                    />
                  </label>
                  <Button
                    onClick={() => void readExistingExam()}
                    disabled={working || (!pastedText.trim() && !file)}
                    className="w-full"
                  >
                    {working ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    {working
                      ? "Reading your exam…"
                      : draft
                        ? "Read the exam again"
                        : "Read the questions"}
                  </Button>
                </div>
              )}

              {source === "reuse" &&
                (reusable.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    None of your exams have questions yet. Choose another way to start.
                  </p>
                ) : (
                  <Field label="Exam to start from">
                    <Select onValueChange={reuse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {reusable.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ))}

              {source === "ai" && !needsPro && (
                <p className="text-sm text-muted-foreground">
                  Next, describe the topics and learning objectives, and AI writes the questions for
                  you to review.
                </p>
              )}

              {source !== "ai" && <DraftResult draft={draft} error={draftError} />}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Learning objectives (one per line)" className="sm:col-span-2">
                <Textarea
                  rows={4}
                  value={form.objectives}
                  onChange={(e) => set("objectives", e.target.value)}
                  placeholder={"Apply the chain rule\nAnalyse functions with derivatives"}
                />
              </Field>
              {source === "ai" && (
                <>
                  <Field label="Topics">
                    <Input
                      value={form.topics}
                      onChange={(e) => set("topics", e.target.value)}
                      placeholder="Derivatives, tangents, optimisation"
                    />
                  </Field>
                  <Field label="Difficulty">
                    <Select
                      value={form.difficulty}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, difficulty: v as (typeof DIFFICULTIES)[number] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="space-y-3 sm:col-span-2">
                    {needsPro ? (
                      <ProNote />
                    ) : (
                      <Button
                        onClick={() => void generateWithAi()}
                        disabled={working || (!form.topics.trim() && !form.objectives.trim())}
                        className="w-full"
                      >
                        {working ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                        {working
                          ? "Writing the questions — about half a minute…"
                          : draft
                            ? "Generate again"
                            : "Generate questions"}
                      </Button>
                    )}
                    <DraftResult draft={draft} error={draftError} />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <dl className="grid gap-3 rounded-md border border-border p-4 text-sm sm:grid-cols-2">
              <Row label="Title" value={form.title.trim() || "Untitled exam"} />
              <Row label="Class" value={classes.find((c) => c.id === form.classId)?.name ?? ""} />
              <Row label="Date" value={`${form.date} ${form.time}`} />
              <Row
                label="Duration"
                value={[`${form.duration} min`, form.room].filter(Boolean).join(" · ")}
              />
              <Row
                label="Questions"
                value={
                  draft
                    ? `${draft.questions.length} (${pointsOf(draft)} points)`
                    : "None yet — add them after creating the exam"
                }
              />
              <Row label="Learning objectives" value={String(lines(form.objectives).length)} />
            </dl>
          )}
        </div>

        <DialogFooter className="mt-2 flex-row justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!ready[step] || working}>
              Continue
            </Button>
          ) : (
            <Button onClick={create}>Create exam</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The questions found or generated, or why there are none. */
function DraftResult({ draft, error }: { draft: ExamDraft | null; error: string | null }) {
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!draft) return null;
  return (
    <div className="rounded-md border border-border p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">
          {draft.questions.length} questions · {pointsOf(draft)} points
        </p>
        <StatusPill tone="success">Ready</StatusPill>
      </div>
      {draft.warnings.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {draft.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <ol className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
        {draft.questions.map((q, i) => (
          <li
            key={i}
            className="flex gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0"
          >
            <span className="w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
            <span className="flex-1 whitespace-pre-line">{q.prompt}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {q.points} p · {q.difficulty}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        These become Version A. You can edit any question after creating the exam.
      </p>
    </div>
  );
}

function ProNote() {
  return (
    <p className="rounded-md bg-primary-soft/50 px-3 py-2 text-sm">
      This is part of Pro.{" "}
      <Link to="/app/pricing" className="font-medium text-primary hover:underline">
        See plans
      </Link>
    </p>
  );
}

function SourceOption({
  icon: Icon,
  title,
  description,
  pro,
  active,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  pro?: true;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-md border p-3 text-left transition-colors",
        active ? "border-primary bg-primary-soft" : "border-border hover:bg-accent",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
        {pro && <StatusPill tone="primary">Pro</StatusPill>}
      </span>
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-xs">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
