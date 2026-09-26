import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, ProgressBar, StatusPill } from "@/components/primitives";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const messages = defineMessages({
  en: {
    pageTitle: "Student profile — TeachDesk",
    back: "Students",
    percent: (n: number) => `${n}%`,
    average: "Average",
    attendance: "Attendance",
    missingWork: "Missing work",
    results: "Exam results",
    absent: "Absent",
    pending: "Pending",
    retakes: "Retakes & follow-up",
    noRetakes: "No retakes for this student.",
    needsScheduling: "Needs scheduling",
    assignmentsIn: (className: string) => `Assignments in ${className}`,
    due: (date: string) => `Due ${date}`,
  },
  sv: {
    pageTitle: "Elevprofil — TeachDesk",
    back: "Elever",
    percent: (n) => `${n.toLocaleString("sv-SE")} %`,
    average: "Snitt",
    attendance: "Närvaro",
    missingWork: "Saknade uppgifter",
    results: "Provresultat",
    absent: "Frånvarande",
    pending: "Väntar",
    retakes: "Omprov och uppföljning",
    noRetakes: "Eleven har inga omprov.",
    needsScheduling: "Behöver bokas",
    assignmentsIn: (className) => `Uppgifter i ${className}`,
    due: (date) => `Senast ${date}`,
  },
});

export const Route = createFileRoute("/app/students/$studentId")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: StudentProfile,
});

function StudentProfile() {
  const { studentId } = Route.useParams();
  const { exams, retakes, assignments, classById, studentById, studentStats } = useStore();
  const { formatDate } = useLanguage();
  const t = useMessages(messages);
  const student = studentById(studentId);
  if (!student) throw notFound();
  const stats = studentStats(student);
  const percent = (n: number | undefined) => (n == null ? "—" : t.percent(n));

  const klass = classById(student.classId);
  const studentExams = exams.filter((e) => e.attendance.some((a) => a.studentId === student.id));
  const studentRetakes = retakes.filter((r) => r.studentId === student.id);

  return (
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
        <Link to="/app/students"><ArrowLeft className="size-4" /> {t.back}</Link>
      </Button>

      <PageHeader title={student.name} subtitle={[klass?.name, student.email].filter(Boolean).join(" · ")} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Panel><p className="label-xs">{t.average}</p><p className="stat-number mt-1">{percent(stats.average)}</p></Panel>
        <Panel><p className="label-xs">{t.attendance}</p><p className="stat-number mt-1">{percent(stats.attendanceRate)}</p></Panel>
        <Panel><p className="label-xs">{t.missingWork}</p><p className="stat-number mt-1">{stats.missingWork}</p></Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.results}>
          <ul className="space-y-3">
            {studentExams.map((e) => {
              const record = e.attendance.find((a) => a.studentId === student.id)!;
              const pct = record.score ? (record.score / e.totalPoints) * 100 : 0;
              return (
                <li key={e.id}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <Link to="/app/exams/$examId" params={{ examId: e.id }} className="font-medium hover:text-primary">
                      {e.title}
                    </Link>
                    {record.status === "absent" ? (
                      <StatusPill tone="danger">{t.absent}</StatusPill>
                    ) : record.score != null ? (
                      <span className="tabular-nums text-muted-foreground">{record.score}/{e.totalPoints}</span>
                    ) : (
                      <StatusPill>{t.pending}</StatusPill>
                    )}
                  </div>
                  <div className="mt-1.5"><ProgressBar value={pct} /></div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title={t.retakes}>
          {studentRetakes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noRetakes}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {studentRetakes.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span>{exams.find((e) => e.id === r.examId)?.title}</span>
                  <StatusPill tone={r.status === "scheduled" ? "success" : "warning"}>
                    {r.status === "scheduled" ? `${formatDate(r.date!)} ${r.time}` : t.needsScheduling}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}

          <p className="label-xs mt-5">{t.assignmentsIn(klass?.name ?? "")}</p>
          <ul className="mt-2 space-y-2 text-sm">
            {assignments
              .filter((a) => a.classId === student.classId)
              .map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span>{a.title}</span>
                  <span className="text-xs text-muted-foreground">{t.due(formatDate(a.due))}</span>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
