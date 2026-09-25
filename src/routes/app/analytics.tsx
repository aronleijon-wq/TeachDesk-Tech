import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, StatCard } from "@/components/primitives";
import { classes, students } from "@/lib/demo-data";
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
  const { exams, assignments } = useStore();
  const classAverage = Math.round(students.reduce((s, x) => s + x.average, 0) / students.length);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Analytics" subtitle="Performance, mastery and workload across your classes." />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Class average" value={`${classAverage}%`} hint="All classes" />
        <StatCard label="Exams this term" value={exams.length} />
        <StatCard label="Assignments" value={assignments.length} />
        <StatCard label="Classes" value={classes.length} />
      </div>

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

      <Panel className="mt-4" title="Students needing follow-up">
        <ul className="divide-y divide-border text-sm">
          {students
            .filter((s) => s.missingWork > 0)
            .slice(0, 8)
            .map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {s.missingWork} missing · {s.average}% average
                </span>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}
