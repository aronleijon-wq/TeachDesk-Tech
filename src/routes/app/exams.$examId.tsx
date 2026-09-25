import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, ProgressBar, StatusPill, formatDate } from "@/components/primitives";
import { GenerateVersionDialog } from "@/components/generate-version-dialog";
import { classById, studentById, type Question } from "@/lib/demo-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/exams/$examId")({
  head: () => ({
    meta: [
      { title: "Exam — Classflow" },
      { name: "description", content: "Exam overview, questions, versions, attendance, retakes and grading." },
      { property: "og:title", content: "Exam — Classflow" },
      { property: "og:description", content: "Manage one exam end to end." },
    ],
  }),
  component: ExamDetail,
});

function ExamDetail() {
  const { examId } = Route.useParams();
  const { exams, retakes, setAttendance, setScore, scheduleRetake, updateQuestion } = useStore();
  const exam = exams.find((e) => e.id === examId);
  const [genOpen, setGenOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);

  if (!exam) throw notFound();

  const klass = classById(exam.classId);
  const completed = exam.attendance.filter((a) => a.status === "completed");
  const absent = exam.attendance.filter((a) => a.status === "absent");
  const examRetakes = retakes.filter((r) => r.examId === exam.id);
  const version = exam.versions[activeVersion];

  return (
    <div className="mx-auto max-w-6xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
        <Link to="/app/exams"><ArrowLeft className="size-4" /> Exams</Link>
      </Button>

      <PageHeader
        title={exam.title}
        subtitle={`${klass?.name} · ${formatDate(exam.date)} · ${exam.time} · ${exam.room} · ${exam.totalPoints} points`}
        actions={
          <Button onClick={() => setGenOpen(true)} disabled={exam.versions.length === 0}>
            <Sparkles className="size-4" /> Generate equivalent version
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Metric label="Students" value={exam.attendance.length} />
        <Metric label="Completed" value={completed.length} />
        <Metric label="Absent" value={absent.length} />
        <Metric label="Versions" value={exam.versions.length} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="retakes">Retakes</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Learning objectives">
            <ul className="space-y-2 text-sm">
              {exam.objectives.map((o) => (
                <li key={o} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 text-primary" /> {o}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Completion">
            <ProgressBar value={exam.attendance.length ? (completed.length / exam.attendance.length) * 100 : 0} />
            <p className="mt-2 text-sm text-muted-foreground">
              {completed.length} of {exam.attendance.length} students completed. {absent.length} absent,{" "}
              {examRetakes.filter((r) => r.status === "needs-scheduling").length} retakes still need scheduling.
            </p>
          </Panel>
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          {!version ? (
            <Panel><p className="text-sm text-muted-foreground">This exam has no version yet.</p></Panel>
          ) : (
            <div className="space-y-3">
              {version.questions.map((q) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  onSave={(updated) => {
                    updateQuestion(exam.id, version.id, updated);
                    toast.success("Question updated");
                  }}
                />
              ))}
            </div>
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
                  {v.origin === "ai-generated" ? "AI generated" : "Original"}
                </span>
              </button>
            ))}
          </div>

          {exam.versions.length >= 2 && (
            <Panel title="Version comparison" description="Same skills, different surface">
              <div className="grid gap-3 md:grid-cols-2">
                {[exam.versions[0]!, exam.versions[activeVersion === 0 ? 1 : activeVersion]!].map((v, idx) => (
                  <div key={`${v.id}-${idx}`} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{v.label}</p>
                      {v.equivalenceScore && <StatusPill tone="success">{v.equivalenceScore}% equivalent</StatusPill>}
                    </div>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {v.questions.slice(0, 4).map((q) => (
                        <li key={q.id}>
                          <span className="font-medium text-foreground">{q.number}.</span> {q.prompt}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {v.questions.length} questions · {v.questions.reduce((s, q) => s + q.points, 0)} points ·{" "}
                      {v.approved ? "Approved" : "Awaiting teacher approval"}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Panel title="Mark attendance" description="Absent students automatically enter the retake queue.">
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
                          onClick={() => {
                            setAttendance(exam.id, a.studentId, status);
                            toast.success(`${student?.name} marked ${status}`);
                          }}
                        >
                          {status === "completed" ? "Present" : status === "absent" ? "Absent" : "Pending"}
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
          <Panel title="Retakes" description="Students who missed this exam">
            {examRetakes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No retakes required.</p>
            ) : (
              <ul className="space-y-2">
                {examRetakes.map((r) => (
                  <RetakeRow
                    key={r.id}
                    name={studentById(r.studentId)?.name ?? ""}
                    status={r.status}
                    date={r.date}
                    time={r.time}
                    room={r.room}
                    versionLabel={exam.versions.find((v) => v.id === r.versionId)?.label}
                    onSchedule={(date, time, room) => {
                      const nextVersion = exam.versions[exam.versions.length - 1]?.id;
                      scheduleRetake(r.id, date, time, room, nextVersion);
                      toast.success("Retake scheduled", {
                        description: `${studentById(r.studentId)?.name} · ${date} ${time} · ${room}`,
                      });
                    }}
                  />
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="grading" className="mt-4">
          <Panel title="Grading" description="Objective questions are scored automatically. Open answers get a suggestion you confirm.">
            <ul className="divide-y divide-border">
              {exam.attendance.filter((a) => a.status === "completed").map((a) => (
                <li key={a.studentId} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm font-medium">{studentById(a.studentId)?.name}</span>
                  <span className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={a.score ?? 0}
                      className="h-8 w-20"
                      onBlur={(e) => setScore(exam.id, a.studentId, Number(e.target.value))}
                    />
                    <span className="text-xs text-muted-foreground">/ {exam.totalPoints}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              No grade is ever finalised without your confirmation.
            </p>
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

function QuestionEditor({ question, onSave }: { question: Question; onSave: (q: Question) => void }) {
  const [draft, setDraft] = useState(question);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="label-xs">Question {question.number} · {question.topic}</p>
          <p className="mt-1 text-sm">{question.prompt}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {question.points} points · {question.difficulty} · {question.skill} · {question.objective}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-4" /> : "Edit"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <Textarea
            className="sm:col-span-2"
            rows={2}
            value={draft.prompt}
            onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
          />
          <Input value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} placeholder="Topic" />
          <Input value={draft.skill} onChange={(e) => setDraft({ ...draft, skill: e.target.value })} placeholder="Skill" />
          <Input
            type="number"
            value={draft.points}
            onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
            placeholder="Points"
          />
          <Input value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Question["difficulty"] })} placeholder="Difficulty" />
          <Textarea
            className="sm:col-span-2"
            rows={2}
            value={draft.expectedAnswer}
            onChange={(e) => setDraft({ ...draft, expectedAnswer: e.target.value })}
            placeholder="Expected answer"
          />
          <Textarea
            className="sm:col-span-2"
            rows={2}
            value={draft.gradingCriteria}
            onChange={(e) => setDraft({ ...draft, gradingCriteria: e.target.value })}
            placeholder="Grading criteria"
          />
          <div className="sm:col-span-2">
            <Button size="sm" onClick={() => { onSave(draft); setOpen(false); }}>Save question</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RetakeRow({
  name,
  status,
  date,
  time,
  room,
  versionLabel,
  onSchedule,
}: {
  name: string;
  status: string;
  date?: string | undefined;
  time?: string | undefined;
  room?: string | undefined;
  versionLabel?: string | undefined;
  onSchedule: (date: string, time: string, room: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ date: date ?? "2026-11-24", time: time ?? "14:30", room: room ?? "B210" });

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {status === "scheduled"
              ? `${formatDate(date!)} · ${time} · ${room}${versionLabel ? ` · ${versionLabel}` : ""}`
              : "Absent — needs scheduling"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={status === "scheduled" ? "success" : "warning"}>
            {status === "scheduled" ? "Scheduled" : "Needs scheduling"}
          </StatusPill>
          <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
            {status === "scheduled" ? "Reschedule" : "Schedule retake"}
          </Button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-40" />
          <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-32" />
          <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="w-28" placeholder="Room" />
          <Button size="sm" onClick={() => { onSchedule(form.date, form.time, form.room); setEditing(false); }}>
            Confirm
          </Button>
        </div>
      )}
    </li>
  );
}
