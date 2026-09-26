import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSearch, MessageSquareText, Repeat, Sparkles, type LucideIcon } from "lucide-react";
import { PageHeader, Panel, StatusPill } from "@/components/primitives";
import { FREE_AI_PER_MONTH } from "@/lib/pricing";

export const Route = createFileRoute("/app/ai-tools")({
  head: () => ({
    meta: [
      { title: "AI Tools — TeachDesk" },
      {
        name: "description",
        content:
          "The AI tools in TeachDesk: equivalent retakes, new exams, importing existing exams and help.",
      },
      { property: "og:title", content: "AI Tools — TeachDesk" },
      { property: "og:description", content: "The AI tools in TeachDesk." },
    ],
  }),
  component: AiTools,
});

const tools: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Where the tool is in the app. */
  where: string;
  to: "/app/exams" | "/app/help";
  plan: string;
}[] = [
  {
    icon: Repeat,
    title: "Equivalent retake version",
    description:
      "A new version of an exam that tests the same skills for the same points, with new numbers and contexts.",
    where: "Open an exam → Generate equivalent version",
    to: "/app/exams",
    plan: `Free: ${FREE_AI_PER_MONTH} per month · Pro: unlimited`,
  },
  {
    icon: Sparkles,
    title: "Generate a new exam",
    description:
      "Describe the exam in your own words, or add an earlier exam, course material or a list — AI writes a new exam in that style.",
    where: "Exams → Generate exam with AI",
    to: "/app/exams",
    plan: "Pro",
  },
  {
    icon: FileSearch,
    title: "Import an existing exam",
    description:
      "Already have an exam as a PDF, a photo or text? AI turns it into the same questions in TeachDesk, with points, answers and grading criteria.",
    where: "Exams → New exam → Import an existing exam",
    to: "/app/exams",
    plan: "Pro",
  },
  {
    icon: MessageSquareText,
    title: "Ask TeachDesk AI",
    description: "Quick answers about how TeachDesk works, in Swedish or English.",
    where: "Help",
    to: "/app/help",
    plan: "Every plan",
  },
];

const comingLater = [
  "Grading suggestions for open answers",
  "Rubric drafts for assignments",
  "Written summaries of class results",
];

function AiTools() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="AI Tools"
        subtitle="AI that does the repetitive work — you review everything it makes."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            to={tool.to}
            className="flex flex-col rounded-lg border border-border bg-surface p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-panel"
          >
            <div className="flex items-start justify-between gap-2">
              <tool.icon className="size-4 text-primary" />
              <StatusPill tone="primary">{tool.plan}</StatusPill>
            </div>
            <p className="mt-3 text-sm font-semibold">{tool.title}</p>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{tool.description}</p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">{tool.where}</p>
          </Link>
        ))}
      </div>

      <Panel className="mt-6" title="How AI is used here">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>AI runs on TeachDesk's servers, using Claude from Anthropic.</li>
          <li>
            Nothing AI makes is used until you've looked at it: generated questions are yours to
            edit, and retake versions need your approval.
          </li>
          <li>AI never sets or changes a grade.</li>
          <li>
            Only what you choose is sent — like the exam you're working on — and it isn't used to
            train AI models.
          </li>
        </ul>
      </Panel>

      <Panel className="mt-4" title="Coming later">
        <ul className="space-y-1 text-sm text-muted-foreground">
          {comingLater.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
