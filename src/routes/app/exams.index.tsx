import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, ProgressBar, StatusPill } from "@/components/primitives";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { GenerateExamDialog } from "@/components/generate-exam-dialog";
import { NewExamDialog } from "@/components/new-exam-dialog";
import { cn } from "@/lib/utils";
import { examStage, type ExamStage } from "@/lib/workspace";

const filters = ["all", "upcoming", "completed", "needs-grading", "retakes", "drafts"] as const;

const messages = defineMessages({
  en: {
    pageTitle: "Exams — TeachDesk",
    title: "Exams",
    subtitle: "Create, manage and track your exams.",
    generate: "Generate exam with AI",
    newExam: "New exam",
    search: "Search exams",
    filters: {
      all: "All",
      upcoming: "Upcoming",
      completed: "Completed",
      "needs-grading": "Needs grading",
      retakes: "Retakes",
      drafts: "Drafts",
    } satisfies Record<(typeof filters)[number], string>,
    stages: {
      draft: "Draft",
      upcoming: "Upcoming",
      "needs-grading": "Needs grading",
      completed: "Completed",
    } satisfies Record<ExamStage, string>,
    noMatch: "No exams match this filter",
    noMatchText: "Try another filter, or create a new exam to get started.",
    details: (points: number, students: number) =>
      `${points} points · ${students} ${students === 1 ? "student" : "students"}`,
    absent: (n: number) => `${n} absent`,
    retakes: (n: number) => `${n} ${n === 1 ? "retake" : "retakes"}`,
    versions: (n: number) => `${n} ${n === 1 ? "version" : "versions"}`,
    deleteLabel: (title: string) => `Delete ${title}`,
    deleteTitle: (title: string) => `Delete ${title}?`,
    deleteText: "Its questions, versions, results and retakes are deleted too. This can't be undone.",
    deleteConfirm: "Delete exam",
    deleted: (title: string) => `${title} deleted`,
  },
  sv: {
    pageTitle: "Prov — TeachDesk",
    title: "Prov",
    subtitle: "Skapa, hantera och följ upp dina prov.",
    generate: "Skapa prov med AI",
    newExam: "Nytt prov",
    search: "Sök prov",
    filters: {
      all: "Alla",
      upcoming: "Kommande",
      completed: "Klara",
      "needs-grading": "Att rätta",
      retakes: "Omprov",
      drafts: "Utkast",
    },
    stages: {
      draft: "Utkast",
      upcoming: "Kommande",
      "needs-grading": "Att rätta",
      completed: "Klart",
    },
    noMatch: "Inga prov matchar filtret",
    noMatchText: "Prova ett annat filter eller skapa ett nytt prov.",
    details: (points, students) =>
      `${points} poäng · ${students} ${students === 1 ? "elev" : "elever"}`,
    absent: (n) => `${n} frånvarande`,
    retakes: (n) => `${n} omprov`,
    versions: (n) => `${n} ${n === 1 ? "version" : "versioner"}`,
    deleteLabel: (title) => `Ta bort ${title}`,
    deleteTitle: (title) => `Ta bort ${title}?`,
    deleteText: "Frågor, versioner, resultat och omprov tas också bort. Det går inte att ångra.",
    deleteConfirm: "Ta bort provet",
    deleted: (title) => `${title} har tagits bort`,
  },
});

export const Route = createFileRoute("/app/exams/")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: ExamsPage,
});

const stageTone: Record<ExamStage, "neutral" | "primary" | "warning" | "success"> = {
  draft: "neutral",
  upcoming: "primary",
  "needs-grading": "warning",
  completed: "success",
};

function ExamsPage() {
  const { exams, retakes, classById, classSize, removeExam } = useStore();
  const { formatDate } = useLanguage();
  const t = useMessages(messages);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [query, setQuery] = useState("");
  // Which way of creating an exam is open, if any.
  const [creating, setCreating] = useState<"manual" | "ai" | null>(null);
  const navigate = useNavigate();
  const openExam = (id: string) => void navigate({ to: "/app/exams/$examId", params: { examId: id } });

  const visible = useMemo(() => {
    return exams.filter((e) => {
      const matchesQuery =
        !query ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        (classById(e.classId)?.name ?? "").toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;
      switch (filter) {
        case "upcoming":
          return examStage(e) === "upcoming";
        case "completed":
          return examStage(e) === "completed";
        case "needs-grading":
          return examStage(e) === "needs-grading";
        case "drafts":
          return examStage(e) === "draft";
        case "retakes":
          return retakes.some((r) => r.examId === e.id);
        default:
          return true;
      }
    });
  }, [exams, filter, query, retakes, classById]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            <Button variant="outline" onClick={() => setCreating("ai")}>
              <Sparkles className="size-4" /> {t.generate}
            </Button>
            <Button onClick={() => setCreating("manual")}>
              <Plus className="size-4" /> {t.newExam}
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {t.filters[f]}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t.noMatch}
          description={t.noMatchText}
          action={<Button onClick={() => setCreating("manual")}><Plus className="size-4" /> {t.newExam}</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((e) => {
            const total = e.attendance.length || classSize(e.classId);
            const done = e.attendance.filter((a) => a.status === "completed").length;
            const absent = e.attendance.filter((a) => a.status === "absent").length;
            const examRetakes = retakes.filter((r) => r.examId === e.id).length;
            const stage = examStage(e);
            return (
              <div
                key={e.id}
                className="relative rounded-lg border border-border bg-surface shadow-card transition-all hover:border-primary/40 hover:shadow-panel"
              >
                <Link to="/app/exams/$examId" params={{ examId: e.id }} className="block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="label-xs">{classById(e.classId)?.name}</p>
                      <p className="mt-1 text-[15px] font-semibold">{e.title}</p>
                    </div>
                    <StatusPill tone={stageTone[stage]}>{t.stages[stage]}</StatusPill>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(e.date)} · {e.time} · {t.details(e.totalPoints, total)}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={total ? (done / total) * 100 : 0} tone={stage === "completed" ? "success" : "primary"} />
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{done}/{total}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 pr-10">
                    {absent > 0 && <StatusPill tone="danger">{t.absent(absent)}</StatusPill>}
                    {examRetakes > 0 && <StatusPill tone="primary">{t.retakes(examRetakes)}</StatusPill>}
                    <StatusPill>{t.versions(e.versions.length)}</StatusPill>
                  </div>
                </Link>
                <div className="absolute bottom-2 right-2">
                  <ConfirmButton
                    variant="ghost"
                    label={<Trash2 className="size-4" />}
                    ariaLabel={t.deleteLabel(e.title)}
                    title={t.deleteTitle(e.title)}
                    description={t.deleteText}
                    confirm={t.deleteConfirm}
                    onConfirm={() => {
                      removeExam(e.id);
                      toast.success(t.deleted(e.title));
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mounted only while open, so every new exam starts from an empty form. */}
      {creating === "manual" && (
        <NewExamDialog
          open
          onOpenChange={(open) => !open && setCreating(null)}
          onGenerateWithAi={() => setCreating("ai")}
          onCreated={openExam}
        />
      )}
      {creating === "ai" && (
        <GenerateExamDialog open onOpenChange={(open) => !open && setCreating(null)} onCreated={openExam} />
      )}
    </div>
  );
}
