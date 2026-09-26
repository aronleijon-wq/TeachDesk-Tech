// Pieces shared by the New exam and Generate exam dialogs: form fields, a place to drop a
// file, a preview of the questions before the exam is created, and the note on Pro features.
import { Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/primitives";
import { Label } from "@/components/ui/label";
import type { QuestionDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A labelled form field. */
export function Field({
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
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Click or drop a file here — or several, with `multiple`. */
export function DropZone({
  fileName,
  prompt,
  hint,
  multiple = false,
  onFiles,
}: {
  fileName: string | undefined;
  prompt: string;
  hint: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-6 text-center transition-colors hover:border-primary/50"
    >
      <Upload className="size-5 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{fileName ?? prompt}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <input
        type="file"
        multiple={multiple}
        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.csv,.tsv,application/pdf,image/*,text/plain,text/csv"
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = ""; // Lets the same file be chosen again.
        }}
      />
    </label>
  );
}

/** The questions an exam will start with, and anything to double-check. */
export function ExamDraftPreview({
  questions,
  warnings,
}: {
  questions: QuestionDraft[];
  warnings: string[];
}) {
  const points = questions.reduce((sum, q) => sum + q.points, 0);
  return (
    <div className="rounded-md border border-border p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">
          {questions.length} questions · {points} points
        </p>
        <StatusPill tone="success">Ready</StatusPill>
      </div>
      {warnings.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <ol className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
        {questions.map((q, i) => (
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

export function ProNote() {
  return (
    <p className="rounded-md bg-primary-soft/50 px-3 py-2 text-sm">
      This is part of Pro.{" "}
      <Link to="/app/pricing" className="font-medium text-primary hover:underline">
        See plans
      </Link>
    </p>
  );
}
