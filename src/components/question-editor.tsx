import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
import { defineMessages, useMessages } from "@/lib/i18n";
import { questionTerms } from "@/lib/question-terms";
import type { Question, QuestionDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: Question["type"][] = ["short-answer", "open-ended", "calculation", "multiple-choice"];
const DIFFICULTIES: Question["difficulty"][] = ["Easy", "Medium", "Hard"];

const messages = defineMessages({
  en: {
    points: (n: number) => `${n} ${n === 1 ? "point" : "points"}`,
    save: "Save question",
    question: (n: number) => `Question ${n}`,
    edit: "Edit",
    remove: (n: number) => `Remove question ${n}`,
    confirmRemove: (n: number) => `Remove question ${n}?`,
    add: "Add question",
    newQuestion: "New question",
    fields: {
      question: "Question",
      type: "Type",
      points: "Points",
      difficulty: "Difficulty",
      topic: "Topic",
      skill: "Skill tested",
      objective: "Learning objective",
      expectedAnswer: "Expected answer",
      criteria: "Grading criteria",
    },
    placeholders: {
      question: "Differentiate f(x) = 3x² + 5x − 2.",
      topic: "Derivatives",
      skill: "Power rule",
    },
    cancel: "Cancel",
  },
  sv: {
    points: (n) => `${n} poäng`,
    save: "Spara frågan",
    question: (n) => `Fråga ${n}`,
    edit: "Redigera",
    remove: (n) => `Ta bort fråga ${n}`,
    confirmRemove: (n) => `Ta bort fråga ${n}?`,
    add: "Lägg till fråga",
    newQuestion: "Ny fråga",
    fields: {
      question: "Fråga",
      type: "Typ",
      points: "Poäng",
      difficulty: "Svårighetsgrad",
      topic: "Område",
      skill: "Förmåga som prövas",
      objective: "Lärandemål",
      expectedAnswer: "Förväntat svar",
      criteria: "Bedömningskriterier",
    },
    placeholders: {
      question: "Derivera f(x) = 3x² + 5x − 2.",
      topic: "Derivator",
      skill: "Deriveringsregler",
    },
    cancel: "Avbryt",
  },
});

const EMPTY_QUESTION: QuestionDraft = {
  type: "short-answer",
  topic: "",
  skill: "",
  difficulty: "Medium",
  points: 2,
  prompt: "",
  expectedAnswer: "",
  gradingCriteria: "",
  objective: "",
};

/** One question: shown as text, with Edit and (on the original version) Remove. */
export function QuestionCard({
  question,
  onSave,
  onRemove,
}: {
  question: Question;
  onSave: (question: Question) => void;
  onRemove?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const t = useMessages(messages);
  const terms = useMessages(questionTerms);
  const details = [
    t.points(question.points),
    terms.types[question.type],
    terms.difficulties[question.difficulty],
    question.skill,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      {editing ? (
        <QuestionForm
          initial={question}
          submitLabel={t.save}
          onSubmit={(draft) => {
            onSave({ ...question, ...draft });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="label-xs">
              {t.question(question.number)}
              {question.topic && ` · ${question.topic}`}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm">{question.prompt}</p>
            <p className="mt-1 text-xs text-muted-foreground">{details.join(" · ")}</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              {t.edit}
            </Button>
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                aria-label={t.remove(question.number)}
                onClick={() => {
                  if (window.confirm(t.confirmRemove(question.number))) onRemove();
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** "Add question", which opens an empty question to fill in. */
export function AddQuestion({ onAdd }: { onAdd: (question: QuestionDraft) => void }) {
  const [open, setOpen] = useState(false);
  const t = useMessages(messages);
  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> {t.add}
      </Button>
    );
  }
  return (
    <div className="rounded-lg border border-primary/30 bg-surface p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold">{t.newQuestion}</p>
      <QuestionForm
        initial={EMPTY_QUESTION}
        submitLabel={t.add}
        onSubmit={(draft) => {
          onAdd(draft);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

function QuestionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: QuestionDraft;
  submitLabel: string;
  onSubmit: (draft: QuestionDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<QuestionDraft>(initial);
  const t = useMessages(messages);
  const terms = useMessages(questionTerms);
  const text = (
    key: "prompt" | "topic" | "skill" | "expectedAnswer" | "gradingCriteria" | "objective",
  ) => ({
    value: draft[key],
    onChange: (e: { target: { value: string } }) =>
      setDraft((d) => ({ ...d, [key]: e.target.value })),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ ...draft, prompt: draft.prompt.trim() });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
      <Field label={t.fields.question} className="sm:col-span-3">
        <Textarea rows={3} required {...text("prompt")} placeholder={t.placeholders.question} />
      </Field>
      <Field label={t.fields.type}>
        <Select
          value={draft.type}
          onValueChange={(v) => setDraft((d) => ({ ...d, type: v as Question["type"] }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {terms.types[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={t.fields.points}>
        <Input
          type="number"
          min={1}
          required
          value={draft.points}
          onChange={(e) => setDraft((d) => ({ ...d, points: e.target.valueAsNumber || 0 }))}
        />
      </Field>
      <Field label={t.fields.difficulty}>
        <Select
          value={draft.difficulty}
          onValueChange={(v) =>
            setDraft((d) => ({ ...d, difficulty: v as Question["difficulty"] }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d} value={d}>
                {terms.difficulties[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={t.fields.topic}>
        <Input {...text("topic")} placeholder={t.placeholders.topic} />
      </Field>
      <Field label={t.fields.skill}>
        <Input {...text("skill")} placeholder={t.placeholders.skill} />
      </Field>
      <Field label={t.fields.objective}>
        <Input {...text("objective")} />
      </Field>
      <Field label={t.fields.expectedAnswer} className="sm:col-span-3">
        <Textarea rows={2} {...text("expectedAnswer")} />
      </Field>
      <Field label={t.fields.criteria} className="sm:col-span-3">
        <Textarea rows={2} {...text("gradingCriteria")} />
      </Field>
      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" size="sm" disabled={!draft.prompt.trim() || draft.points < 1}>
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
