import { useEffect, useState } from "react";
import {
  BarChart3, BookOpen, CalendarDays, Check, ClipboardList, FileText, LayoutDashboard, Search, Send, Sparkles, Table2, Users,
} from "lucide-react";
import { StatusPill, ProgressBar } from "@/components/primitives";
import { LogoMark } from "@/components/brand";
import { cn } from "@/lib/utils";
import { useInView } from "./site-chrome";

function Chrome({ children, url = "teachdesk.com/app" }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex h-9 items-center gap-2 border-b border-border bg-muted/60 px-3">
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-border" />
          <i className="size-2.5 rounded-full bg-border" />
          <i className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="mx-auto rounded-md border border-border bg-background px-3 py-0.5 text-[11px] text-muted-foreground">{url}</span>
      </div>
      {children}
    </div>
  );
}

const SIDEBAR = [
  [LayoutDashboard, "Dashboard"], [BookOpen, "Exams"], [ClipboardList, "Assignments"], [Users, "Students"],
  [CalendarDays, "Calendar"], [Table2, "Gradebook"], [BarChart3, "Analytics"], [Sparkles, "AI Tools"],
] as const;

/** Hero: a faithful, animated rendition of the TeachDesk dashboard. */
export function HeroProduct() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => (v + 1) % 3), 3200);
    return () => clearInterval(t);
  }, []);
  const graded = [18, 22, 26][tick] ?? 18;

  return (
    <Chrome>
      <div className="flex min-h-[420px] text-left">
        <aside className="hidden w-48 shrink-0 border-r border-border bg-sidebar p-3 md:block">
          <div className="mb-4 flex items-center gap-2 px-2 text-sm font-semibold">
            <LogoMark className="size-5" />
            TeachDesk
          </div>
          {SIDEBAR.map(([Icon, label], i) => (
            <div key={label} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-xs", i === 0 ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground")}>
              <Icon className="size-3.5" /> {label}
            </div>
          ))}
        </aside>
        <div className="min-w-0 flex-1">
          <div className="flex h-11 items-center border-b border-border px-4 text-xs font-semibold">
            Dashboard
            <span className="ml-auto hidden items-center gap-2 rounded-md border border-input px-2 py-1 font-normal text-muted-foreground sm:flex">
              <Search className="size-3" /> Search
            </span>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <p className="text-sm font-semibold">Good morning, Anna</p>
              <p className="text-xs text-muted-foreground">4 things need your attention today.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                ["Needs grading", `${30 - graded}`, "Derivatives test"],
                ["Missed exams", "5", "Retakes to schedule"],
                ["Upcoming", "3", "Next 7 days"],
                ["Late work", "7", "Lab report 2"],
              ].map(([l, v, s], i) => (
                <div key={l} className="td-in rounded-lg border border-border bg-card p-3" style={{ animationDelay: `${i * 90}ms` }}>
                  <p className="label-xs">{l}</p>
                  <p key={v} className="td-in mt-1 text-xl font-semibold tabular-nums">{v}</p>
                  <p className="text-[11px] text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center border-b border-border px-3 py-2 text-xs font-semibold">
                  Upcoming exams <span className="ml-auto font-medium text-primary">View all</span>
                </div>
                {[
                  ["Derivatives test", "Mathematics 3C", "needs-grading"],
                  ["Kinematics", "Physics 2", "upcoming"],
                  ["Democracy essay", "Social Studies 3", "upcoming"],
                ].map(([t, c, st]) => (
                  <div key={t} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 transition-colors hover:bg-muted/50">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{t}</p>
                      <p className="text-[11px] text-muted-foreground">{c}</p>
                    </div>
                    <span className="ml-auto">
                      <StatusPill tone={st === "upcoming" ? "primary" : "warning"}>{st === "upcoming" ? "Upcoming" : "Grading"}</StatusPill>
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-semibold">Grading progress</p>
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>Derivatives test</span>
                    <span className="tabular-nums">{graded}/30</span>
                  </div>
                  <ProgressBar value={(graded / 30) * 100} />
                </div>
                <div key={tick} className="td-in rounded-md border border-primary/20 bg-primary-soft p-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    <Sparkles className="size-3" /> Suggested
                  </p>
                  <p className="mt-1 text-[11px] leading-snug">
                    {[
                      "Generate Version B for 5 students who missed the exam.",
                      "3 students scored below 40% on chain rule. Plan follow-up?",
                      "Lab report 2 is overdue for 7 students. Send a reminder?",
                    ][tick]}
                  </p>
                  <p className="mt-2 text-[10px] text-muted-foreground">Nothing changes until you approve.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Chrome>
  );
}

const STEPS = [
  { title: "Original exam", body: "Derivatives test · Version A · 8 questions · 40 pts" },
  { title: "TeachDesk analyzes it", body: "Topics, difficulty, points and question types mapped" },
  { title: "Equivalent Version B", body: "New numbers, contexts and wording. Same structure." },
  { title: "Teacher reviews", body: "Edit any question. Nothing is used until approved." },
  { title: "Student is informed", body: "Retake time, room and version sent to the student" },
];

/** Animated equivalent-retake workflow. */
export function RetakeFlow() {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2200);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
      <ol className="relative space-y-1">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              onClick={() => setStep(i)}
              className={cn(
                "flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                i === step ? "bg-surface shadow-[var(--shadow-card)] ring-1 ring-border" : "hover:bg-muted/60",
              )}
            >
              <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium tabular-nums transition-colors",
                i < step ? "border-success bg-success text-success-foreground" : i === step ? "border-primary text-primary" : "border-border text-muted-foreground")}>
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span>
                <span className={cn("block text-sm font-medium", i !== step && "text-muted-foreground")}>{s.title}</span>
                <span className="block text-xs text-muted-foreground">{s.body}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <Chrome url="teachdesk.com/app/exams/derivatives">
        <div className="grid min-h-[380px] gap-px bg-border sm:grid-cols-2">
          <ExamPane label="Version A" tone="neutral" active={step >= 0} q={["Differentiate f(x) = 3x² + 5x − 2", "A car's position is s(t) = 4t³. Find v(2).", "Find the slope of y = x³ at x = 1."]} />
          <div className="relative bg-surface p-4">
            {step === 0 && <p className="grid h-full place-items-center text-xs text-muted-foreground">Version B not created</p>}
            {step === 1 && (
              <div key="an" className="td-in space-y-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Analyzing structure</p>
                {[["Topics", "Power rule, rates, tangents"], ["Difficulty", "2 easy · 4 medium · 2 hard"], ["Points", "40 total, preserved"], ["Question types", "Calculation, applied"]].map(([k, v], i) => (
                  <div key={k} className="td-in flex justify-between rounded-md border border-border px-2.5 py-2 text-[11px]" style={{ animationDelay: `${i * 150}ms` }}>
                    <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}
            {step >= 2 && (
              <ExamPaneInner
                label="Version B"
                pill={step >= 3 ? (step >= 4 ? "Approved" : "In review") : "Draft"}
                tone={step >= 4 ? "success" : step >= 3 ? "warning" : "primary"}
                q={["Differentiate g(x) = 4x² − 7x + 1", "A cyclist's position is s(t) = 2t³. Find v(3).", "Find the slope of y = x³ at x = 2."]}
              />
            )}
            {step === 4 && (
              <div className="td-in absolute inset-x-4 bottom-4 rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-panel)]">
                <p className="flex items-center gap-1.5 text-xs font-semibold"><Send className="size-3.5 text-primary" /> Sent to Elsa Lindqvist</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Retake · Thu 14:00 · Room B204 · Version B</p>
              </div>
            )}
          </div>
        </div>
      </Chrome>
    </div>
  );
}

function ExamPane(props: { label: string; tone: "neutral"; active: boolean; q: string[] }) {
  return (
    <div className="bg-surface p-4">
      <ExamPaneInner label={props.label} pill="Original" tone="neutral" q={props.q} />
    </div>
  );
}

function ExamPaneInner({ label, pill, tone, q }: { label: string; pill: string; tone: "neutral" | "primary" | "warning" | "success"; q: string[] }) {
  return (
    <div className="td-in space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">{label}</p>
        <StatusPill tone={tone}>{pill}</StatusPill>
      </div>
      {q.map((t, i) => (
        <div key={t} className="rounded-md border border-border p-2.5">
          <p className="text-[10px] text-muted-foreground">Question {i + 1} · 5 pts</p>
          <p className="mt-0.5 text-xs">{t}</p>
        </div>
      ))}
    </div>
  );
}
