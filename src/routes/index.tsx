import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2, FileCheck2, Fingerprint, KeyRound, Layers, Lock, Repeat, ScrollText, ShieldCheck, Sparkles, UserCheck, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, SectionHeading, SiteFooter, SiteNav } from "@/components/marketing/site-chrome";
import { HeroProduct, RetakeFlow } from "@/components/marketing/product-visuals";
import { cn } from "@/lib/utils";

const title = "Teachdesk — The workspace for modern teachers";
const description = "Teachdesk brings exams, grading, retakes, assignments and teacher workflows into one intelligent workspace.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://teachdesk.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://teachdesk.lovable.app/" }],
  }),
  component: Home,
});

const primaryBtn = "bg-foreground text-background hover:bg-foreground/90";

function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <SiteNav />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Retake />
        <HowItWorks />
        <Integrations />
        <Teachers />
        <AI />
        <Schools />
        <Security />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section id="product" className="relative -mt-16 pt-16">
      <div className="bg-hero-glow pointer-events-none absolute inset-0" />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[640px] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-60" />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 text-center md:pt-28">
        <Reveal>
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> Exams, retakes, grading and follow-up in one place
          </p>
          <h1 className="display-xl mx-auto mt-6 max-w-4xl text-balance">Teaching shouldn't come with a second job.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground md:text-xl">
            Teachdesk brings the work behind teaching into one intelligent workspace — from exams and grading to retakes, assignments and follow-up.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className={primaryBtn}><Link to="/demo">Book a demo <ArrowRight className="size-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><a href="#retakes">See how it works</a></Button>
          </div>
        </Reveal>
        <Reveal delay={150} className="relative mx-auto mt-16 max-w-5xl md:mt-20 [perspective:2000px]">
          <div className="td-float [transform:rotateX(6deg)] md:[transform:rotateX(8deg)]">
            <HeroProduct />
          </div>
          <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-24 bg-gradient-to-t from-background to-transparent" />
        </Reveal>
      </div>
    </section>
  );
}

const FRAGMENTS = ["Exam", "School system", "Spreadsheet", "Calendar", "Email", "Retake", "Grading", "School system"];

function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <SectionHeading eyebrow="The problem" title="The work around teaching shouldn't take over teaching.">
        Exams, grading, retakes, assignments, scheduling and follow-up are spread across systems that don't talk to each other. Teachers end up copying the same information from one place to the next.
      </SectionHeading>
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <Reveal className="rounded-xl border border-border bg-surface p-6">
          <p className="label-xs">Today</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {FRAGMENTS.map((f, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className={cn("rounded-md border border-dashed border-border px-2.5 py-1.5 text-sm text-muted-foreground", i % 3 === 1 && "-rotate-1", i % 3 === 2 && "rotate-1")}>{f}</span>
                {i < FRAGMENTS.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground/60" />}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Eight hand-offs. Every one a chance to lose track of a student.</p>
        </Reveal>
        <Reveal delay={120} className="rounded-xl border border-primary/25 bg-primary-soft/60 p-6">
          <p className="label-xs !text-primary">With Teachdesk</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background">Teachdesk</span>
            <span className="text-sm text-muted-foreground">exam → attendance → grading → retake → results</span>
          </div>
          <p className="mt-6 text-lg font-medium">Teachdesk brings the workflow together.</p>
          <p className="mt-1 text-sm text-muted-foreground">One place to work. Connected to the systems your school already uses.</p>
        </Reveal>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: BookOpen, title: "Exams", body: "Create exams from scratch, from an upload or with AI assistance. Track attendance and submissions in one view." },
  { icon: Repeat, title: "Equivalent retakes", body: "Turn an existing exam into a genuinely equivalent version for students who need a retake." },
  { icon: FileCheck2, title: "Grading", body: "Rubrics, scores and AI-suggested feedback in the gradebook — with the teacher making every final call." },
  { icon: Users, title: "Student follow-up", body: "See which students missed exams, submitted late or need attention, without tracking it by hand." },
  { icon: CalendarDays, title: "Scheduling", body: "Exams, retakes and assignment deadlines on one calendar, across every class you teach." },
  { icon: Sparkles, title: "AI assistance", body: "AI drafts the repetitive parts. Nothing is applied until you review and approve it." },
];

function Features() {
  return (
    <section id="features" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <SectionHeading eyebrow="What Teachdesk does" title="One workspace for the work behind teaching." />
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60} className="group bg-surface p-7 transition-colors hover:bg-background">
              <f.icon className="size-5 text-primary transition-transform group-hover:-translate-y-0.5" />
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Retake() {
  return (
    <section id="retakes" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 md:py-32">
      <SectionHeading eyebrow="Equivalent retakes" title="A missed exam shouldn't mean more administration.">
        Teachdesk keeps topics, difficulty, points and question types — and changes numbers, contexts and wording. You review every question before a student sees it.
      </SectionHeading>
      <Reveal className="mt-14"><RetakeFlow /></Reveal>
    </section>
  );
}

const HOW = [
  ["01", "Connect", "Connect Teachdesk with the school's existing systems."],
  ["02", "Set up", "Classes, students and relevant information are available in Teachdesk."],
  ["03", "Work", "Teachers manage their workflows inside Teachdesk."],
  ["04", "Sync", "Relevant information can be synchronized back to connected systems."],
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <SectionHeading eyebrow="How it works" title="Four steps. Then it just works." />
        <div className="mt-14 grid gap-8 md:grid-cols-4">
          {HOW.map(([n, t, b], i) => (
            <Reveal key={n} delay={i * 100} className="relative border-t border-border pt-6">
              <span className="absolute -top-px left-0 h-px w-12 bg-primary" />
              <p className="font-mono text-sm text-primary">{n}</p>
              <h3 className="mt-3 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const SYSTEMS: { name: string; status: "Available" | "Coming soon" | "Planned" }[] = [
  { name: "SchoolSoft", status: "Planned" },
  { name: "Google Classroom", status: "Planned" },
  { name: "Microsoft Teams", status: "Planned" },
  { name: "Unikum", status: "Planned" },
  { name: "Vklass", status: "Planned" },
  { name: "Skolon", status: "Planned" },
];

function Integrations() {
  return (
    <section id="integrations" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow="Integrations" title="Keep the systems your school already uses.">
            Teachdesk is designed to work alongside your existing school systems — not force schools to replace them.
          </SectionHeading>
          <Reveal className="mt-10">
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {SYSTEMS.map((s) => (
                <li key={s.name} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium",
                    s.status === "Available" ? "bg-success/12 text-success" : s.status === "Coming soon" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")}>{s.status}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">No integrations are live yet. Statuses will be updated as each connection ships.</p>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <div className="relative rounded-xl border border-border bg-surface p-6 sm:p-8">
            <Tier label="Existing school systems" items={["SchoolSoft", "Classroom", "Teams", "Vklass"]} />
            <Flow />
            <div className="mx-auto w-fit rounded-lg bg-foreground px-6 py-3 text-center text-background shadow-[var(--shadow-panel)]">
              <p className="font-semibold">Teachdesk</p>
              <p className="text-[11px] opacity-70">Sync · permissions · data mapping</p>
            </div>
            <Flow />
            <Tier label="Teacher workspace" items={["Exams", "Retakes", "Grading", "Follow-up"]} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Tier({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="text-center">
      <p className="label-xs">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((i) => <span key={i} className="rounded-md border border-border bg-background px-2 py-2 text-xs">{i}</span>)}
      </div>
    </div>
  );
}

function Flow() {
  return (
    <svg viewBox="0 0 80 56" className="mx-auto my-2 h-14 w-20 text-primary" aria-hidden>
      <line x1="28" y1="2" x2="28" y2="54" stroke="currentColor" strokeWidth="1.5" className="td-dash" />
      <line x1="52" y1="54" x2="52" y2="2" stroke="currentColor" strokeWidth="1.5" className="td-dash opacity-50" />
    </svg>
  );
}

const TEACHER_POINTS = ["Less repetitive administration", "One workspace for every class", "Faster exam workflows", "Simpler retakes", "AI-assisted work you approve", "A clear overview of every student"];

function Teachers() {
  return (
    <section id="teachers" className="scroll-mt-16 border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 md:py-32 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <SectionHeading eyebrow="For teachers" title="Built around the teacher's workflow." />
          <Reveal className="mt-8">
            <ul className="grid gap-3 sm:grid-cols-2">
              {TEACHER_POINTS.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{p}</li>
              ))}
            </ul>
            <Button asChild size="lg" variant="outline" className="mt-10"><a href="#product">Explore Teachdesk <ArrowRight className="size-4" /></a></Button>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Derivatives test · Mathematics 3C</p>
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-foreground dark:text-warning">Needs grading</span>
              </div>
              {[
                ["Elsa Lindqvist", "Absent", "Retake scheduled"],
                ["Oskar Berg", "32 / 40", "Graded"],
                ["Maja Nilsson", "—", "Awaiting grading"],
                ["Liam Johansson", "Absent", "Needs scheduling"],
                ["Alva Karlsson", "36 / 40", "Graded"],
              ].map(([n, s, st]) => (
                <div key={n} className="grid grid-cols-[1.4fr_1fr_1.2fr] items-center border-b border-border px-4 py-3 text-sm last:border-0 transition-colors hover:bg-muted/50">
                  <span className="font-medium">{n}</span>
                  <span className="tabular-nums text-muted-foreground">{s}</span>
                  <span className={cn("justify-self-end text-xs", st === "Graded" ? "text-success" : st.startsWith("Needs") ? "text-destructive" : "text-muted-foreground")}>{st}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const AI_EXAMPLES = ["Generating equivalent exams", "Analyzing exam structure", "Grading suggestions", "Feedback suggestions", "Summarizing class results", "Identifying follow-up tasks"];

function AI() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <SectionHeading eyebrow="AI in Teachdesk" title="AI that handles the repetitive work.">
        Teachdesk uses AI to assist with repetitive tasks while teachers remain in control.
      </SectionHeading>
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <ul className="grid gap-2 sm:grid-cols-2">
            {AI_EXAMPLES.map((e) => (
              <li key={e} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">{e}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120} className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {[
            { icon: Sparkles, t: "AI suggestion", b: "Feedback drafted for 24 answers", tone: "border-primary/25 bg-primary-soft/60" },
            { icon: UserCheck, t: "Teacher review", b: "Edit, reject or accept each one", tone: "border-border bg-surface" },
            { icon: CheckCircle2, t: "Final decision", b: "Only approved work is saved", tone: "border-success/30 bg-success/8" },
          ].flatMap((s, i, arr) => {
            const card = (
              <div key={s.t} className={cn("rounded-xl border p-5", s.tone)}>
                <s.icon className="size-5 text-primary" />
                <p className="mt-4 font-semibold">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.b}</p>
              </div>
            );
            return i < arr.length - 1
              ? [card, <ArrowRight key={`a${i}`} className="mx-auto size-4 rotate-90 self-center text-muted-foreground sm:rotate-0" />]
              : [card];
          })}
        </Reveal>
      </div>
    </section>
  );
}

const SCHOOL_POINTS = [
  ["Easier teacher workflows", "Exams, retakes and grading in one place."],
  ["Less administrative overhead", "Fewer manual hand-offs between systems."],
  ["Centralized tools", "One workspace instead of scattered tools."],
  ["Existing systems stay", "Teachdesk connects to your infrastructure."],
  ["Controlled AI usage", "Teachers approve every AI output."],
  ["Permissions", "Role-based access for teachers and staff."],
  ["Scales with you", "From one department to a whole organization."],
  ["Privacy and security", "Designed around school data from day one."],
];

function Schools() {
  return (
    <section id="schools" className="scroll-mt-16 bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <Reveal className="max-w-2xl">
          <p className="eyebrow !text-background/60">For schools</p>
          <h2 className="display-lg mt-3 text-balance">Better tools for teachers without replacing your infrastructure.</h2>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-background/15 bg-background/15 sm:grid-cols-2 lg:grid-cols-4">
          {SCHOOL_POINTS.map(([t, b], i) => (
            <Reveal key={t} delay={i * 40} className="bg-foreground p-6">
              <p className="font-medium">{t}</p>
              <p className="mt-1.5 text-sm text-background/60">{b}</p>
            </Reveal>
          ))}
        </div>
        <Button asChild size="lg" className="mt-12 bg-background text-foreground hover:bg-background/90"><Link to="/demo">Talk to us <ArrowRight className="size-4" /></Link></Button>
      </div>
    </section>
  );
}

const SECURITY = [
  [ShieldCheck, "GDPR", "Built to support GDPR obligations for student data."],
  [Lock, "Privacy", "Student data is used for teaching workflows only."],
  [Users, "Role-based access", "People see what their role requires. Nothing more."],
  [KeyRound, "Secure authentication", "Modern sign-in with secure session handling."],
  [ScrollText, "Auditability", "Clear records of what changed, and who approved it."],
  [Layers, "Data minimization", "Only the information a workflow needs."],
  [Fingerprint, "Teacher control", "No AI output is applied without teacher approval."],
] as const;

function Security() {
  return (
    <section id="security" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-24 md:py-32">
      <SectionHeading eyebrow="Security" title="Built for the realities of school data." />
      <div className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {SECURITY.map(([Icon, t, b], i) => (
          <Reveal key={t} delay={i * 50}>
            <Icon className="size-5 text-primary" />
            <p className="mt-3 font-medium">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{b}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// Pricing values are placeholders — edit here when final pricing is set.
const PLANS = [
  { name: "Teacher", tagline: "For individual teachers.", price: "[PRICE]", unit: "per month", cta: "Get started", to: "/app" as const, points: ["Exams, grading and retakes", "AI-assisted equivalent versions", "Student follow-up"] },
  { name: "School", tagline: "For schools and departments.", price: "[PRICE]", unit: "per teacher / month", cta: "Book a demo", to: "/demo" as const, featured: true, points: ["Everything in Teacher", "Shared classes and admin", "Integrations as they ship"] },
  { name: "Enterprise", tagline: "For larger organizations.", price: "Let's talk", unit: "", cta: "Contact us", to: "/demo" as const, points: ["Everything in School", "Custom rollout and onboarding", "Data processing agreements"] },
];

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <SectionHeading eyebrow="Pricing" title="Simple pricing for teachers and schools." center />
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 80} className={cn("flex flex-col rounded-xl border p-7", p.featured ? "border-foreground bg-background shadow-[var(--shadow-panel)]" : "border-border bg-background")}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {p.featured && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">Most common</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-8 text-4xl font-semibold tracking-tight">{p.price}</p>
              <p className="h-5 text-xs text-muted-foreground">{p.unit}</p>
              <ul className="mt-8 flex-1 space-y-2.5 text-sm">
                {p.points.map((pt) => <li key={pt} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{pt}</li>)}
              </ul>
              <Button asChild className={cn("mt-8", p.featured && primaryBtn)} variant={p.featured ? "default" : "outline"}>
                <Link to={p.to}>{p.cta}</Link>
              </Button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
      <Reveal className="relative mx-auto max-w-3xl px-5 py-28 text-center md:py-36">
        <h2 className="display-xl text-balance">Spend less time managing teaching.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">See what Teachdesk could look like at your school.</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className={primaryBtn}><Link to="/demo">Book a demo</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/app">Log in</Link></Button>
        </div>
      </Reveal>
    </section>
  );
}
