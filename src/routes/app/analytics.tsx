import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FollowUp } from "@/components/follow-up";
import { PageHeader, Panel, StatCard } from "@/components/primitives";
import { defineMessages, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const messages = defineMessages({
  en: {
    pageTitle: "Analytics — TeachDesk",
    title: "Analytics",
    subtitle: "Exam results and follow-up across your classes.",
    percent: (n: number) => `${n}%`,
    percentUnit: "%",
    classAverage: "Class average",
    allClasses: "All classes",
    exams: "Exams",
    assignments: "Assignments",
    classes: "Classes",
    perExam: "Average result per exam",
    perExamText: "From the scores you've entered",
    fillsIn: "This chart fills in as you enter exam results.",
    average: "Average",
    followUp: "Students needing follow-up",
    studentAverage: (n: number) => `${n}% average`,
    noResults: "no results yet",
  },
  sv: {
    pageTitle: "Analys — TeachDesk",
    title: "Analys",
    subtitle: "Provresultat och uppföljning i alla dina klasser.",
    percent: (n) => `${n} %`,
    percentUnit: " %",
    classAverage: "Snitt",
    allClasses: "Alla klasser",
    exams: "Prov",
    assignments: "Uppgifter",
    classes: "Klasser",
    perExam: "Snittresultat per prov",
    perExamText: "Utifrån resultaten du har fyllt i",
    fillsIn: "Diagrammet fylls på när du fyller i provresultat.",
    average: "Snitt",
    followUp: "Elever att följa upp",
    studentAverage: (n) => `snitt ${n.toLocaleString("sv-SE")} %`,
    noResults: "inga resultat än",
  },
});

export const Route = createFileRoute("/app/analytics")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: Analytics,
});

function Analytics() {
  const { exams, assignments, classes, students, studentStats, classById } = useStore();
  const t = useMessages(messages);
  const averages = students.map((s) => studentStats(s).average).filter((a): a is number => a != null);
  const classAverage = averages.length ? t.percent(Math.round(averages.reduce((sum, a) => sum + a, 0) / averages.length)) : "—";
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
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label={t.classAverage} value={classAverage} hint={t.allClasses} />
        <StatCard label={t.exams} value={heldExams.length} />
        <StatCard label={t.assignments} value={assignments.length} />
        <StatCard label={t.classes} value={classes.length} />
      </div>

      <Panel className="mt-6" title={t.perExam} description={t.perExamText}>
        {examAverages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.fillsIn}</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={examAverages}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="exam" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} unit={t.percentUnit} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => [t.percent(Number(value)), t.average]}
                  labelFormatter={(exam, items) => `${exam} · ${items[0]?.payload?.className ?? ""}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                />
                <Bar dataKey="average" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel className="mt-4" title={t.followUp}>
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
                    {stats.average != null ? t.studentAverage(stats.average) : t.noResults}
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
