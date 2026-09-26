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
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A question as the teacher writes it; its id and number are set when it's added. */
export type QuestionDraft = Omit<Question, "id" | "number">;

const TYPES: Record<Question["type"], string> = {
  "short-answer": "Short answer",
  "open-ended": "Open answer",
  calculation: "Calculation",
  "multiple-choice": "Multiple choice",
};
const DIFFICULTIES: Question["difficulty"][] = ["Easy", "Medium", "Hard"];

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
  const details = [
    `${question.points} ${question.points === 1 ? "point" : "points"}`,
    TYPES[question.type],
    question.difficulty,
    question.skill,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      {editing ? (
        <QuestionForm
          initial={question}
          submitLabel="Save question"
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
              Question {question.number}
              {question.topic && ` · ${question.topic}`}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm">{question.prompt}</p>
            <p className="mt-1 text-xs text-muted-foreground">{details.join(" · ")}</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Remove question ${question.number}`}
                onClick={() => {
                  if (window.confirm(`Remove question ${question.number}?`)) onRemove();
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
  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add question
      </Button>
    );
  }
  return (
    <div className="rounded-lg border border-primary/30 bg-surface p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold">New question</p>
      <QuestionForm
        initial={EMPTY_QUESTION}
        submitLabel="Add question"
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
      <Field label="Question" className="sm:col-span-3">
        <Textarea
          rows={3}
          required
          {...text("prompt")}
          placeholder="Differentiate f(x) = 3x² + 5x − 2."
        />
      </Field>
      <Field label="Type">
        <Select
          value={draft.type}
          onValueChange={(v) => setDraft((d) => ({ ...d, type: v as Question["type"] }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Points">
        <Input
          type="number"
          min={1}
          required
          value={draft.points}
          onChange={(e) => setDraft((d) => ({ ...d, points: e.target.valueAsNumber || 0 }))}
        />
      </Field>
      <Field label="Difficulty">
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
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Topic">
        <Input {...text("topic")} placeholder="Derivatives" />
      </Field>
      <Field label="Skill tested">
        <Input {...text("skill")} placeholder="Power rule" />
      </Field>
      <Field label="Learning objective">
        <Input {...text("objective")} />
      </Field>
      <Field label="Expected answer" className="sm:col-span-3">
        <Textarea rows={2} {...text("expectedAnswer")} />
      </Field>
      <Field label="Grading criteria" className="sm:col-span-3">
        <Textarea rows={2} {...text("gradingCriteria")} />
      </Field>
      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" size="sm" disabled={!draft.prompt.trim() || draft.points < 1}>
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
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
