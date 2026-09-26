import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { Panel } from "@/components/primitives";
import { PrintableExam } from "@/components/printable-exam";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defineMessages, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const messages = defineMessages({
  en: {
    pageTitle: "Print exam — TeachDesk",
    back: "Back to the exam",
    version: "Version",
    studentCopy: "Student copy",
    answerKey: "Answer key",
    print: "Print or save as PDF",
    noQuestions:
      "This exam has no questions yet. Add them on the exam's Questions tab, then print it.",
  },
  sv: {
    pageTitle: "Skriv ut prov — TeachDesk",
    back: "Tillbaka till provet",
    version: "Version",
    studentCopy: "Elevens exemplar",
    answerKey: "Facit",
    print: "Skriv ut eller spara som PDF",
    noQuestions:
      "Provet har inga frågor än. Lägg till dem under fliken Frågor och skriv sedan ut provet.",
  },
});

// Printing an exam: pick the version and the student copy or the answer key, then print.
// The browser's print dialog can also save it as a PDF; the app's menus aren't printed.
export const Route = createFileRoute("/app/print/$examId")({
  validateSearch: (search: Record<string, unknown>): { version?: string; answers?: boolean } => ({
    ...(typeof search["version"] === "string" && { version: search["version"] }),
    ...((search["answers"] === true || search["answers"] === "true") && { answers: true }),
  }),
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: PrintExam,
});

function PrintExam() {
  const { examId } = Route.useParams();
  const { version: versionId, answers = false } = Route.useSearch();
  const { exams, classById, profile } = useStore();
  const t = useMessages(messages);
  const navigate = useNavigate();
  const exam = exams.find((e) => e.id === examId);
  if (!exam) throw notFound();

  const version = exam.versions.find((v) => v.id === versionId) ?? exam.versions[0];
  const show = (next: { version?: string; answers?: boolean }) =>
    void navigate({ to: "/app/print/$examId", params: { examId }, search: next, replace: true });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link to="/app/exams/$examId" params={{ examId }}>
            <ArrowLeft className="size-4" /> {t.back}
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {exam.versions.length > 1 && version && (
            <Select
              value={version.id}
              onValueChange={(id) => show({ version: id, ...(answers && { answers }) })}
            >
              <SelectTrigger className="h-9 w-36" aria-label={t.version}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exam.versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex rounded-md border border-border p-0.5">
            {[false, true].map((key) => (
              <button
                key={String(key)}
                type="button"
                onClick={() =>
                  show({ ...(version && { version: version.id }), ...(key && { answers: true }) })
                }
                className={cn(
                  "rounded px-3 py-1.5 text-sm",
                  answers === key
                    ? "bg-primary-soft font-medium text-primary"
                    : "text-muted-foreground",
                )}
              >
                {key ? t.answerKey : t.studentCopy}
              </button>
            ))}
          </div>
          <Button onClick={() => window.print()} disabled={!version}>
            <Printer className="size-4" /> {t.print}
          </Button>
        </div>
      </div>

      {!version ? (
        <Panel>
          <p className="text-sm text-muted-foreground">{t.noQuestions}</p>
        </Panel>
      ) : (
        <PrintableExam
          exam={exam}
          version={version}
          answers={answers}
          heading={[profile.school, classById(exam.classId)?.name].filter(Boolean).join(" · ")}
        />
      )}
    </div>
  );
}
