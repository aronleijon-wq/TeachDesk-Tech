import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileWarning,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, ProgressBar, StatCard, StatusPill, formatDate } from "@/components/primitives";
import { attentionNotes, type AttentionKind } from "@/lib/attention";
import { useAttentionSummary, useCalendar, useStore } from "@/lib/store";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TeachDesk" },
      { name: "description", content: "See what needs your attention today: missed exams, grading, retakes and missing work." },
      { property: "og:title", content: "Dashboard — TeachDesk" },
      { property: "og:description", content: "See what needs your attention today across your classes." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// How each kind of note looks on the dashboard, and what its button says.
const noteStyle: Record<AttentionKind, { icon: typeof AlertTriangle; tone: "danger" | "warning" | "neutral"; cta: string }> = {
  retakes: { icon: AlertTriangle, tone: "danger", cta: "Schedule retakes" },
  "exam-results": { icon: ClipboardCheck, tone: "warning", cta: "Enter results" },
  assignments: { icon: ClipboardList, tone: "warning", cta: "Start grading" },
  "follow-up": { icon: FileWarning, tone: "neutral", cta: "Review students" },
};

function Dashboard() {
  const { exams, profile, classById, classSize, classes, demoMode } = useStore();
  const { today: todayEvents } = useCalendar();
  const summary = useAttentionSummary();
  const { upcoming, openRetakes, retakesToSchedule, papersToGrade, submissionsToGrade } = summary;
  const notes = attentionNotes(summary, (classId) => classById(classId)?.name);
  const [nextExam] = upcoming;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`${greeting()}, ${profile.name.trim().split(/\s+/)[0] || "there"}`} subtitle="Here's what needs your attention." />

      {!demoMode && classes.length === 0 && (
        <div className="mb-6">
          <EmptyState
            icon={Users}
            title="Start by adding your class"
            description="Create a class and paste in your student list. Exams, retakes and the gradebook then use your own students."
            action={
              <Button asChild>
                <Link to="/app/students">Add your class</Link>
              </Button>
            }
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Upcoming exams"
          value={upcoming.length}
          hint={nextExam ? `Next: ${formatDate(nextExam.date)}` : "None planned"}
          icon={BookOpen}
        />
        <StatCard
          label="To grade"
          value={papersToGrade + submissionsToGrade}
          hint={`${papersToGrade} exam papers · ${submissionsToGrade} assignments`}
          icon={ClipboardList}
        />
        <StatCard
          label="Missing work"
          value={summary.studentsToFollowUp.length}
          hint="Students with missed exams or assignments"
          icon={FileWarning}
        />
        <StatCard
          label="Retakes"
          value={openRetakes.length}
          hint={`${retakesToSchedule.length} need scheduling`}
          icon={RefreshCw}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Needs attention" description="Items that block your day">
            {notes.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-success" /> You're all caught up — nothing needs your attention right now.
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <AttentionCard
                    key={note.kind}
                    {...noteStyle[note.kind]}
                    title={note.title}
                    meta={note.detail}
                    names={note.names}
                    to={note.to}
                    {...(note.params ? { params: note.params } : {})}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Upcoming exams" action={<Link className="text-xs font-medium text-primary" to="/app/exams">View all</Link>}>
            {upcoming.length === 0 ? (
              <EmptyState icon={BookOpen} title="No upcoming exams" description="Create an exam to get started." />
            ) : (
              <ul className="space-y-3">
                {upcoming.map((e) => {
                  const done = e.attendance.filter((a) => a.status === "completed").length;
                  const absent = e.attendance.filter((a) => a.status === "absent").length;
                  const total = e.attendance.length || classSize(e.classId);
                  return (
                    <li key={e.id} className="rounded-md border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="label-xs">{classById(e.classId)?.name}</p>
                          <p className="mt-1 text-sm font-semibold">{e.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(e.date)} · {e.time} · {e.room} · {total} students
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/app/exams/$examId" params={{ examId: e.id }}>Open exam</Link>
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={total ? (done / total) * 100 : 0} />
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {done}/{total} completed{absent ? ` · ${absent} absent` : ""}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Today" description={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}>
            {todayEvents.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">Nothing scheduled today.</p>}
            <ol className="space-y-1">
              {todayEvents.map((ev) => (
                <li key={ev.id} className="flex gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent">
                  <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{ev.time}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{ev.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {[ev.room, ev.students ? `${ev.students} students` : null].filter(Boolean).join(" · ") || "No room booked"}
                    </span>
                  </span>
                  {ev.kind === "retake" && <StatusPill tone="primary">Retake</StatusPill>}
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Retake queue" action={<CalendarClock className="size-4 text-muted-foreground" />}>
            {openRetakes.length === 0 && <p className="text-sm text-muted-foreground">No retakes waiting.</p>}
            <ul className="space-y-2 text-sm">
              {openRetakes.map((r) => {
                const exam = exams.find((e) => e.id === r.examId);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{exam?.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.status === "scheduled" ? `${formatDate(r.date!)} · ${r.time} · ${r.room}` : "Not scheduled"}
                      </span>
                    </span>
                    <StatusPill tone={r.status === "scheduled" ? "success" : "warning"}>
                      {r.status === "scheduled" ? "Scheduled" : "Needs scheduling"}
                    </StatusPill>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function AttentionCard({
  icon: Icon,
  title,
  meta,
  names,
  to,
  params,
  cta,
  tone,
}: {
  icon: typeof AlertTriangle;
  title: string;
  meta: string;
  names?: string[];
  to: string;
  params?: Record<string, string>;
  cta: string;
  tone: "danger" | "warning" | "primary" | "neutral";
}) {
  return (
    <div className="rounded-md border border-border p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <span className="mt-0.5">
          <Icon
            className={
              tone === "danger"
                ? "size-4 text-destructive"
                : tone === "warning"
                  ? "size-4 text-warning"
                  : tone === "primary"
                    ? "size-4 text-primary"
                    : "size-4 text-muted-foreground"
            }
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
          {names && names.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-sm">
              {names.slice(0, 4).map((n) => (
                <li key={n} className="text-muted-foreground">{n}</li>
              ))}
            </ul>
          )}
          <Button size="sm" variant="ghost" className="mt-2 -ml-2 h-8 text-primary" asChild>
            {params ? (
              <Link to={to} params={params}>
                {cta} <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <Link to={to}>
                {cta} <ArrowRight className="size-3.5" />
              </Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
