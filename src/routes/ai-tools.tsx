import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  FileSearch,
  ListChecks,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeader, Panel, StatusPill } from "@/components/primitives";

export const Route = createFileRoute("/ai-tools")({
  head: () => ({
    meta: [
      { title: "AI Tools — Classflow" },
      { name: "description", content: "AI assistance placed inside the teaching workflow: equivalent exams, rubrics, grading suggestions and summaries." },
      { property: "og:title", content: "AI Tools — Classflow" },
      { property: "og:description", content: "AI assistance inside the teaching workflow." },
    ],
  }),
  component: AiTools,
});

const tools = [
  {
    icon: Sparkles,
    title: "Generate equivalent exam",
    description: "Create Version B of an exam that tests the same skills with new numbers and contexts.",
    to: "/exams",
    live: true,
  },
  {
    icon: FileSearch,
    title: "Analyse uploaded exam",
    description: "Extract questions, topics, points, difficulty and objectives from a PDF or document.",
    to: "/exams",
    live: false,
  },
  {
    icon: ListChecks,
    title: "Create rubric",
    description: "Draft a criteria-based rubric for an assignment, ready for your edits.",
    to: "/assignments",
    live: false,
  },
  {
    icon: ClipboardCheck,
    title: "Suggest grading",
    description: "Propose points for open answers with a motivation. You confirm every grade.",
    to: "/gradebook",
    live: false,
  },
  {
    icon: MessageSquareText,
    title: "Summarise class results",
    description: "A short written summary of how a class performed and what to reteach.",
    to: "/analytics",
    live: false,
  },
  {
    icon: Users,
    title: "Find students needing follow-up",
    description: "Surface students with missing work, absences or falling results.",
    to: "/students",
    live: false,
  },
];

function AiTools() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="AI Tools"
        subtitle="Assistance placed inside your workflow — never a chatbot in the way."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {tools.map((t) => (
          <Link
            key={t.title}
            to={t.to}
            className="rounded-lg border border-border bg-surface p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-panel"
          >
            <div className="flex items-start justify-between gap-2">
              <t.icon className="size-4 text-primary" />
              {t.live ? <StatusPill tone="success">Live AI</StatusPill> : <StatusPill>Demo preview</StatusPill>}
            </div>
            <p className="mt-3 text-sm font-semibold">{t.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
          </Link>
        ))}
      </div>

      <Panel className="mt-6" title="How AI is used here">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Equivalent exam generation runs on a real model, server-side, with your key never leaving the server.</li>
          <li>Every generated version and every suggested grade requires teacher approval before it counts.</li>
          <li>Tools marked “Demo preview” use seeded demo content and are clearly separated from production AI.</li>
          <li>Student data is never used to train models.</li>
        </ul>
      </Panel>
    </div>
  );
}
