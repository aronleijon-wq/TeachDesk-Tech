import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { EmptyState, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/primitives";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const messages = defineMessages({
  en: {
    pageTitle: "Assignments — TeachDesk",
    title: "Assignments",
    subtitle: "Submissions and what's left to grade.",
    comingLater: "Assignments are coming later",
    comingLaterText:
      "For now TeachDesk handles exams, retakes, results and follow-up. You can see how assignments will look in the demo (Settings → Show demo data).",
    details: (due: string, submitted: number, total: number) =>
      `Due ${due} · ${submitted}/${total} submitted`,
    toGrade: (n: number) => `${n} to grade`,
  },
  sv: {
    pageTitle: "Uppgifter — TeachDesk",
    title: "Uppgifter",
    subtitle: "Inlämningar och vad som är kvar att bedöma.",
    comingLater: "Uppgifter kommer senare",
    comingLaterText:
      "Just nu hanterar TeachDesk prov, omprov, resultat och uppföljning. Du kan se hur uppgifter kommer att se ut i exempeldatan (Inställningar → Visa exempeldata).",
    details: (due, submitted, total) => `Senast ${due} · ${submitted}/${total} inlämnade`,
    toGrade: (n) => `${n} att bedöma`,
  },
});

export const Route = createFileRoute("/app/assignments")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { assignments, classById } = useStore();
  const { formatDate } = useLanguage();
  const t = useMessages(messages);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {assignments.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title={t.comingLater}
          description={t.comingLaterText}
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
                  {t.details(formatDate(a.due), a.submitted, a.total)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {a.toGrade > 0 && <StatusPill tone="warning">{t.toGrade(a.toGrade)}</StatusPill>}

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
