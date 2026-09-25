import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, ProgressBar, StatusPill, formatDate } from "@/components/primitives";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile — TeachDesk" },
      { name: "description", content: "Results, attendance, missing work and retake history for one student." },
      { property: "og:title", content: "Student profile — TeachDesk" },
      { property: "og:description", content: "Results, attendance and follow-up in one view." },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { studentId } = Route.useParams();
  const { exams, retakes, assignments, classById, studentById, studentStats } = useStore();
  const student = studentById(studentId);
  if (!student) throw notFound();
  const stats = studentStats(student);
  const percent = (n: number | undefined) => (n == null ? "—" : `${n}%`);

  const klass = classById(student.classId);
  const studentExams = exams.filter((e) => e.attendance.some((a) => a.studentId === student.id));
  const studentRetakes = retakes.filter((r) => r.studentId === student.id);

  return (
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
        <Link to="/app/students"><ArrowLeft className="size-4" /> Students</Link>
      </Button>

      <PageHeader title={student.name} subtitle={[klass?.name, student.email].filter(Boolean).join(" · ")} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Panel><p className="label-xs">Average</p><p className="stat-number mt-1">{percent(stats.average)}</p></Panel>
        <Panel><p className="label-xs">Attendance</p><p className="stat-number mt-1">{percent(stats.attendanceRate)}</p></Panel>
        <Panel><p className="label-xs">Missing work</p><p className="stat-number mt-1">{stats.missingWork}</p></Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Exam results">
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
                      <StatusPill tone="danger">Absent</StatusPill>
                    ) : record.score != null ? (
                      <span className="tabular-nums text-muted-foreground">{record.score}/{e.totalPoints}</span>
                    ) : (
                      <StatusPill>Pending</StatusPill>
                    )}
                  </div>
                  <div className="mt-1.5"><ProgressBar value={pct} /></div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Retakes & follow-up">
          {studentRetakes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No retakes for this student.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {studentRetakes.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span>{exams.find((e) => e.id === r.examId)?.title}</span>
                  <StatusPill tone={r.status === "scheduled" ? "success" : "warning"}>
                    {r.status === "scheduled" ? `${formatDate(r.date!)} ${r.time}` : "Needs scheduling"}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}

          <p className="label-xs mt-5">Assignments in {klass?.name}</p>
          <ul className="mt-2 space-y-2 text-sm">
            {assignments
              .filter((a) => a.classId === student.classId)
              .map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span>{a.title}</span>
                  <span className="text-xs text-muted-foreground">Due {formatDate(a.due)}</span>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
