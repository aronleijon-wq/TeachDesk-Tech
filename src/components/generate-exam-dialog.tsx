import { Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DropZone, ExamDraftPreview, Field, ProNote } from "@/components/exam-draft";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateExam, type GeneratedExam } from "@/lib/exam-ai.functions";
import { readPickedFile, type PickedFile } from "@/lib/picked-file";
import { useStore } from "@/lib/store";

/**
 * Generates an exam with AI from the teacher's description and/or material to base it on (an
 * earlier exam, course material, a list). The teacher reviews the questions, picks the date
 * and creates the exam. Mount it while open, so it always starts empty.
 */
export function GenerateExamDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { classes, profile, createExam } = useStore();
  const hasPro = profile.access.level === "pro";
  const firstClass = classes[0];

  const [classId, setClassId] = useState(firstClass?.id ?? "");
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState<PickedFile | null>(null);
  const [generated, setGenerated] = useState<GeneratedExam | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState({
    title: "",
    date: "",
    time: "08:30",
    duration: "60",
    room: "",
  });

  const klass = classes.find((c) => c.id === classId);
  const set = (key: keyof typeof details, value: string) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const pickMaterial = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    try {
      setMaterial(await readPickedFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  };

  const generate = async () => {
    setWorking(true);
    setError(null);
    try {
      const result = await generateExam({
        data: {
          description,
          subject: klass?.subject ?? "",
          ...(material && {
            material:
              material.kind === "text"
                ? { text: material.text }
                : { file: { mediaType: material.mediaType, data: material.data } },
          }),
        },
      });
      if (result.questions.length === 0) {
        setError(
          result.warnings.join(" ") ||
            "No questions came back. Try describing the exam in more detail.",
        );
        return;
      }
      setGenerated(result);
      setDetails((d) => ({
        ...d,
        title: result.title,
        duration: String(Math.round(result.durationMin) || 60),
        room: d.room || klass?.room || "",
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const create = () => {
    if (!generated) return;
    const id = createExam(
      {
        title: details.title.trim() || generated.title,
        subject: klass?.subject ?? "",
        classId,
        date: details.date,
        time: details.time,
        durationMin: Number(details.duration) || 60,
        room: details.room,
        totalPoints: 0, // Follows the questions.
        objectives: generated.objectives,
      },
      generated.questions,
    );
    toast.success("Exam created", {
      description: `${generated.questions.length} questions in Version A.`,
    });
    onOpenChange(false);
    onCreated(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Generate an exam with AI
          </DialogTitle>
          <DialogDescription>
            {generated
              ? "Check the questions, then choose when the exam is."
              : "Describe the exam, or add an earlier exam or other material to base it on. AI writes a new exam for you to review."}
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          <div className="space-y-4">
            <Field label="Class">
              <Select value={classId} onValueChange={setClassId}>
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

            <Field label="What should the exam be about?">
              <Textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="For example: a 60-minute exam on derivatives — differentiation rules and tangent lines, about 30 points, mixed difficulty. Write in Swedish or English."
              />
            </Field>

            <Field label="Base it on material (optional)">
              {material ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <span className="truncate">{material.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMaterial(null)}
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <DropZone
                  fileName={undefined}
                  prompt="Drop an earlier exam, course material or a list"
                  hint="PDF, photo, CSV or text file · max 10 MB. AI writes a new exam in the same style — not a copy."
                  onFile={(file) => void pickMaterial(file)}
                />
              )}
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {!hasPro && <ProNote />}
          </div>
        ) : (
          <div className="space-y-4">
            <ExamDraftPreview questions={generated.questions} warnings={generated.warnings} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2">
                <Input value={details.title} onChange={(e) => set("title", e.target.value)} />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  required
                  value={details.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label="Start time">
                <Input
                  type="time"
                  value={details.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </Field>
              <Field label="Duration (minutes)">
                <Input
                  type="number"
                  min={10}
                  value={details.duration}
                  onChange={(e) => set("duration", e.target.value)}
                />
              </Field>
              <Field label="Room">
                <Input value={details.room} onChange={(e) => set("room", e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 flex-row justify-between sm:justify-between">
          {generated ? (
            <>
              <Button variant="ghost" onClick={() => setGenerated(null)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void generate()} disabled={working}>
                  {working ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Generate again
                </Button>
                <Button onClick={create} disabled={working || !details.date || !classId}>
                  Create exam
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void generate()}
                disabled={working || !hasPro || !classId || (!description.trim() && !material)}
              >
                {working ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {working ? "Writing your exam — about half a minute…" : "Generate exam"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
