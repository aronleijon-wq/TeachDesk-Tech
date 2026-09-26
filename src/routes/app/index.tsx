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
import { EmptyState, PageHeader, Panel, ProgressBar, StatCard, StatusPill } from "@/components/primitives";
import { attentionNotes, type AttentionKind } from "@/lib/attention";
import { defineMessages, formatLongDate, useLanguage, useMessages } from "@/lib/i18n";
import { useAttentionSummary, useCalendar, useStore } from "@/lib/store";

const messages = defineMessages({
  en: {
    pageTitle: "Dashboard — TeachDesk",
    greeting: (hour: number, name: string) =>
      `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}, ${name || "there"}`,
    subtitle: "Here's what needs your attention.",
    addClassTitle: "Start by adding your class",
    addClassText:
      "Create a class and paste in your student list. Exams, retakes and the gradebook then use your own students.",
    addClass: "Add your class",
    upcomingExams: "Upcoming exams",
    next: (date: string) => `Next: ${date}`,
    nonePlanned: "None planned",
    toGrade: "To grade",
    toGradeHint: (papers: number, submissions: number) =>
      `${papers} exam papers · ${submissions} assignments`,
    missingWork: "Missing work",
    missingWorkHint: "Students with missed exams or assignments",
    retakes: "Retakes",
    needScheduling: (n: number) => `${n} need scheduling`,
    needsAttention: "Needs attention",
    needsAttentionText: "Items that block your day",
    allCaughtUp: "You're all caught up — nothing needs your attention right now.",
    viewAll: "View all",
    noUpcoming: "No upcoming exams",
    noUpcomingText: "Create an exam to get started.",
    students: (n: number) => `${n} ${n === 1 ? "student" : "students"}`,
    openExam: "Open exam",
    completed: (done: number, total: number) => `${done}/${total} completed`,
    absent: (n: number) => `${n} absent`,
    today: "Today",
    nothingToday: "Nothing scheduled today.",
    noRoom: "No room booked",
    retake: "Retake",
    retakeQueue: "Retake queue",
    noRetakes: "No retakes waiting.",
    notScheduled: "Not scheduled",
    scheduled: "Scheduled",
    needsScheduling: "Needs scheduling",
    cta: {
      retakes: "Schedule retakes",
      "exam-results": "Enter results",
      assignments: "Start grading",
      "follow-up": "Review students",
    } satisfies Record<AttentionKind, string>,
  },
  sv: {
    pageTitle: "Översikt — TeachDesk",
    greeting: (hour, name) =>
      `${hour < 12 ? "God morgon" : hour < 18 ? "God eftermiddag" : "God kväll"}${name ? `, ${name}` : ""}`,
    subtitle: "Här är det som behöver din uppmärksamhet.",
    addClassTitle: "Börja med att lägga till din klass",
    addClassText:
      "Skapa en klass och klistra in elevlistan. Prov, omprov och resultat använder sedan dina egna elever.",
    addClass: "Lägg till din klass",
    upcomingExams: "Kommande prov",
    next: (date) => `Nästa: ${date}`,
    nonePlanned: "Inga inplanerade",
    toGrade: "Att rätta",
    toGradeHint: (papers, submissions) => `${papers} prov · ${submissions} uppgifter`,
    missingWork: "Att följa upp",
    missingWorkHint: "Elever med missade prov eller uppgifter",
    retakes: "Omprov",
    needScheduling: (n) => `${n} behöver bokas`,
    needsAttention: "Behöver göras",
    needsAttentionText: "Det här bör du ta hand om först",
    allCaughtUp: "Du är i fas — inget behöver din uppmärksamhet just nu.",
    viewAll: "Visa alla",
    noUpcoming: "Inga kommande prov",
    noUpcomingText: "Skapa ett prov för att komma igång.",
    students: (n) => `${n} ${n === 1 ? "elev" : "elever"}`,
    openExam: "Öppna provet",
    completed: (done, total) => `${done}/${total} klara`,
    absent: (n) => `${n} frånvarande`,
    today: "Idag",
    nothingToday: "Inget inplanerat idag.",
    noRoom: "Ingen sal bokad",
    retake: "Omprov",
    retakeQueue: "Omprovskö",
    noRetakes: "Inga omprov väntar.",
    notScheduled: "Inte bokat",
    scheduled: "Bokat",
    needsScheduling: "Behöver bokas",
    cta: {
      retakes: "Boka omprov",
      "exam-results": "Fyll i resultat",
      assignments: "Börja bedöma",
      "follow-up": "Se eleverna",
    },
  },
});

export const Route = createFileRoute("/app/")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: Dashboard,
});

// How each kind of note looks on the dashboard.
const noteStyle: Record<AttentionKind, { icon: typeof AlertTriangle; tone: "danger" | "warning" | "neutral" }> = {
  retakes: { icon: AlertTriangle, tone: "danger" },
  "exam-results": { icon: ClipboardCheck, tone: "warning" },
  assignments: { icon: ClipboardList, tone: "warning" },
  "follow-up": { icon: FileWarning, tone: "neutral" },
};

function Dashboard() {
  const { exams, profile, classById, classSize, classes, demoMode } = useStore();
  const { language, formatDate } = useLanguage();
  const t = useMessages(messages);
  const { today: todayEvents } = useCalendar();
  const summary = useAttentionSummary();
  const { upcoming, openRetakes, retakesToSchedule, papersToGrade, submissionsToGrade } = summary;
  const notes = attentionNotes(summary, (classId) => classById(classId)?.name, language);
  const [nextExam] = upcoming;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t.greeting(new Date().getHours(), profile.name.trim().split(/\s+/)[0] ?? "")}
        subtitle={t.subtitle}
      />

      {!demoMode && classes.length === 0 && (
        <div className="mb-6">
          <EmptyState
            icon={Users}
            title={t.addClassTitle}
            description={t.addClassText}
            action={
              <Button asChild>
                <Link to="/app/students">{t.addClass}</Link>
              </Button>
            }
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.upcomingExams}
          value={upcoming.length}
          hint={nextExam ? t.next(formatDate(nextExam.date)) : t.nonePlanned}
          icon={BookOpen}
        />
        <StatCard
          label={t.toGrade}
          value={papersToGrade + submissionsToGrade}
          hint={t.toGradeHint(papersToGrade, submissionsToGrade)}
          icon={ClipboardList}
        />
        <StatCard
          label={t.missingWork}
          value={summary.studentsToFollowUp.length}
          hint={t.missingWorkHint}
          icon={FileWarning}
        />
        <StatCard
          label={t.retakes}
          value={openRetakes.length}
          hint={t.needScheduling(retakesToSchedule.length)}
          icon={RefreshCw}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title={t.needsAttention} description={t.needsAttentionText}>
            {notes.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-success" /> {t.allCaughtUp}
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <AttentionCard
                    key={note.kind}
                    {...noteStyle[note.kind]}
                    cta={t.cta[note.kind]}
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

          <Panel title={t.upcomingExams} action={<Link className="text-xs font-medium text-primary" to="/app/exams">{t.viewAll}</Link>}>
            {upcoming.length === 0 ? (
              <EmptyState icon={BookOpen} title={t.noUpcoming} description={t.noUpcomingText} />
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
                            {formatDate(e.date)} · {e.time} · {e.room} · {t.students(total)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/app/exams/$examId" params={{ examId: e.id }}>{t.openExam}</Link>
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={total ? (done / total) * 100 : 0} />
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t.completed(done, total)}
                          {absent ? ` · ${t.absent(absent)}` : ""}
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
          <Panel title={t.today} description={formatLongDate(new Date(), language, true)}>
            {todayEvents.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">{t.nothingToday}</p>}
            <ol className="space-y-1">
              {todayEvents.map((ev) => (
                <li key={ev.id} className="flex gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent">
                  <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{ev.time}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{ev.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {[ev.room, ev.students ? t.students(ev.students) : null].filter(Boolean).join(" · ") || t.noRoom}
                    </span>
                  </span>
                  {ev.kind === "retake" && <StatusPill tone="primary">{t.retake}</StatusPill>}
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title={t.retakeQueue} action={<CalendarClock className="size-4 text-muted-foreground" />}>
            {openRetakes.length === 0 && <p className="text-sm text-muted-foreground">{t.noRetakes}</p>}
            <ul className="space-y-2 text-sm">
              {openRetakes.map((r) => {
                const exam = exams.find((e) => e.id === r.examId);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{exam?.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.status === "scheduled" ? `${formatDate(r.date!)} · ${r.time} · ${r.room}` : t.notScheduled}
                      </span>
                    </span>
                    <StatusPill tone={r.status === "scheduled" ? "success" : "warning"}>
                      {r.status === "scheduled" ? t.scheduled : t.needsScheduling}
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
