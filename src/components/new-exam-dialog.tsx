import { Check, FileUp, PenLine, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
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
import { classes, type Exam } from "@/lib/demo-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/primitives";

type Source = "scratch" | "upload" | "ai" | "import";

const steps = ["Basics", "Source", "Assessment", "Review", "Publish"];

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
  const { addExam } = useStore();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<Source>(aiFirst ? "ai" : "scratch");
  const [fileName, setFileName] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "Mathematics",
    classId: "math3c",
    date: "",
    time: "08:30",
    duration: "90",
    room: "B214",
    points: "40",
    topics: "",
    difficulty: "Mixed",
    objectives: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const publish = () => {
    const id = `exam-${Date.now()}`;
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
      versions: [],
      attendance: [],
    };
    addExam(exam);
    toast.success("Exam published", { description: `${exam.title} is now visible to your class.` });
    onOpenChange(false);
    setStep(0);
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
                <Select value={form.classId} onValueChange={(v) => set("classId", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <SourceOption id="upload" current={source} onSelect={setSource} icon={Upload} title="Upload existing exam" description="PDF, DOCX, image or text." />
                <SourceOption id="ai" current={source} onSelect={setSource} icon={Sparkles} title="Generate with AI" description="From topics and objectives." />
                <SourceOption id="import" current={source} onSelect={setSource} icon={FileUp} title="Import existing exam" description="Reuse an exam from your library." />
              </div>

              {source === "upload" && (
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) setFileName(f.name);
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10 text-center transition-colors hover:border-primary/50"
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">{fileName ?? "Drop your exam here"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, images or plain text · max 20 MB</p>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
              )}
              {source === "upload" && fileName && (
                <div className="rounded-md border border-border p-4 text-sm">
                  <p className="font-medium">Ready for analysis</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Question extraction runs after publishing. Every extracted question is shown for your review before it is used.
                  </p>
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
              <Row label="Source" value={source} />
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
            <Button onClick={() => setStep(step + 1)}>Continue</Button>
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
      <dd className="mt-0.5 font-medium capitalize">{value}</dd>
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
