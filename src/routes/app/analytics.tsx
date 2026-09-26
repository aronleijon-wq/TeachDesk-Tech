import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FollowUp } from "@/components/follow-up";
import { PageHeader, Panel, StatCard } from "@/components/primitives";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — TeachDesk" },
      { name: "description", content: "Exam results and follow-up across your classes." },
      { property: "og:title", content: "Analytics — TeachDesk" },
      { property: "og:description", content: "Exam results and follow-up across your classes." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { exams, assignments, classes, students, studentStats, classById } = useStore();
  const averages = students.map((s) => studentStats(s).average).filter((a): a is number => a != null);
  const classAverage = averages.length ? `${Math.round(averages.reduce((sum, a) => sum + a, 0) / averages.length)}%` : "—";
  const heldExams = exams.filter((e) => e.status !== "draft");

  // The average result of each exam, from the scores entered so far, oldest exam first.
  const examAverages = heldExams
    .flatMap((e) => {
      const results = e.attendance.flatMap((a) => (a.score != null && e.totalPoints > 0 ? [a.score / e.totalPoints] : []));
      if (results.length === 0) return [];
      const average = Math.round((results.reduce((sum, r) => sum + r, 0) / results.length) * 100);
      return [{ exam: e.title, className: classById(e.classId)?.name ?? "", date: e.date, average }];
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Analytics" subtitle="Exam results and follow-up across your classes." />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Class average" value={classAverage} hint="All classes" />
        <StatCard label="Exams" value={heldExams.length} />
        <StatCard label="Assignments" value={assignments.length} />
        <StatCard label="Classes" value={classes.length} />
      </div>

      <Panel className="mt-6" title="Average result per exam" description="From the scores you've entered">
        {examAverages.length === 0 ? (
          <p className="text-sm text-muted-foreground">This chart fills in as you enter exam results.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={examAverages}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="exam" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Average"]}
                  labelFormatter={(exam, items) => `${exam} · ${items[0]?.payload?.className ?? ""}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                />
                <Bar dataKey="average" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel className="mt-4" title="Students needing follow-up">
        <ul className="divide-y divide-border text-sm">
          {students
            .map((s) => ({ student: s, stats: studentStats(s) }))
            .filter(({ stats }) => !stats.upToDate)
            .slice(0, 8)
            .map(({ student: s, stats }) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                <span className="font-medium">{s.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {stats.average != null ? `${stats.average}% average` : "no results yet"}
                  </span>
                  <FollowUp stats={stats} />
                </span>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}
