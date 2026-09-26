import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatusPill } from "@/components/primitives";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { useCalendar, useStore } from "@/lib/store";
import type { CalendarEvent } from "@/lib/types";

const messages = defineMessages({
  en: {
    pageTitle: "Calendar — TeachDesk",
    title: "Calendar",
    subtitle: "Lessons, exams, retakes and deadlines.",
    today: "Today",
    nothingToday: "Nothing scheduled today.",
    students: (n: number) => `${n} ${n === 1 ? "student" : "students"}`,
    noRoom: "No room booked",
    nothingComing:
      "Nothing coming up yet. Exams, scheduled retakes and assignment deadlines appear here automatically.",
    kinds: {
      lesson: "Lesson",
      exam: "Exam",
      retake: "Retake",
      deadline: "Deadline",
      planning: "Planning",
    } satisfies Record<CalendarEvent["kind"], string>,
  },
  sv: {
    pageTitle: "Kalender — TeachDesk",
    title: "Kalender",
    subtitle: "Lektioner, prov, omprov och inlämningar.",
    today: "Idag",
    nothingToday: "Inget inplanerat idag.",
    students: (n) => `${n} ${n === 1 ? "elev" : "elever"}`,
    noRoom: "Ingen sal bokad",
    nothingComing:
      "Inget inplanerat än. Prov, bokade omprov och sista inlämningsdagar hamnar här automatiskt.",
    kinds: {
      lesson: "Lektion",
      exam: "Prov",
      retake: "Omprov",
      deadline: "Inlämning",
      planning: "Planering",
    },
  },
});

export const Route = createFileRoute("/app/calendar")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: CalendarPage,
});

const toneFor = (kind: string) =>
  kind === "exam" ? "primary" : kind === "retake" ? "warning" : kind === "deadline" ? "danger" : "neutral";

function CalendarPage() {
  const { classById } = useStore();
  const { formatDate } = useLanguage();
  const t = useMessages(messages);
  const { today: todayEvents, upcoming } = useCalendar();
  const grouped = upcoming.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    (acc[ev.date] ||= []).push(ev);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="space-y-4">
        <Panel title={t.today}>
          {todayEvents.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">{t.nothingToday}</p>}
          <ol className="space-y-1">
            {todayEvents.map((ev) => (
              <li key={ev.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                <span className="w-12 text-xs font-semibold tabular-nums text-muted-foreground">{ev.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{ev.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[classById(ev.classId ?? "")?.name, ev.room, ev.students ? t.students(ev.students) : null]
                      .filter(Boolean)
                      .join(" · ") || t.noRoom}
                  </span>
                </span>
                <StatusPill tone={toneFor(ev.kind)}>{t.kinds[ev.kind]}</StatusPill>
              </li>
            ))}
          </ol>
        </Panel>

        {upcoming.length === 0 && (
          <Panel>
            <p className="text-sm text-muted-foreground">
              {t.nothingComing}
            </p>
          </Panel>
        )}

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
                  <StatusPill tone={toneFor(ev.kind)}>{t.kinds[ev.kind]}</StatusPill>
                </li>
              ))}
            </ol>
          </Panel>
        ))}
      </div>
    </div>
  );
}
