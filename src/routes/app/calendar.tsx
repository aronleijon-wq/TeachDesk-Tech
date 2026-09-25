import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatusPill, formatDate } from "@/components/primitives";
import { todayEvents, upcomingWeek, classById } from "@/lib/demo-data";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — TeachDesk" },
      { name: "description", content: "Lessons, exams, retakes and deadlines in one teaching calendar." },
      { property: "og:title", content: "Calendar — TeachDesk" },
      { property: "og:description", content: "Lessons, exams, retakes and deadlines." },
    ],
  }),
  component: CalendarPage,
});

const toneFor = (kind: string) =>
  kind === "exam" ? "primary" : kind === "retake" ? "warning" : kind === "deadline" ? "danger" : "neutral";

function CalendarPage() {
  const grouped = upcomingWeek
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce<Record<string, typeof upcomingWeek>>((acc, ev) => {
      (acc[ev.date] ||= []).push(ev);
      return acc;
    }, {});

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Calendar" subtitle="Lessons, exams, retakes and deadlines." />

      <div className="space-y-4">
        <Panel title="Today">
          <ol className="space-y-1">
            {todayEvents.map((ev) => (
              <li key={ev.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                <span className="w-12 text-xs font-semibold tabular-nums text-muted-foreground">{ev.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{ev.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[classById(ev.classId ?? "")?.name, ev.room, ev.students ? `${ev.students} students` : null]
                      .filter(Boolean)
                      .join(" · ") || "No room booked"}
                  </span>
                </span>
                <StatusPill tone={toneFor(ev.kind)}>{ev.kind}</StatusPill>
              </li>
            ))}
          </ol>
        </Panel>

        {Object.entries(grouped).map(([date, items]) => (
          <Panel key={date} title={formatDate(date)}>
            <ol className="space-y-1">
              {items.map((ev) => (
                <li key={ev.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                  <span className="w-12 text-xs font-semibold tabular-nums text-muted-foreground">{ev.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{ev.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {[classById(ev.classId ?? "")?.name, ev.room].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <StatusPill tone={toneFor(ev.kind)}>{ev.kind}</StatusPill>
                </li>
              ))}
            </ol>
          </Panel>
        ))}
      </div>
    </div>
  );
}
