import { Check, FileUp, Loader2, PenLine, Sparkles, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Exam, Question } from "@/lib/types";
import { extractExamQuestions, type ExtractResult } from "@/lib/exam-ai.functions";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/primitives";

type Source = "scratch" | "upload" | "ai" | "import";

const steps = ["Basics", "Source", "Assessment", "Review", "Publish"];

const sourceLabels: Record<Source, string> = {
  scratch: "From scratch",
  upload: "Existing exam",
  ai: "Generated with AI",
  import: "Imported from library",
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const binaryTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type BinaryType = (typeof binaryTypes)[number];

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export function NewExamDialog({
  open,
  onOpenChange,
  aiFirst,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  aiFirst?: boolean;
  onCreated: (id: string) => void;
}) {
  const { addExam, classes, students } = useStore();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<Source>(aiFirst ? "ai" : "scratch");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractResult | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: classes[0]?.subject ?? "",
    classId: classes[0]?.id ?? "",
    date: "",
    time: "08:30",
    duration: "90",
    room: classes[0]?.room ?? "",
    points: "40",
    topics: "",
    difficulty: "Mixed",
    objectives: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Pick a class once one exists (e.g. created after this dialog was first shown).
  const firstClass = classes[0];
  useEffect(() => {
    if (!form.classId && firstClass) {
      setForm((f) => ({ ...f, classId: firstClass.id, subject: f.subject || firstClass.subject, room: f.room || firstClass.room }));
    }
  }, [form.classId, firstClass]);

  const extractedPoints = extracted?.questions.reduce((sum, q) => sum + q.points, 0) ?? 0;
  const needsExtraction = source === "upload" && !extracted?.questions.length;

  const pickFile = (f: File | undefined) => {
    setExtractError(null);
    setExtracted(null);
    if (!f) return setFile(null);
    if (f.size > MAX_FILE_BYTES) return setExtractError("That file is larger than 10 MB.");
    const isText = f.type.startsWith("text/") || /\.(txt|md)$/i.test(f.name);
    if (isText) {
      // Plain text goes into the paste box so the teacher can see and tidy it.
      void f.text().then(setPastedText);
      return setFile(null);
    }
    if (!binaryTypes.includes(f.type as BinaryType)) {
      return setExtractError("Use a PDF, a photo (PNG/JPG) or a text file. For Word files, save as PDF first.");
    }
    setFile(f);
  };

  const runExtraction = async () => {
    setExtracting(true);
    setExtractError(null);
    try {
      const result = await extractExamQuestions({
        data: {
          subject: form.subject,
          examTitle: form.title,
          ...(pastedText.trim() ? { text: pastedText } : {}),
          ...(file ? { file: { mediaType: file.type as BinaryType, data: await readAsBase64(file) } } : {}),
        },
      });
      setExtracted(result);
      if (!result.questions.length) {
        setExtractError(result.warnings.join(" ") || "No questions were found in that content.");
        return;
      }
      setForm((f) => ({
        ...f,
        points: String(result.questions.reduce((sum, q) => sum + q.points, 0)),
        objectives: f.objectives.trim() ? f.objectives : result.objectives.join("\n"),
      }));
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Could not read the exam. Please try again.");
    } finally {
      setExtracting(false);
    }
  };

  const publish = () => {
    const id = `exam-${Date.now()}`;
    const originalQuestions: Question[] =
      source === "upload" && extracted
        ? extracted.questions.map((q, i) => ({ ...q, id: `${id}-q${i + 1}`, number: i + 1 }))
        : [];
    const exam: Exam = {
      id,
      title: form.title || "Untitled exam",
      subject: form.subject,
      classId: form.classId,
      date: form.date || "2026-12-15",
      time: form.time,
      durationMin: Number(form.duration) || 90,
      room: form.room,
      totalPoints: Number(form.points) || 40,
      status: "upcoming",
      objectives: form.objectives.split("\n").map((s) => s.trim()).filter(Boolean),
      versions: originalQuestions.length
        ? [
            {
              id: `${id}-a`,
              label: "Version A",
              origin: "original",
              createdAt: new Date().toISOString().slice(0, 10),
              approved: true,
              questions: originalQuestions,
            },
          ]
        : [],
      // Everyone in the class is expected; attendance is marked on the exam page.
      attendance: students
        .filter((s) => s.classId === form.classId)
        .map((s) => ({ studentId: s.id, status: "pending" as const })),
    };
    addExam(exam);
    toast.success("Exam published", { description: `${exam.title} is now visible to your class.` });
    onOpenChange(false);
    setStep(0);
    setFile(null);
    setPastedText("");
    setExtracted(null);
    onCreated(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New exam</DialogTitle>
          <DialogDescription>Five short steps. You can edit everything later.</DialogDescription>
        </DialogHeader>

        <ol className="flex flex-wrap items-center gap-2 text-xs">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={cn(i === step ? "font-medium" : "text-muted-foreground")}>{s}</span>
              {i < steps.length - 1 && <span className="text-border">—</span>}
            </li>
          ))}
        </ol>

        <div className="mt-2 space-y-4">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Exam title" className="sm:col-span-2">
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Derivatives — Exam 2" />
              </Field>
              <Field label="Subject">
                <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
              </Field>
              <Field label="Class">
                <Select
                  value={form.classId}
                  onValueChange={(id) => {
                    const klass = classes.find((c) => c.id === id);
                    setForm((f) => ({ ...f, classId: id, subject: klass?.subject || f.subject, room: klass?.room || f.room }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="No classes yet" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {classes.length === 0 && (
                  <p className="text-xs text-muted-foreground">Add your class on the Students page first.</p>
                )}
              </Field>
              <Field label="Date"><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
              <Field label="Start time"><Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} /></Field>
              <Field label="Duration (minutes)"><Input value={form.duration} onChange={(e) => set("duration", e.target.value)} /></Field>
              <Field label="Room"><Input value={form.room} onChange={(e) => set("room", e.target.value)} /></Field>
              <Field label="Total points"><Input value={form.points} onChange={(e) => set("points", e.target.value)} /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <SourceOption id="scratch" current={source} onSelect={setSource} icon={PenLine} title="Create from scratch" description="Write questions in the exam editor." />
                <SourceOption id="upload" current={source} onSelect={setSource} icon={Upload} title="Use an existing exam" description="Paste it, or upload a PDF or photo." />
                <SourceOption id="ai" current={source} onSelect={setSource} icon={Sparkles} title="Generate with AI" description="From topics and objectives." />
                <SourceOption id="import" current={source} onSelect={setSource} icon={FileUp} title="Import existing exam" description="Reuse an exam from your library." />
              </div>

              {source === "upload" && (
                <div className="space-y-3">
                  <Field label="Paste the exam text">
                    <Textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => {
                        setPastedText(e.target.value);
                        setExtracted(null);
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
                    <p className="mt-2 text-sm font-medium">{file?.name ?? "…or drop a file here"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">PDF, photo (PNG/JPG) or text file · max 10 MB · Word: save as PDF first</p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,application/pdf,image/*,text/plain"
                      className="hidden"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                    />
                  </label>

                  <Button
                    onClick={runExtraction}
                    disabled={extracting || (!pastedText.trim() && !file)}
                    className="w-full"
                  >
                    {extracting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {extracting ? "Reading your exam…" : extracted ? "Read the exam again" : "Extract questions"}
                  </Button>

                  {extractError && <p className="text-sm text-destructive">{extractError}</p>}

                  {extracted && extracted.questions.length > 0 && (
                    <div className="rounded-md border border-border p-4 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">
                          {extracted.questions.length} questions · {extractedPoints} points
                        </p>
                        <StatusPill tone="success">Ready</StatusPill>
                      </div>
                      {extracted.warnings.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                          {extracted.warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      )}
                      <ol className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                        {extracted.questions.map((q, i) => (
                          <li key={i} className="flex gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0">
                            <span className="w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
                            <span className="flex-1 whitespace-pre-line">{q.prompt}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{q.points} p · {q.difficulty}</span>
                          </li>
                        ))}
                      </ol>
                      <p className="mt-3 text-xs text-muted-foreground">
                        This becomes Version A. You can edit any question after publishing.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Learning objectives (one per line)" className="sm:col-span-2">
                <Textarea rows={4} value={form.objectives} onChange={(e) => set("objectives", e.target.value)} placeholder={"Apply the chain rule\nAnalyse functions with derivatives"} />
              </Field>
              <Field label="Topics"><Input value={form.topics} onChange={(e) => set("topics", e.target.value)} placeholder="Derivatives, tangents, optimisation" /></Field>
              <Field label="Difficulty">
                <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Easy", "Mixed", "Hard"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {step === 3 && (
            <dl className="grid gap-3 rounded-md border border-border p-4 text-sm sm:grid-cols-2">
              <Row label="Title" value={form.title || "Untitled exam"} />
              <Row label="Class" value={classes.find((c) => c.id === form.classId)?.name ?? ""} />
              <Row label="Date" value={`${form.date || "Not set"} ${form.time}`} />
              <Row label="Duration" value={`${form.duration} min · ${form.room}`} />
              <Row label="Total points" value={form.points} />
              <Row label="Source" value={sourceLabels[source]} />
              {extracted && <Row label="Questions" value={`${extracted.questions.length} (${extractedPoints} points)`} />}
              <Row label="Objectives" value={String(form.objectives.split("\n").filter(Boolean).length)} />
            </dl>
          )}

          {step === 4 && (
            <div className="rounded-md border border-border p-4">
              <StatusPill tone="success">Ready to publish</StatusPill>
              <p className="mt-3 text-sm">
                Publishing adds the exam to your calendar, prepares the attendance list for the class and unlocks version generation.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!form.classId || (step === 1 && needsExtraction)}>
              Continue
            </Button>
          ) : (
            <Button onClick={publish}>Publish exam</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
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

function SourceOption({
  id,
  current,
  onSelect,
  icon: Icon,
  title,
  description,
}: {
  id: Source;
  current: Source;
  onSelect: (s: Source) => void;
  icon: typeof PenLine;
  title: string;
  description: string;
}) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "rounded-md border p-3 text-left transition-colors",
        active ? "border-primary bg-primary-soft" : "border-border hover:bg-accent",
      )}
    >
      <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
