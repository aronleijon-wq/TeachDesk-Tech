import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/primitives";
import { classes, students } from "@/lib/demo-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gradebook")({
  head: () => ({
    meta: [
      { title: "Gradebook — Classflow" },
      { name: "description", content: "Every result for every student and exam in one grid." },
      { property: "og:title", content: "Gradebook — Classflow" },
      { property: "og:description", content: "Every result for every student and exam." },
    ],
  }),
  component: Gradebook,
});

function Gradebook() {
  const { exams } = useStore();
  const [classId, setClassId] = useState(classes[0]!.id);
  const classExams = exams.filter((e) => e.classId === classId && e.versions.length > 0);
  const classStudents = students.filter((s) => s.classId === classId);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Gradebook"
        subtitle="Results per student and exam."
        actions={
          <Button variant="outline" onClick={() => toast.success("Export started", { description: "CSV will download when ready." })}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1">
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => setClassId(c.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              classId === c.id ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
              {classExams.map((e) => (
                <th key={e.id} className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {e.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {classStudents.map((s) => (
              <tr key={s.id} className="hover:bg-accent/50">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                {classExams.map((e) => {
                  const rec = e.attendance.find((a) => a.studentId === s.id);
                  return (
                    <td key={e.id} className="px-4 py-2 text-right tabular-nums">
                      {rec?.status === "absent" ? (
                        <span className="text-destructive">Absent</span>
                      ) : rec?.score != null ? (
                        `${rec.score}/${e.totalPoints}`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
