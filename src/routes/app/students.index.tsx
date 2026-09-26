import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClassDialog, type ClassDialogTarget } from "@/components/class-dialog";
import { ConfirmButton } from "@/components/confirm-button";
import { FollowUp } from "@/components/follow-up";
import { EmptyState, PageHeader } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FREE_CLASS_LIMIT } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/students/")({
  head: () => ({
    meta: [
      { title: "Students — TeachDesk" },
      {
        name: "description",
        content: "Track every student's progress, missing work, attendance and follow-ups.",
      },
      { property: "og:title", content: "Students — TeachDesk" },
      { property: "og:description", content: "Track progress, missing work and follow-ups." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const {
    classes,
    students,
    classById,
    studentStats,
    removeClass,
    removeStudent,
    demoMode,
    profile,
  } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [dialog, setDialog] = useState<ClassDialogTarget | null>(null);

  // A deleted class can leave the filter pointing at nothing; fall back to all classes.
  const selectedClass = classFilter === "all" ? undefined : classById(classFilter);
  const activeFilter = selectedClass ? selectedClass.id : "all";

  const visible = useMemo(
    () =>
      students.filter(
        (s) =>
          (activeFilter === "all" || s.classId === activeFilter) &&
          s.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [students, query, activeFilter],
  );

  const percent = (n: number | undefined) => (n == null ? "—" : `${n}%`);

  // The free plan includes a few classes of your own; the demo has no limit.
  const startNewClass = () => {
    if (demoMode || profile.access.level === "pro" || classes.length < FREE_CLASS_LIMIT)
      return setDialog("new");
    toast.info(`The free plan includes ${FREE_CLASS_LIMIT} classes`, {
      description: "Upgrade to Pro for unlimited classes.",
      action: { label: "See plans", onClick: () => void navigate({ to: "/app/pricing" }) },
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Students"
        subtitle="Your classes, and each student's progress, missing work and follow-ups."
        actions={
          <>
            {selectedClass && (
              <>
                <Button variant="outline" onClick={() => setDialog({ addTo: selectedClass.id })}>
                  <UserPlus className="size-4" /> Add students
                </Button>
                <ConfirmButton
                  label={
                    <>
                      <Trash2 className="size-4" /> Delete class
                    </>
                  }
                  title={`Delete ${selectedClass.name}?`}
                  description="The class, its students and their exams, results and retakes are removed. This can't be undone."
                  confirm="Delete class"
                  onConfirm={() => {
                    removeClass(selectedClass.id);
                    setClassFilter("all");
                    toast.success(`${selectedClass.name} deleted`);
                  }}
                />
              </>
            )}
            <Button onClick={startNewClass}>
              <Plus className="size-4" /> New class
            </Button>
          </>
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Add your first class"
          description="Create a class and paste in your student list. You can copy it straight from SchoolSoft or a spreadsheet."
          action={
            <Button onClick={startNewClass}>
              <Plus className="size-4" /> New class
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {[{ id: "all", name: "All classes" }, ...classes].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClassFilter(c.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activeFilter === c.id
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title={query ? "No students match your search" : "No students in this class yet"}
              description={
                query ? "Try another name." : "Paste your student list to add everyone at once."
              }
              action={
                !query && selectedClass ? (
                  <Button onClick={() => setDialog({ addTo: selectedClass.id })}>
                    <UserPlus className="size-4" /> Add students
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr className="text-left">
                    <Th>Student</Th>
                    <Th>Class</Th>
                    <Th className="text-right">Average</Th>
                    <Th className="text-right">Attendance</Th>
                    <Th className="text-right">Follow-up</Th>
                    <Th className="w-10">
                      <span className="sr-only">Remove</span>
                    </Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((s) => {
                    const stats = studentStats(s);
                    return (
                      <tr key={s.id} className="transition-colors hover:bg-accent/50">
                        <td className="px-4 py-2.5">
                          <Link
                            to="/app/students/$studentId"
                            params={{ studentId: s.id }}
                            className="font-medium hover:text-primary"
                          >
                            {s.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {classById(s.classId)?.name}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {percent(stats.average)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {percent(stats.attendanceRate)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <FollowUp stats={stats} />
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <ConfirmButton
                            variant="ghost"
                            label={<Trash2 className="size-4" />}
                            ariaLabel={`Remove ${s.name}`}
                            title={`Remove ${s.name}?`}
                            description="Their exam results and retakes are removed too. This can't be undone."
                            confirm="Remove student"
                            onConfirm={() => {
                              removeStudent(s.id);
                              toast.success(`${s.name} removed`);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ClassDialog
        target={dialog}
        onClose={() => setDialog(null)}
        onCreated={(id) => setClassFilter(id)}
      />
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}
