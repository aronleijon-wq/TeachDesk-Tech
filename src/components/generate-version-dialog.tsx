import { Check, Loader2, Sparkles } from "lucide-react";
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
import { generateEquivalentVersion } from "@/lib/exam-ai.functions";
import { defineMessages, useMessages } from "@/lib/i18n";
import type { Exam, ExamVersion, Question } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const messages = defineMessages({
  en: {
    stages: [
      "Analysing original exam",
      "Mapping learning objectives",
      "Generating equivalent questions",
      "Verifying difficulty and points",
      "Running equivalence check",
    ],
    keep: ["Topics", "Difficulty", "Number of questions", "Points", "Learning objectives", "Question types"],
    change: ["Numbers", "Context", "Wording", "Examples"],
    generated: (label: string) => `${label} generated`,
    reviewFirst: "Review and approve it before use.",
    failed: "Generation failed. Please try again.",
    title: "Generate equivalent version",
    description: (label: string) =>
      `${label} will test the same knowledge and skills while changing numbers, contexts and wording.`,
    maintain: "Maintain",
    changes: "Change",
    source: (label: string, questions: number, points: number) =>
      `Source: ${label} · ${questions} questions · ${points} points. Generated versions are never used until you approve them.`,
    noVersion: "no version available",
    generate: (label: string) => `Generate ${label}`,
  },
  sv: {
    stages: [
      "Analyserar originalprovet",
      "Kartlägger lärandemålen",
      "Skapar likvärdiga frågor",
      "Kontrollerar svårighetsgrad och poäng",
      "Kontrollerar att versionerna är likvärdiga",
    ],
    keep: ["Områden", "Svårighetsgrad", "Antal frågor", "Poäng", "Lärandemål", "Frågetyper"],
    change: ["Siffror", "Sammanhang", "Formuleringar", "Exempel"],
    generated: (label) => `${label} har skapats`,
    reviewFirst: "Granska och godkänn den innan den används.",
    failed: "Det gick inte att skapa versionen. Försök igen.",
    title: "Skapa likvärdig version",
    description: (label) =>
      `${label} prövar samma kunskaper och förmågor, med nya siffror, sammanhang och formuleringar.`,
    maintain: "Behålls",
    changes: "Ändras",
    source: (label, questions, points) =>
      `Utgår från: ${label} · ${questions} frågor · ${points} poäng. Skapade versioner används aldrig förrän du har godkänt dem.`,
    noVersion: "ingen version finns",
    generate: (label) => `Skapa ${label}`,
  },
});

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
  const t = useMessages(messages);
  const stages = t.stages;
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
      toast.success(t.generated(nextLabel), { description: t.reviewFirst });
      onOpenChange(false);
      setStage(-1);
    } catch (e) {
      clearInterval(timer);
      setStage(-1);
      setError(e instanceof Error ? e.message : t.failed);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (stage < 0 || stage >= stages.length) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description(nextLabel)}</DialogDescription>
        </DialogHeader>

        {stage < 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label-xs">{t.maintain}</p>
                <ul className="mt-2 space-y-1.5">
                  {t.keep.map((k) => (
                    <li key={k} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary" /> {k}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label-xs">{t.changes}</p>
                <ul className="mt-2 space-y-1.5">
                  {t.change.map((k) => (
                    <li key={k} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary" /> {k}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t.source(source?.label ?? t.noVersion, source?.questions.length ?? 0, exam.totalPoints)}
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
              <Button onClick={run} disabled={!source}>
                <Sparkles className="size-4" /> {t.generate(nextLabel)}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
