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
import { defineMessages, useMessages } from "@/lib/i18n";
import { FREE_CLASS_LIMIT } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const messages = defineMessages({
  en: {
    pageTitle: "Students — TeachDesk",
    title: "Students",
    subtitle: "Your classes, and each student's progress, missing work and follow-ups.",
    percent: (n: number) => `${n}%`,
    classLimit: `The free plan includes ${FREE_CLASS_LIMIT} classes`,
    classLimitText: "Upgrade to Pro for unlimited classes.",
    seePlans: "See plans",
    addStudents: "Add students",
    deleteClass: "Delete class",
    deleteClassTitle: (name: string) => `Delete ${name}?`,
    deleteClassText:
      "The class, its students and their exams, results and retakes are removed. This can't be undone.",
    deleted: (name: string) => `${name} deleted`,
    newClass: "New class",
    firstClass: "Add your first class",
    firstClassText:
      "Create a class and paste in your student list. You can copy it straight from SchoolSoft or a spreadsheet.",
    search: "Search students",
    allClasses: "All classes",
    noMatch: "No students match your search",
    noStudents: "No students in this class yet",
    tryAnother: "Try another name.",
    pasteList: "Paste your student list to add everyone at once.",
    columns: {
      student: "Student",
      class: "Class",
      average: "Average",
      attendance: "Attendance",
      followUp: "Follow-up",
      remove: "Remove",
    },
    removeLabel: (name: string) => `Remove ${name}`,
    removeTitle: (name: string) => `Remove ${name}?`,
    removeText: "Their exam results and retakes are removed too. This can't be undone.",
    removeConfirm: "Remove student",
    removed: (name: string) => `${name} removed`,
  },
  sv: {
    pageTitle: "Elever — TeachDesk",
    title: "Elever",
    subtitle: "Dina klasser och varje elevs utveckling, saknade uppgifter och uppföljning.",
    percent: (n) => `${n.toLocaleString("sv-SE")} %`,
    classLimit: `Gratisplanen har plats för ${FREE_CLASS_LIMIT} klasser`,
    classLimitText: "Uppgradera till Pro för obegränsat antal klasser.",
    seePlans: "Se abonnemang",
    addStudents: "Lägg till elever",
    deleteClass: "Ta bort klassen",
    deleteClassTitle: (name) => `Ta bort ${name}?`,
    deleteClassText:
      "Klassen, dess elever och deras prov, resultat och omprov tas bort. Det går inte att ångra.",
    deleted: (name) => `${name} har tagits bort`,
    newClass: "Ny klass",
    firstClass: "Lägg till din första klass",
    firstClassText:
      "Skapa en klass och klistra in elevlistan. Du kan kopiera den direkt från SchoolSoft eller ett kalkylark.",
    search: "Sök elever",
    allClasses: "Alla klasser",
    noMatch: "Inga elever matchar sökningen",
    noStudents: "Inga elever i klassen än",
    tryAnother: "Prova ett annat namn.",
    pasteList: "Klistra in elevlistan för att lägga till alla på en gång.",
    columns: {
      student: "Elev",
      class: "Klass",
      average: "Snitt",
      attendance: "Närvaro",
      followUp: "Uppföljning",
      remove: "Ta bort",
    },
    removeLabel: (name) => `Ta bort ${name}`,
    removeTitle: (name) => `Ta bort ${name}?`,
    removeText: "Elevens provresultat och omprov tas också bort. Det går inte att ångra.",
    removeConfirm: "Ta bort eleven",
    removed: (name) => `${name} har tagits bort`,
  },
});

export const Route = createFileRoute("/app/students/")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
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
  const t = useMessages(messages);
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

  const percent = (n: number | undefined) => (n == null ? "—" : t.percent(n));

  // The free plan includes a few classes of your own; the demo has no limit.
  const startNewClass = () => {
    if (demoMode || profile.access.level === "pro" || classes.length < FREE_CLASS_LIMIT)
      return setDialog("new");
    toast.info(t.classLimit, {
      description: t.classLimitText,
      action: { label: t.seePlans, onClick: () => void navigate({ to: "/app/pricing" }) },
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            {selectedClass && (
              <>
                <Button variant="outline" onClick={() => setDialog({ addTo: selectedClass.id })}>
                  <UserPlus className="size-4" /> {t.addStudents}
                </Button>
                <ConfirmButton
                  label={
                    <>
                      <Trash2 className="size-4" /> {t.deleteClass}
                    </>
                  }
                  title={t.deleteClassTitle(selectedClass.name)}
                  description={t.deleteClassText}
                  confirm={t.deleteClass}
                  onConfirm={() => {
                    removeClass(selectedClass.id);
                    setClassFilter("all");
                    toast.success(t.deleted(selectedClass.name));
                  }}
                />
              </>
            )}
            <Button onClick={startNewClass}>
              <Plus className="size-4" /> {t.newClass}
            </Button>
          </>
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t.firstClass}
          description={t.firstClassText}
          action={
            <Button onClick={startNewClass}>
              <Plus className="size-4" /> {t.newClass}
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
                placeholder={t.search}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {[{ id: "all", name: t.allClasses }, ...classes].map((c) => (
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
              title={query ? t.noMatch : t.noStudents}
              description={query ? t.tryAnother : t.pasteList}
              action={
                !query && selectedClass ? (
                  <Button onClick={() => setDialog({ addTo: selectedClass.id })}>
                    <UserPlus className="size-4" /> {t.addStudents}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr className="text-left">
                    <Th>{t.columns.student}</Th>
                    <Th>{t.columns.class}</Th>
                    <Th className="text-right">{t.columns.average}</Th>
                    <Th className="text-right">{t.columns.attendance}</Th>
                    <Th className="text-right">{t.columns.followUp}</Th>
                    <Th className="w-10">
                      <span className="sr-only">{t.columns.remove}</span>
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
                            ariaLabel={t.removeLabel(s.name)}
                            title={t.removeTitle(s.name)}
                            description={t.removeText}
                            confirm={t.removeConfirm}
                            onConfirm={() => {
                              removeStudent(s.id);
                              toast.success(t.removed(s.name));
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
