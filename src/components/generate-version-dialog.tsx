import { Check, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/primitives";
import { generateEquivalentVersion } from "@/lib/exam-ai.functions";
import type { Exam, ExamVersion, Question } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const stages = [
  "Analysing original exam",
  "Mapping learning objectives",
  "Generating equivalent questions",
  "Verifying difficulty and points",
  "Running equivalence check",
];

const keepList = ["Topics", "Difficulty", "Number of questions", "Points", "Learning objectives", "Question types"];
const changeList = ["Numbers", "Context", "Wording", "Examples"];

export function GenerateVersionDialog({
  exam,
  open,
  onOpenChange,
}: {
  exam: Exam;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addVersion } = useStore();
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const nextLabel = `Version ${String.fromCharCode(65 + exam.versions.length)}`;
  const source = exam.versions[0];

  const run = async () => {
    if (!source) return;
    setError(null);
    setStage(0);
    const timer = setInterval(() => setStage((s) => (s < stages.length - 2 ? s + 1 : s)), 1800);
    try {
      const result = await generateEquivalentVersion({
        data: {
          examTitle: exam.title,
          subject: exam.subject,
          versionLabel: nextLabel,
          questions: source.questions.map((q) => ({
            number: q.number,
            type: q.type,
            topic: q.topic,
            skill: q.skill,
            difficulty: q.difficulty,
            points: q.points,
            prompt: q.prompt,
            expectedAnswer: q.expectedAnswer,
            objective: q.objective,
          })),
        },
      });
      clearInterval(timer);
      setStage(stages.length);

      const questions: Question[] = result.questions.map((q, i) => ({
        id: `gen-${Date.now()}-${i}`,
        number: q.number ?? i + 1,
        type: (["multiple-choice", "short-answer", "open-ended", "calculation"].includes(q.type)
          ? q.type
          : "short-answer") as Question["type"],
        topic: q.topic,
        skill: q.skill,
        difficulty: (["Easy", "Medium", "Hard"].includes(q.difficulty) ? q.difficulty : "Medium") as Question["difficulty"],
        points: q.points,
        prompt: q.prompt,
        expectedAnswer: q.expectedAnswer,
        gradingCriteria: q.gradingCriteria,
        objective: q.objective,
      }));

      const version: ExamVersion = {
        id: `v-${Date.now()}`,
        label: nextLabel,
        origin: "ai-generated",
        createdAt: new Date().toISOString().slice(0, 10),
        approved: false,
        equivalenceScore: Math.round(result.equivalenceScore),
        questions,
      };
      addVersion(exam.id, version);
      toast.success(`${nextLabel} generated`, { description: "Review and approve it before use." });
      onOpenChange(false);
      setStage(-1);
    } catch (e) {
      clearInterval(timer);
      setStage(-1);
      setError(e instanceof Error ? e.message : "Generation failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (stage < 0 || stage >= stages.length) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate equivalent version</DialogTitle>
          <DialogDescription>
            {nextLabel} will test the same knowledge and skills while changing numbers, contexts and wording.
          </DialogDescription>
        </DialogHeader>

        {stage < 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label-xs">Maintain</p>
                <ul className="mt-2 space-y-1.5">
                  {keepList.map((k) => (
                    <li key={k} className="flex items-center gap-2 text-sm">
                      <Checkbox defaultChecked /> {k}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label-xs">Change</p>
                <ul className="mt-2 space-y-1.5">
                  {changeList.map((k) => (
                    <li key={k} className="flex items-center gap-2 text-sm">
                      <Checkbox defaultChecked /> {k}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Source: {source?.label ?? "no version available"} · {source?.questions.length ?? 0} questions · {exam.totalPoints} points.
              Generated versions are never used until you approve them.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <ol className="space-y-2">
            {stages.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-sm">
                {i < stage ? (
                  <Check className="size-4 text-success" />
                ) : i === stage ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <span className="size-4 rounded-full border border-border" />
                )}
                <span className={cn(i > stage && "text-muted-foreground")}>{s}</span>
              </li>
            ))}
          </ol>
        )}

        <DialogFooter>
          {stage < 0 && (
            <>
              <StatusPill tone="primary">Production AI</StatusPill>
              <Button onClick={run} disabled={!source}>
                <Sparkles className="size-4" /> Generate {nextLabel}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
