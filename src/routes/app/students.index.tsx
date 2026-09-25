import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusPill } from "@/components/primitives";
import { classById, classes, students } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/students/")({
  head: () => ({
    meta: [
      { title: "Students — Classflow" },
      { name: "description", content: "Track every student's progress, missing work, attendance and follow-ups." },
      { property: "og:title", content: "Students — Classflow" },
      { property: "og:description", content: "Track progress, missing work and follow-ups." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const visible = useMemo(
    () =>
      students.filter(
        (s) =>
          (classFilter === "all" || s.classId === classFilter) &&
          s.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, classFilter],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Students" subtitle="Progress, missing work and follow-ups across your classes." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ id: "all", name: "All classes" }, ...classes].map((c) => (
            <button
              key={c.id}
              onClick={() => setClassFilter(c.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                classFilter === c.id ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr className="text-left">
              <Th>Student</Th>
              <Th>Class</Th>
              <Th className="text-right">Average</Th>
              <Th className="text-right">Attendance</Th>
              <Th className="text-right">Missing work</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-accent/50">
                <td className="px-4 py-2.5">
                  <Link to="/app/students/$studentId" params={{ studentId: s.id }} className="font-medium hover:text-primary">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{classById(s.classId)?.name}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{s.average}%</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{s.attendanceRate}%</td>
                <td className="px-4 py-2.5 text-right">
                  {s.missingWork > 0 ? (
                    <StatusPill tone="warning">{s.missingWork} missing</StatusPill>
                  ) : (
                    <StatusPill tone="success">Up to date</StatusPill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", className)}>{children}</th>;
}
