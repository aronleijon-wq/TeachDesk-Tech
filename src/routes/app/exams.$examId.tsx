import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Printer, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, ProgressBar, StatusPill } from "@/components/primitives";
import { ConfirmButton } from "@/components/confirm-button";
import { GenerateVersionDialog } from "@/components/generate-version-dialog";
import { GradeWithAi } from "@/components/grade-with-ai";
import { AddQuestion, QuestionCard } from "@/components/question-editor";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { newId } from "@/lib/workspace";

const messages = defineMessages({
  en: {
    pageTitle: "Exam — TeachDesk",
    back: "Exams",
    points: (n: number) => `${n} points`,
    deleteExam: "Delete exam",
    deleteTitle: (title: string) => `Delete ${title}?`,
    deleteText: "Its questions, versions, results and retakes are deleted too. This can't be undone.",
    deleted: (title: string) => `${title} deleted`,
    print: "Print",
    generateVersion: "Generate equivalent version",
    metrics: { students: "Students", completed: "Completed", absent: "Absent", versions: "Versions" },
    tabs: {
      overview: "Overview",
      questions: "Questions",
      versions: "Versions",
      attendance: "Attendance",
      retakes: "Retakes",
      grading: "Grading",
    },
    objectives: "Learning objectives",
    completion: "Completion",
    completionText: (done: number, total: number, absent: number, toSchedule: number) =>
      `${done} of ${total} students completed. ${absent} absent, ${toSchedule} ${toSchedule === 1 ? "retake still needs" : "retakes still need"} scheduling.`,
    noQuestions:
      "No questions yet. Add the exam's questions here; then you can also generate an equivalent version for retakes.",
    questionUpdated: "Question updated",
    questionAdded: "Question added",
    otherVersion: (label: string) =>
      `You're looking at ${label}. To add or remove questions, choose Version A on the Versions tab.`,
    aiGenerated: "AI generated",
    original: "Original",
    comparison: "Version comparison",
    comparisonText: "Same skills, different surface",
    equivalent: (n: number) => `${n}% equivalent`,
    versionSummary: (questions: number, points: number) => `${questions} questions · ${points} points`,
    approved: "Approved",
    awaitingApproval: "Awaiting teacher approval",
    versionApproved: (label: string) => `${label} approved`,
    versionApprovedText: "It can now be used for retakes.",
    approve: "Approve",
    attendanceTitle: "Mark attendance",
    attendanceText:
      "Tap the students who were absent, then mark the rest present. Absent students go straight into the retake queue.",
    everyonePresent: "Mark everyone present",
    restPresent: (n: number) => `Mark the other ${n} present`,
    statuses: { completed: "Present", absent: "Absent", pending: "Pending" },
    retakesTitle: "Retakes",
    retakesText: "Students who missed this exam",
    noRetakes: "No retakes required.",
    bookAllTitle: (n: number) => `Book one slot for all ${n} students who need a retake`,
    bookAll: (n: number) => `Book for ${n} students`,
    retakesBooked: (n: number) => `${n} retakes booked`,
    retakeScheduled: "Retake scheduled",
    scores: "Scores",
    scoresText:
      "Enter each student's score, or approve AI's suggestions above. Students appear here once they're marked present.",
    aiAssisted: "AI-assisted",
    scoreFor: (name: string) => `Score for ${name}`,
    student: "student",
    neverFinal: "No grade is ever finalised without your confirmation.",
    absentNeedsScheduling: "Absent — needs scheduling",
    scheduled: "Scheduled",
    needsScheduling: "Needs scheduling",
    reschedule: "Reschedule",
    scheduleRetake: "Schedule retake",
    confirm: "Confirm",
    date: "Date",
    time: "Time",
    room: "Room",
  },
  sv: {
    pageTitle: "Prov — TeachDesk",
    back: "Prov",
    points: (n) => `${n} poäng`,
    deleteExam: "Ta bort provet",
    deleteTitle: (title) => `Ta bort ${title}?`,
    deleteText: "Frågor, versioner, resultat och omprov tas också bort. Det går inte att ångra.",
    deleted: (title) => `${title} har tagits bort`,
    print: "Skriv ut",
    generateVersion: "Skapa likvärdig version",
    metrics: { students: "Elever", completed: "Klara", absent: "Frånvarande", versions: "Versioner" },
    tabs: {
      overview: "Översikt",
      questions: "Frågor",
      versions: "Versioner",
      attendance: "Närvaro",
      retakes: "Omprov",
      grading: "Rättning",
    },
    objectives: "Lärandemål",
    completion: "Genomförande",
    completionText: (done, total, absent, toSchedule) =>
      `${done} av ${total} elever har skrivit provet. ${absent} frånvarande, ${toSchedule} omprov behöver fortfarande bokas.`,
    noQuestions:
      "Inga frågor än. Lägg till provets frågor här, så kan du också skapa en likvärdig version för omprov.",
    questionUpdated: "Frågan har uppdaterats",
    questionAdded: "Frågan har lagts till",
    otherVersion: (label) =>
      `Du tittar på ${label}. Välj Version A under fliken Versioner för att lägga till eller ta bort frågor.`,
    aiGenerated: "Skapad med AI",
    original: "Original",
    comparison: "Jämför versioner",
    comparisonText: "Samma förmågor, nya uppgifter",
    equivalent: (n) => `${n} % likvärdig`,
    versionSummary: (questions, points) => `${questions} frågor · ${points} poäng`,
    approved: "Godkänd",
    awaitingApproval: "Väntar på lärarens godkännande",
    versionApproved: (label) => `${label} är godkänd`,
    versionApprovedText: "Den kan nu användas till omprov.",
    approve: "Godkänn",
    attendanceTitle: "Markera närvaro",
    attendanceText:
      "Markera eleverna som var frånvarande och markera sedan resten som närvarande. Frånvarande elever hamnar direkt i omprovskön.",
    everyonePresent: "Markera alla som närvarande",
    restPresent: (n) => `Markera de övriga ${n} som närvarande`,
    statuses: { completed: "Närvarande", absent: "Frånvarande", pending: "Ej markerad" },
    retakesTitle: "Omprov",
    retakesText: "Elever som missade provet",
    noRetakes: "Inga omprov behövs.",
    bookAllTitle: (n) => `Boka samma tid för alla ${n} elever som behöver omprov`,
    bookAll: (n) => `Boka för ${n} elever`,
    retakesBooked: (n) => `${n} omprov bokade`,
    retakeScheduled: "Omprovet är bokat",
    scores: "Resultat",
    scoresText:
      "Fyll i varje elevs resultat eller godkänn AI:s förslag ovan. Eleverna visas här när de är markerade som närvarande.",
    aiAssisted: "Med AI-stöd",
    scoreFor: (name) => `Resultat för ${name}`,
    student: "eleven",
    neverFinal: "Inget resultat blir slutgiltigt utan att du bekräftar det.",
    absentNeedsScheduling: "Frånvarande — behöver bokas",
    scheduled: "Bokat",
    needsScheduling: "Behöver bokas",
    reschedule: "Boka om",
    scheduleRetake: "Boka omprov",
    confirm: "Bekräfta",
    date: "Datum",
    time: "Tid",
    room: "Sal",
  },
});

export const Route = createFileRoute("/app/exams/$examId")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: ExamDetail,
});

function ExamDetail() {
  const { examId } = Route.useParams();
  const {
    exams,
    retakes,
    setAttendance,
    markRestPresent,
    setScore,
    scheduleRetake,
    scheduleRetakes,
    addQuestion,
    removeQuestion,
    removeExam,
    updateQuestion,
    approveVersion,
    classById,
    studentById,
  } = useStore();
  const exam = exams.find((e) => e.id === examId);
  const { formatDate } = useLanguage();
  const t = useMessages(messages);
  const navigate = useNavigate();
  const [genOpen, setGenOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);

  if (!exam) throw notFound();

  const klass = classById(exam.classId);
  const completed = exam.attendance.filter((a) => a.status === "completed");
  const absent = exam.attendance.filter((a) => a.status === "absent");
  const examRetakes = retakes.filter((r) => r.examId === exam.id);
  const toSchedule = examRetakes.filter((r) => r.status === "needs-scheduling");
  const notMarked = exam.attendance.filter((a) => a.status === "pending").length;
  // Retakes use the newest version: an equivalent one, once it exists.
  const retakeVersionId = exam.versions[exam.versions.length - 1]?.id;
  const version = exam.versions[activeVersion];
  // Questions are written and removed on the original version; generated ones are only edited.
  const onOriginal = activeVersion === 0;

  return (
    <div className="mx-auto max-w-6xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
        <Link to="/app/exams"><ArrowLeft className="size-4" /> {t.back}</Link>
      </Button>

      <PageHeader
        title={exam.title}
        subtitle={`${klass?.name} · ${formatDate(exam.date)} · ${exam.time} · ${exam.room} · ${t.points(exam.totalPoints)}`}
        actions={
          <>
            <ConfirmButton
              label={
                <>
                  <Trash2 className="size-4" /> {t.deleteExam}
                </>
              }
              title={t.deleteTitle(exam.title)}
              description={t.deleteText}
              confirm={t.deleteExam}
              onConfirm={() => {
                // Leave the page first, so it never shows an exam that's gone.
                void navigate({ to: "/app/exams" }).then(() => {
                  removeExam(exam.id);
                  toast.success(t.deleted(exam.title));
                });
              }}
            />
            {version?.questions.length ? (
              <Button variant="outline" asChild>
                <Link to="/app/print/$examId" params={{ examId: exam.id }} search={{ version: version.id }}>
                  <Printer className="size-4" /> {t.print}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Printer className="size-4" /> {t.print}
              </Button>
            )}
            <Button onClick={() => setGenOpen(true)} disabled={!exam.versions[0]?.questions.length}>
              <Sparkles className="size-4" /> {t.generateVersion}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Metric label={t.metrics.students} value={exam.attendance.length} />
        <Metric label={t.metrics.completed} value={completed.length} />
        <Metric label={t.metrics.absent} value={absent.length} />
        <Metric label={t.metrics.versions} value={exam.versions.length} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t.tabs.overview}</TabsTrigger>
          <TabsTrigger value="questions">{t.tabs.questions}</TabsTrigger>
          <TabsTrigger value="versions">{t.tabs.versions}</TabsTrigger>
          <TabsTrigger value="attendance">{t.tabs.attendance}</TabsTrigger>
          <TabsTrigger value="retakes">{t.tabs.retakes}</TabsTrigger>
          <TabsTrigger value="grading">{t.tabs.grading}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title={t.objectives}>
            <ul className="space-y-2 text-sm">
              {exam.objectives.map((o) => (
                <li key={o} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 text-primary" /> {o}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={t.completion}>
            <ProgressBar value={exam.attendance.length ? (completed.length / exam.attendance.length) * 100 : 0} />
            <p className="mt-2 text-sm text-muted-foreground">
              {t.completionText(completed.length, exam.attendance.length, absent.length, toSchedule.length)}
            </p>
          </Panel>
        </TabsContent>

        <TabsContent value="questions" className="mt-4 space-y-3">
          {!version?.questions.length && (
            <Panel>
              <p className="text-sm text-muted-foreground">{t.noQuestions}</p>
            </Panel>
          )}
          {version?.questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onSave={(updated) => {
                updateQuestion(exam.id, version.id, updated);
                toast.success(t.questionUpdated);
              }}
              {...(onOriginal ? { onRemove: () => removeQuestion(exam.id, q.id) } : {})}
            />
          ))}
          {onOriginal ? (
            <AddQuestion
              onAdd={(draft) => {
                addQuestion(exam.id, { ...draft, id: newId("question"), number: 0 });
                toast.success(t.questionAdded);
              }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              {t.otherVersion(version?.label ?? "")}
            </p>
          )}
        </TabsContent>

        <TabsContent value="versions" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {exam.versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setActiveVersion(i)}
                className={`rounded-md border px-3 py-2 text-left text-sm ${i === activeVersion ? "border-primary bg-primary-soft" : "border-border hover:bg-accent"}`}
              >
                <span className="font-medium">{v.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {v.origin === "ai-generated" ? t.aiGenerated : t.original}
                </span>
              </button>
            ))}
          </div>

          {exam.versions.length >= 2 && (
            <Panel title={t.comparison} description={t.comparisonText}>
              <div className="grid gap-3 md:grid-cols-2">
                {[exam.versions[0]!, exam.versions[activeVersion === 0 ? 1 : activeVersion]!].map((v, idx) => (
                  <div key={`${v.id}-${idx}`} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{v.label}</p>
                      {v.equivalenceScore && <StatusPill tone="success">{t.equivalent(v.equivalenceScore)}</StatusPill>}
                    </div>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {v.questions.slice(0, 4).map((q) => (
                        <li key={q.id}>
                          <span className="font-medium text-foreground">{q.number}.</span> {q.prompt}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {t.versionSummary(v.questions.length, v.questions.reduce((s, q) => s + q.points, 0))} ·{" "}
                        {v.approved ? t.approved : t.awaitingApproval}
                      </p>
                      {!v.approved && (
                        <Button
                          size="sm"
                          onClick={() => {
                            approveVersion(exam.id, v.id);
                            toast.success(t.versionApproved(v.label), { description: t.versionApprovedText });
                          }}
                        >
                          <Check className="size-4" /> {t.approve}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Panel
            title={t.attendanceTitle}
            description={t.attendanceText}
            action={
              notMarked > 0 && (
                <Button size="sm" variant="outline" onClick={() => markRestPresent(exam.id)}>
                  <Check className="size-4" />
                  {notMarked === exam.attendance.length ? t.everyonePresent : t.restPresent(notMarked)}
                </Button>
              )
            }
          >
            <ul className="divide-y divide-border">
              {exam.attendance.map((a) => {
                const student = studentById(a.studentId);
                return (
                  <li key={a.studentId} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm font-medium">{student?.name}</span>
                    <span className="flex items-center gap-1">
                      {(["completed", "absent", "pending"] as const).map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={a.status === status ? "default" : "outline"}
                          onClick={() => setAttendance(exam.id, a.studentId, status)}
                        >
                          {t.statuses[status]}
                        </Button>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="retakes" className="mt-4">
          <Panel title={t.retakesTitle} description={t.retakesText}>
            {examRetakes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noRetakes}</p>
            ) : (
              <>
                {toSchedule.length > 1 && (
                  <SlotForm
                    title={t.bookAllTitle(toSchedule.length)}
                    defaultRoom={exam.room}
                    submitLabel={t.bookAll(toSchedule.length)}
                    onBook={(slot) => {
                      scheduleRetakes(
                        toSchedule.map((r) => r.id),
                        { ...slot, versionId: retakeVersionId },
                      );
                      toast.success(t.retakesBooked(toSchedule.length), {
                        description: `${formatDate(slot.date)} · ${slot.time} · ${slot.room}`,
                      });
                    }}
                  />
                )}
                <ul className="space-y-2">
                  {examRetakes.map((r) => (
                    <RetakeRow
                      key={r.id}
                      name={studentById(r.studentId)?.name ?? ""}
                      status={r.status}
                      date={r.date}
                      time={r.time}
                      room={r.room}
                      defaultRoom={exam.room}
                      versionLabel={exam.versions.find((v) => v.id === r.versionId)?.label}
                      onSchedule={(slot) => {
                        scheduleRetake(r.id, { ...slot, versionId: retakeVersionId });
                        toast.success(t.retakeScheduled, {
                          description: `${studentById(r.studentId)?.name} · ${formatDate(slot.date)} ${slot.time} · ${slot.room}`,
                        });
                      }}
                    />
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="grading" className="mt-4 space-y-4">
          <GradeWithAi exam={exam} />
          <Panel title={t.scores} description={t.scoresText}>
            <ul className="divide-y divide-border">
              {exam.attendance.filter((a) => a.status === "completed").map((a) => (
                <li key={a.studentId} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {studentById(a.studentId)?.name}
                    {a.aiGrading?.approved && <StatusPill tone="primary">{t.aiAssisted}</StatusPill>}
                  </span>
                  <span className="flex items-center gap-2">
                    <Input
                      // A new score (e.g. an approved AI grading) resets the box.
                      key={a.score ?? "none"}
                      type="number"
                      min={0}
                      max={exam.totalPoints}
                      defaultValue={a.score ?? ""}
                      placeholder="—"
                      aria-label={t.scoreFor(studentById(a.studentId)?.name ?? t.student)}
                      className="h-8 w-20"
                      onBlur={(e) => {
                        // An empty box means not graded yet; only real scores are saved.
                        const score = e.target.valueAsNumber;
                        if (Number.isFinite(score) && score !== a.score) setScore(exam.id, a.studentId, score);
                      }}
                    />
                    <span className="text-xs text-muted-foreground">/ {exam.totalPoints}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{t.neverFinal}</p>
          </Panel>
        </TabsContent>
      </Tabs>

      <GenerateVersionDialog exam={exam} open={genOpen} onOpenChange={setGenOpen} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <p className="label-xs">{label}</p>
      <p className="stat-number mt-1">{value}</p>
    </div>
  );
}

/** A retake time and place. */
interface Slot {
  date: string;
  time: string;
  room: string;
}

function RetakeRow({
  name,
  status,
  date,
  time,
  room,
  defaultRoom,
  versionLabel,
  onSchedule,
}: {
  name: string;
  status: string;
  date?: string | undefined;
  time?: string | undefined;
  room?: string | undefined;
  defaultRoom: string;
  versionLabel?: string | undefined;
  onSchedule: (slot: Slot) => void;
}) {
  const [editing, setEditing] = useState(false);
  const { formatDate } = useLanguage();
  const t = useMessages(messages);
  const scheduled = status === "scheduled" && date;

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {scheduled
              ? `${formatDate(date)} · ${time} · ${room}${versionLabel ? ` · ${versionLabel}` : ""}`
              : t.absentNeedsScheduling}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={scheduled ? "success" : "warning"}>
            {scheduled ? t.scheduled : t.needsScheduling}
          </StatusPill>
          <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
            {scheduled ? t.reschedule : t.scheduleRetake}
          </Button>
        </div>
      </div>

      {editing && (
        <SlotForm
          initial={{ date: date ?? "", time: time ?? "14:30", room: room ?? defaultRoom }}
          defaultRoom={defaultRoom}
          submitLabel={t.confirm}
          onBook={(slot) => {
            onSchedule(slot);
            setEditing(false);
          }}
        />
      )}
    </li>
  );
}

/** Date, time and room for a retake; books once a date is chosen. */
function SlotForm({
  title,
  initial,
  defaultRoom,
  submitLabel,
  onBook,
}: {
  title?: string;
  initial?: Slot;
  defaultRoom: string;
  submitLabel: string;
  onBook: (slot: Slot) => void;
}) {
  const [slot, setSlot] = useState<Slot>(initial ?? { date: "", time: "14:30", room: defaultRoom });
  const t = useMessages(messages);
  return (
    <div className={title ? "mb-3 rounded-md bg-muted/50 p-3" : "mt-3 border-t border-border pt-3"}>
      {title && <p className="mb-2 text-sm font-medium">{title}</p>}
      <div className="flex flex-wrap items-end gap-2">
        <Input
          type="date"
          aria-label={t.date}
          value={slot.date}
          onChange={(e) => setSlot({ ...slot, date: e.target.value })}
          className="w-40"
        />
        <Input
          type="time"
          aria-label={t.time}
          value={slot.time}
          onChange={(e) => setSlot({ ...slot, time: e.target.value })}
          className="w-32"
        />
        <Input
          aria-label={t.room}
          value={slot.room}
          onChange={(e) => setSlot({ ...slot, room: e.target.value })}
          className="w-28"
          placeholder={t.room}
        />
        <Button size="sm" disabled={!slot.date} onClick={() => onBook(slot)}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
