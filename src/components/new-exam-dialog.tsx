import { BookCopy, Check, Loader2, PenLine, Sparkles, Upload, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DropZone, ExamDraftPreview, Field, ProNote } from "@/components/exam-draft";
import { StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { extractExamQuestions, type ExamDraft } from "@/lib/exam-ai.functions";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { readPickedFile, type PickedFile } from "@/lib/picked-file";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Where the new exam's questions come from. */
type Source = "write" | "upload" | "reuse";

const SOURCES: { id: Source; icon: LucideIcon; pro?: true }[] = [
  { id: "write", icon: PenLine },
  { id: "upload", icon: Upload, pro: true },
  { id: "reuse", icon: BookCopy },
];

const messages = defineMessages({
  en: {
    sources: {
      write: {
        title: "Write the questions yourself",
        description: "Add them on the exam's Questions tab after creating it.",
      },
      upload: {
        title: "Import an existing exam",
        description:
          "Upload a PDF or photo, or paste the text. AI turns it into the same questions.",
      },
      reuse: {
        title: "Reuse an earlier exam",
        description: "Start from the questions of an exam you've made before.",
      },
    } satisfies Record<Source, { title: string; description: string }>,
    steps: ["Basics", "Questions", "Review"],
    unreadable: "Couldn't read that file.",
    noQuestionsFound: "No questions were found in that content.",
    importFailed: "Couldn't read the exam. Please try again.",
    untitled: "Untitled exam",
    created: "Exam created",
    createdWithQuestions: (n: number) => `${n} questions in Version A.`,
    createdEmpty: "Add its questions on the exam's Questions tab.",
    title: "New exam",
    description: "Three short steps. You can change everything later.",
    examTitle: "Exam title",
    examTitlePlaceholder: "Derivatives — Exam 2",
    subject: "Subject",
    class: "Class",
    noClasses: "No classes yet",
    addClassFirst: "Add your class on the Students page first.",
    date: "Date",
    startTime: "Start time",
    duration: "Duration (minutes)",
    room: "Room",
    totalPoints: "Total points",
    generateTitle: "Generate a new exam with AI",
    generateText: "Describe it, or base it on an earlier exam or other material.",
    pasteText: "Paste the exam text",
    pastePlaceholder: "1. Differentiate f(x) = 3x² + 5x − 2. (3 p)\n2. ...",
    dropPrompt: "…or drop a file here",
    dropHint: "PDF, photo or text file · max 10 MB · Word: save as PDF first",
    importing: "Importing your exam…",
    importAgain: "Import again",
    importQuestions: "Import the questions",
    noReusable: "None of your exams have questions yet. Choose another way to start.",
    startFrom: "Exam to start from",
    chooseExam: "Choose an exam",
    rows: {
      title: "Title",
      class: "Class",
      date: "Date",
      duration: "Duration",
      questions: "Questions",
    },
    minutes: (n: string) => `${n} min`,
    questionCount: (n: number, points: string) => `${n} (${points} points)`,
    noneYet: "None yet — add them after creating the exam",
    objectives: "Learning objectives (one per line)",
    objectivesPlaceholder: "Apply the chain rule\nAnalyse functions with derivatives",
    cancel: "Cancel",
    back: "Back",
    continue: "Continue",
    create: "Create exam",
  },
  sv: {
    sources: {
      write: {
        title: "Skriv frågorna själv",
        description: "Lägg till dem under provets flik Frågor när provet har skapats.",
      },
      upload: {
        title: "Importera ett befintligt prov",
        description:
          "Ladda upp en PDF eller ett foto, eller klistra in texten. AI gör om det till samma frågor.",
      },
      reuse: {
        title: "Återanvänd ett tidigare prov",
        description: "Utgå från frågorna i ett prov du har gjort tidigare.",
      },
    },
    steps: ["Grunduppgifter", "Frågor", "Granska"],
    unreadable: "Det gick inte att läsa filen.",
    noQuestionsFound: "Inga frågor hittades i innehållet.",
    importFailed: "Det gick inte att läsa provet. Försök igen.",
    untitled: "Namnlöst prov",
    created: "Provet har skapats",
    createdWithQuestions: (n) => `${n} frågor i Version A.`,
    createdEmpty: "Lägg till frågorna under provets flik Frågor.",
    title: "Nytt prov",
    description: "Tre korta steg. Du kan ändra allt senare.",
    examTitle: "Provets namn",
    examTitlePlaceholder: "Derivator — prov 2",
    subject: "Ämne",
    class: "Klass",
    noClasses: "Inga klasser än",
    addClassFirst: "Lägg först till din klass på sidan Elever.",
    date: "Datum",
    startTime: "Starttid",
    duration: "Skrivtid (minuter)",
    room: "Sal",
    totalPoints: "Totalpoäng",
    generateTitle: "Skapa ett nytt prov med AI",
    generateText: "Beskriv det, eller utgå från ett tidigare prov eller annat material.",
    pasteText: "Klistra in provets text",
    pastePlaceholder: "1. Derivera f(x) = 3x² + 5x − 2. (3 p)\n2. ...",
    dropPrompt: "…eller släpp en fil här",
    dropHint: "PDF, foto eller textfil · max 10 MB · Word: spara som PDF först",
    importing: "Importerar ditt prov…",
    importAgain: "Importera igen",
    importQuestions: "Importera frågorna",
    noReusable: "Inget av dina prov har frågor än. Välj ett annat sätt att börja.",
    startFrom: "Prov att utgå från",
    chooseExam: "Välj ett prov",
    rows: {
      title: "Namn",
      class: "Klass",
      date: "Datum",
      duration: "Skrivtid",
      questions: "Frågor",
    },
    minutes: (n) => `${n} min`,
    questionCount: (n, points) => `${n} (${points} poäng)`,
    noneYet: "Inga än — lägg till dem när provet har skapats",
    objectives: "Lärandemål (ett per rad)",
    objectivesPlaceholder: "Använda kedjeregeln\nAnalysera funktioner med derivata",
    cancel: "Avbryt",
    back: "Tillbaka",
    continue: "Fortsätt",
    create: "Skapa provet",
  },
});

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Creates an exam step by step: the teacher writes the questions, reads in an existing exam
 * or reuses an earlier one. Mount it while open, so each new exam starts from an empty form.
 */
export function NewExamDialog({
  open,
  onOpenChange,
  onGenerateWithAi,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Switches to generating the exam with AI instead. */
  onGenerateWithAi: () => void;
  onCreated: (id: string) => void;
}) {
  const { classes, exams, profile, createExam } = useStore();
  const { language } = useLanguage();
  const t = useMessages(messages);
  const hasPro = profile.access.level === "pro";
  const firstClass = classes[0];

  const [step, setStep] = useState(0);
  const [source, setSource] = useState<Source>("write");
  const [form, setForm] = useState({
    title: "",
    subject: firstClass?.subject ?? "",
    classId: firstClass?.id ?? "",
    date: "",
    time: "08:30",
    duration: "90",
    room: firstClass?.room ?? "",
    points: "40",
    objectives: "",
  });
  // The questions to start from: read from an existing exam, or reused.
  const [draft, setDraft] = useState<ExamDraft | null>(null);
  const [reading, setReading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<Extract<PickedFile, { kind: "binary" }> | null>(null);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Pick a class once one exists (e.g. created after this dialog was opened).
  useEffect(() => {
    if (!form.classId && firstClass) {
      setForm((f) => ({
        ...f,
        classId: firstClass.id,
        subject: f.subject || firstClass.subject,
        room: f.room || firstClass.room,
      }));
    }
  }, [form.classId, firstClass]);

  const chooseSource = (next: Source) => {
    setSource(next);
    setDraft(null);
    setDraftError(null);
  };

  const startFrom = (next: ExamDraft) => {
    setDraft(next);
    setForm((f) => ({
      ...f,
      points: String(next.questions.reduce((sum, q) => sum + q.points, 0)),
      objectives: f.objectives.trim() ? f.objectives : next.objectives.join("\n"),
    }));
  };

  const pickFile = async (picked: File | undefined) => {
    setDraftError(null);
    setDraft(null);
    if (!picked) return;
    try {
      const read = await readPickedFile(picked, language);
      // Text goes into the paste box, so the teacher can see and tidy it.
      if (read.kind === "text") {
        setPastedText(read.text);
        setFile(null);
      } else {
        setFile(read);
      }
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : t.unreadable);
    }
  };

  const readExistingExam = async () => {
    setReading(true);
    setDraftError(null);
    try {
      const result = await extractExamQuestions({
        data: {
          subject: form.subject,
          examTitle: form.title,
          ...(pastedText.trim() && { text: pastedText }),
          ...(file && { file: { mediaType: file.mediaType, data: file.data } }),
        },
      });
      if (result.questions.length === 0) {
        setDraftError(result.warnings.join(" ") || t.noQuestionsFound);
      } else {
        startFrom(result);
      }
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : t.importFailed);
    } finally {
      setReading(false);
    }
  };

  const reusable = exams.filter((e) => e.versions[0]?.questions.length);
  const reuse = (examId: string) => {
    const earlier = exams.find((e) => e.id === examId);
    startFrom({
      questions: earlier?.versions[0]?.questions ?? [],
      objectives: earlier?.objectives ?? [],
      warnings: [],
    });
  };

  // Each step can continue once it has what it needs.
  const ready = [Boolean(form.classId && form.date), source === "write" || Boolean(draft)];
  const needsPro = source === "upload" && !hasPro;

  const create = () => {
    const questions = draft?.questions ?? [];
    const id = createExam(
      {
        title: form.title.trim() || t.untitled,
        subject: form.subject,
        classId: form.classId,
        date: form.date,
        time: form.time,
        durationMin: Number(form.duration) || 90,
        room: form.room,
        totalPoints: Number(form.points) || 0,
        objectives: lines(form.objectives),
      },
      questions,
    );
    toast.success(t.created, {
      description: questions.length ? t.createdWithQuestions(questions.length) : t.createdEmpty,
    });
    onOpenChange(false);
    onCreated(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <ol className="flex flex-wrap items-center gap-2 text-xs">
          {t.steps.map((name, i) => (
            <li key={name} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  i < step
                    ? "bg-success text-success-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={cn(i === step ? "font-medium" : "text-muted-foreground")}>
                {name}
              </span>
              {i < t.steps.length - 1 && <span className="text-border">—</span>}
            </li>
          ))}
        </ol>

        <div className="mt-2 space-y-4">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.examTitle} className="sm:col-span-2">
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder={t.examTitlePlaceholder}
                />
              </Field>
              <Field label={t.subject}>
                <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
              </Field>
              <Field label={t.class}>
                <Select
                  value={form.classId}
                  onValueChange={(id) => {
                    const klass = classes.find((c) => c.id === id);
                    setForm((f) => ({
                      ...f,
                      classId: id,
                      subject: klass?.subject || f.subject,
                      room: klass?.room || f.room,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.noClasses} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {classes.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t.addClassFirst}</p>
                )}
              </Field>
              <Field label={t.date}>
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label={t.startTime}>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </Field>
              <Field label={t.duration}>
                <Input
                  type="number"
                  min={10}
                  value={form.duration}
                  onChange={(e) => set("duration", e.target.value)}
                />
              </Field>
              <Field label={t.room}>
                <Input value={form.room} onChange={(e) => set("room", e.target.value)} />
              </Field>
              <Field label={t.totalPoints}>
                <Input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => set("points", e.target.value)}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {SOURCES.map((option) => (
                  <SourceOption
                    key={option.id}
                    {...option}
                    {...t.sources[option.id]}
                    active={source === option.id}
                    onSelect={() => chooseSource(option.id)}
                  />
                ))}
                <SourceOption
                  icon={Sparkles}
                  title={t.generateTitle}
                  description={t.generateText}
                  pro
                  active={false}
                  onSelect={onGenerateWithAi}
                />
              </div>

              {needsPro && <ProNote />}

              {source === "upload" && !needsPro && (
                <div className="space-y-3">
                  <Field label={t.pasteText}>
                    <Textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => {
                        setPastedText(e.target.value);
                        setDraft(null);
                      }}
                      placeholder={t.pastePlaceholder}
                    />
                  </Field>
                  <DropZone
                    fileName={file?.name}
                    prompt={t.dropPrompt}
                    hint={t.dropHint}
                    onFiles={([picked]) => void pickFile(picked)}
                  />
                  <Button
                    onClick={() => void readExistingExam()}
                    disabled={reading || (!pastedText.trim() && !file)}
                    className="w-full"
                  >
                    {reading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    {reading ? t.importing : draft ? t.importAgain : t.importQuestions}
                  </Button>
                </div>
              )}

              {source === "reuse" &&
                (reusable.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noReusable}</p>
                ) : (
                  <Field label={t.startFrom}>
                    <Select onValueChange={reuse}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.chooseExam} />
                      </SelectTrigger>
                      <SelectContent>
                        {reusable.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ))}

              {draftError && <p className="text-sm text-destructive">{draftError}</p>}
              {draft && <ExamDraftPreview questions={draft.questions} warnings={draft.warnings} />}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <dl className="grid gap-3 rounded-md border border-border p-4 text-sm sm:grid-cols-2">
                <Row label={t.rows.title} value={form.title.trim() || t.untitled} />
                <Row
                  label={t.rows.class}
                  value={classes.find((c) => c.id === form.classId)?.name ?? ""}
                />
                <Row label={t.rows.date} value={`${form.date} ${form.time}`} />
                <Row
                  label={t.rows.duration}
                  value={[t.minutes(form.duration), form.room].filter(Boolean).join(" · ")}
                />
                <Row
                  label={t.rows.questions}
                  value={draft ? t.questionCount(draft.questions.length, form.points) : t.noneYet}
                />
              </dl>
              <Field label={t.objectives}>
                <Textarea
                  rows={4}
                  value={form.objectives}
                  onChange={(e) => set("objectives", e.target.value)}
                  placeholder={t.objectivesPlaceholder}
                />
              </Field>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 flex-row justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}
          >
            {step === 0 ? t.cancel : t.back}
          </Button>
          {step < t.steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!ready[step] || reading}>
              {t.continue}
            </Button>
          ) : (
            <Button onClick={create}>{t.create}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SourceOption({
  icon: Icon,
  title,
  description,
  pro,
  active,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  pro?: true;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-md border p-3 text-left transition-colors",
        active ? "border-primary bg-primary-soft" : "border-border hover:bg-accent",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
        {pro && <StatusPill tone="primary">Pro</StatusPill>}
      </span>
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-xs">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
