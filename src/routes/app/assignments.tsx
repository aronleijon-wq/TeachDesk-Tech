import { createFileRoute } from "@tanstack/react-router";
import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, ProgressBar, StatusPill, formatDate } from "@/components/primitives";
import { classById } from "@/lib/demo-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — TeachDesk" },
      { name: "description", content: "Track submissions, grading queues and rubrics for every assignment." },
      { property: "og:title", content: "Assignments — TeachDesk" },
      { property: "og:description", content: "Submissions, grading queues and rubrics." },
    ],
  }),
  component: AssignmentsPage,
});

const demoRubric = [
  { criterion: "Method and reasoning", points: 8, descriptor: "Chooses a suitable method and motivates each step." },
  { criterion: "Mathematical accuracy", points: 6, descriptor: "Calculations are correct and clearly presented." },
  { criterion: "Communication", points: 4, descriptor: "Uses correct notation and explains the answer." },
  { criterion: "Interpretation", points: 2, descriptor: "Relates the result back to the original problem." },
];

function AssignmentsPage() {
  const { assignments, setRubric } = useStore();
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Assignments"
        subtitle="Submissions, grading queues and rubrics."
        actions={<Button onClick={() => toast.info("Assignment builder opens from a class")}> <Plus className="size-4" /> New assignment</Button>}
      />

      <div className="space-y-3">
        {assignments.map((a) => (
          <Panel key={a.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="label-xs">{classById(a.classId)?.name}</p>
                <p className="mt-1 text-[15px] font-semibold">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {formatDate(a.due)} · {a.submitted}/{a.total} submitted
                </p>
              </div>
              <div className="flex items-center gap-2">
                {a.toGrade > 0 && <StatusPill tone="warning">{a.toGrade} to grade</StatusPill>}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === a.id}
                  onClick={() => {
                    setBusy(a.id);
                    setTimeout(() => {
                      setRubric(a.id, demoRubric);
                      setBusy(null);
                      toast.success("Rubric drafted", { description: "Review and edit before using it for grading." });
                    }, 900);
                  }}
                >
                  <Sparkles className="size-4" /> {busy === a.id ? "Drafting..." : "Create rubric"}
                </Button>
              </div>
            </div>

            <div className="mt-3"><ProgressBar value={(a.submitted / a.total) * 100} /></div>

            {a.rubric && (
              <ul className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                {a.rubric.map((r) => (
                  <li key={r.criterion} className="flex items-start justify-between gap-3">
                    <span>
                      <span className="font-medium">{r.criterion}</span>
                      <span className="block text-xs text-muted-foreground">{r.descriptor}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{r.points} p</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
