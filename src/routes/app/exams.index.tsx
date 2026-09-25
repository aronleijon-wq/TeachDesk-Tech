import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, ProgressBar, StatusPill, formatDate } from "@/components/primitives";
import { classById } from "@/lib/demo-data";
import { useStore } from "@/lib/store";
import { NewExamDialog } from "@/components/new-exam-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/exams/")({
  head: () => ({
    meta: [
      { title: "Exams — Classflow" },
      { name: "description", content: "Create, manage and track exams, versions, attendance and retakes." },
      { property: "og:title", content: "Exams — Classflow" },
      { property: "og:description", content: "Create, manage and track your exams." },
    ],
  }),
  component: ExamsPage,
});

const filters = ["All", "Upcoming", "Completed", "Needs grading", "Retakes", "Drafts"] as const;

function ExamsPage() {
  const { exams, retakes } = useStore();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const navigate = useNavigate();

  const visible = useMemo(() => {
    return exams.filter((e) => {
      const matchesQuery =
        !query ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        (classById(e.classId)?.name ?? "").toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;
      switch (filter) {
        case "Upcoming":
          return e.status === "upcoming";
        case "Completed":
          return e.status === "completed";
        case "Needs grading":
          return e.status === "needs-grading";
        case "Drafts":
          return e.status === "draft";
        case "Retakes":
          return retakes.some((r) => r.examId === e.id);
        default:
          return true;
      }
    });
  }, [exams, filter, query, retakes]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Exams"
        subtitle="Create, manage and track your exams."
        actions={
          <>
            <Button variant="outline" onClick={() => { setAiMode(true); setDialogOpen(true); }}>
              <Sparkles className="size-4" /> AI generate exam
            </Button>
            <Button onClick={() => { setAiMode(false); setDialogOpen(true); }}>
              <Plus className="size-4" /> New exam
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
            placeholder="Search exams"
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
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No exams match this filter"
          description="Try another filter, or create a new exam to get started."
          action={<Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> New exam</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((e) => {
            const total = e.attendance.length || classById(e.classId)?.studentCount || 0;
            const done = e.attendance.filter((a) => a.status === "completed").length;
            const absent = e.attendance.filter((a) => a.status === "absent").length;
            const examRetakes = retakes.filter((r) => r.examId === e.id).length;
            return (
              <Link
                key={e.id}
                to="/app/exams/$examId"
                params={{ examId: e.id }}
                className="rounded-lg border border-border bg-surface p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-panel"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="label-xs">{classById(e.classId)?.name}</p>
                    <p className="mt-1 text-[15px] font-semibold">{e.title}</p>
                  </div>
                  <StatusPill
                    tone={
                      e.status === "completed"
                        ? "success"
                        : e.status === "needs-grading"
                          ? "warning"
                          : e.status === "draft"
                            ? "neutral"
                            : "primary"
                    }
                  >
                    {e.status === "needs-grading" ? "Needs grading" : e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                  </StatusPill>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDate(e.date)} · {e.time} · {e.totalPoints} points · {total} students
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={total ? (done / total) * 100 : 0} tone={e.status === "completed" ? "success" : "primary"} />
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{done}/{total}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {absent > 0 && <StatusPill tone="danger">{absent} absent</StatusPill>}
                  {examRetakes > 0 && <StatusPill tone="primary">{examRetakes} retakes</StatusPill>}
                  <StatusPill>{e.versions.length} versions</StatusPill>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <NewExamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aiFirst={aiMode}
        onCreated={(id) => navigate({ to: "/app/exams/$examId", params: { examId: id } })}
      />
    </div>
  );
}
