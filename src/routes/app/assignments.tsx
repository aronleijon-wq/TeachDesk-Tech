import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { EmptyState, PageHeader, Panel, ProgressBar, StatusPill, formatDate } from "@/components/primitives";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — TeachDesk" },
      { name: "description", content: "Submissions and what's left to grade for each assignment." },
      { property: "og:title", content: "Assignments — TeachDesk" },
      { property: "og:description", content: "Submissions and what's left to grade." },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { assignments, classById } = useStore();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Assignments" subtitle="Submissions and what's left to grade." />

      {assignments.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Assignments are coming later"
          description="For now TeachDesk handles exams, retakes, results and follow-up. You can see how assignments will look in the demo (Settings → Show demo data)."
        />
      )}

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
