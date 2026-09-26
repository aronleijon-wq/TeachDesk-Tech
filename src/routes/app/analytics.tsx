import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FollowUp } from "@/components/follow-up";
import { PageHeader, Panel, StatCard } from "@/components/primitives";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — TeachDesk" },
      { name: "description", content: "Class performance, topic mastery and workload trends." },
      { property: "og:title", content: "Analytics — TeachDesk" },
      { property: "og:description", content: "Class performance and topic mastery." },
    ],
  }),
  component: Analytics,
});

const topicData = [
  { topic: "Derivatives", mastery: 82 },
  { topic: "Chain rule", mastery: 71 },
  { topic: "Product rule", mastery: 65 },
  { topic: "Extrema", mastery: 58 },
  { topic: "Optimisation", mastery: 49 },
];

const trend = [
  { month: "Aug", average: 68 },
  { month: "Sep", average: 71 },
  { month: "Oct", average: 70 },
  { month: "Nov", average: 75 },
];

function Analytics() {
  const { exams, assignments, classes, students, studentStats, demoMode } = useStore();
  const averages = students.map((s) => studentStats(s).average).filter((a): a is number => a != null);
  const classAverage = averages.length ? `${Math.round(averages.reduce((sum, a) => sum + a, 0) / averages.length)}%` : "—";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Analytics" subtitle="Performance, mastery and workload across your classes." />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Class average" value={classAverage} hint="All classes" />
        <StatCard label="Exams this term" value={exams.length} />
        <StatCard label="Assignments" value={assignments.length} />
        <StatCard label="Classes" value={classes.length} />
      </div>

      {/* The trend charts are illustrative and only shown with demo data. */}
      {demoMode ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title="Topic mastery" description="Mathematics 3C">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="topic" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Bar dataKey="mastery" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Average over time" description="All classes">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis domain={[50, 90]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="average" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      ) : (
        <Panel className="mt-6">
          <p className="text-sm text-muted-foreground">
            Topic mastery and trends will appear here once your exams have results.
          </p>
        </Panel>
      )}

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
