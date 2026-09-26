import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  FileSearch,
  MessageSquareText,
  Repeat,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, Panel, StatusPill } from "@/components/primitives";
import { defineMessages, useMessages } from "@/lib/i18n";
import { FREE_AI_PER_MONTH } from "@/lib/pricing";

type ToolId = "retake" | "generate" | "import" | "grade" | "ask";

const tools: { id: ToolId; icon: LucideIcon; to: "/app/exams" | "/app/help" }[] = [
  { id: "retake", icon: Repeat, to: "/app/exams" },
  { id: "generate", icon: Sparkles, to: "/app/exams" },
  { id: "import", icon: FileSearch, to: "/app/exams" },
  { id: "grade", icon: ClipboardCheck, to: "/app/exams" },
  { id: "ask", icon: MessageSquareText, to: "/app/help" },
];

/** A tool's name, what it does, where it is in the app, and which plans have it. */
type ToolText = { title: string; description: string; where: string; plan: string };

const messages = defineMessages({
  en: {
    pageTitle: "AI Tools — TeachDesk",
    title: "AI Tools",
    subtitle: "AI that does the repetitive work — you review everything it makes.",
    tools: {
      retake: {
        title: "Equivalent retake version",
        description:
          "A new version of an exam that tests the same skills for the same points, with new numbers and contexts.",
        where: "Open an exam → Generate equivalent version",
        plan: `Free: ${FREE_AI_PER_MONTH} per month · Pro: unlimited`,
      },
      generate: {
        title: "Generate a new exam",
        description:
          "Describe the exam in your own words, or add an earlier exam, course material or a list — AI writes a new exam in that style.",
        where: "Exams → Generate exam with AI",
        plan: "Pro",
      },
      import: {
        title: "Import an existing exam",
        description:
          "Already have an exam as a PDF, a photo or text? AI turns it into the same questions in TeachDesk, with points, answers and grading criteria.",
        where: "Exams → New exam → Import an existing exam",
        plan: "Pro",
      },
      grade: {
        title: "Grade tests with AI",
        description:
          "Upload the students' finished tests. AI suggests points for every question with a reason, and you approve each student.",
        where: "Open an exam → Grading",
        plan: "Pro",
      },
      ask: {
        title: "Ask TeachDesk AI",
        description: "Quick answers about how TeachDesk works, in Swedish or English.",
        where: "Help",
        plan: "Every plan",
      },
    } satisfies Record<ToolId, ToolText>,
    howUsed: "How AI is used here",
    how: [
      "AI runs on TeachDesk's servers, using Claude from Anthropic.",
      "Nothing AI makes is used until you've looked at it: generated questions are yours to edit, and retake versions and suggested points need your approval.",
      "AI never sets a score on its own. You decide every grade.",
      "Only what you choose is sent — like the exam you're working on, or the tests you upload for grading — and it isn't used to train AI models. TeachDesk doesn't keep the uploaded tests.",
    ],
    comingLaterTitle: "Coming later",
    comingLater: ["Rubric drafts for assignments", "Written summaries of class results"],
  },
  sv: {
    pageTitle: "AI-verktyg — TeachDesk",
    title: "AI-verktyg",
    subtitle: "AI som gör det repetitiva arbetet — du granskar allt den tar fram.",
    tools: {
      retake: {
        title: "Likvärdig version för omprov",
        description:
          "En ny version av ett prov som prövar samma förmågor för samma poäng, med nya siffror och sammanhang.",
        where: "Öppna ett prov → Skapa likvärdig version",
        plan: `Gratis: ${FREE_AI_PER_MONTH} per månad · Pro: obegränsat`,
      },
      generate: {
        title: "Skapa ett nytt prov",
        description:
          "Beskriv provet med egna ord, eller lägg till ett tidigare prov, kursmaterial eller en lista — AI skriver ett nytt prov i samma stil.",
        where: "Prov → Skapa prov med AI",
        plan: "Pro",
      },
      import: {
        title: "Importera ett befintligt prov",
        description:
          "Har du redan ett prov som PDF, foto eller text? AI gör om det till samma frågor i TeachDesk, med poäng, svar och bedömningskriterier.",
        where: "Prov → Nytt prov → Importera ett befintligt prov",
        plan: "Pro",
      },
      grade: {
        title: "Rätta prov med AI",
        description:
          "Ladda upp elevernas färdiga prov. AI föreslår poäng för varje fråga med en motivering, och du godkänner varje elev.",
        where: "Öppna ett prov → Rättning",
        plan: "Pro",
      },
      ask: {
        title: "Fråga TeachDesk AI",
        description: "Snabba svar om hur TeachDesk fungerar, på svenska eller engelska.",
        where: "Hjälp",
        plan: "Alla abonnemang",
      },
    },
    howUsed: "Så används AI här",
    how: [
      "AI körs på TeachDesks servrar och använder Claude från Anthropic.",
      "Inget som AI tar fram används innan du har tittat på det: skapade frågor kan du ändra, och omprovsversioner och föreslagna poäng kräver ditt godkännande.",
      "AI sätter aldrig ett resultat på egen hand. Du bestämmer varje betyg.",
      "Bara det du väljer skickas — som provet du arbetar med eller proven du laddar upp för rättning — och det används inte för att träna AI-modeller. TeachDesk sparar inte de uppladdade proven.",
    ],
    comingLaterTitle: "Kommer senare",
    comingLater: [
      "Förslag på bedömningsmatriser för uppgifter",
      "Skriftliga sammanfattningar av klassens resultat",
    ],
  },
});

export const Route = createFileRoute("/app/ai-tools")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: AiTools,
});

function AiTools() {
  const t = useMessages(messages);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-3 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.to}
            className="flex flex-col rounded-lg border border-border bg-surface p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-panel"
          >
            <div className="flex items-start justify-between gap-2">
              <tool.icon className="size-4 text-primary" />
              <StatusPill tone="primary">{t.tools[tool.id].plan}</StatusPill>
            </div>
            <p className="mt-3 text-sm font-semibold">{t.tools[tool.id].title}</p>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">
              {t.tools[tool.id].description}
            </p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              {t.tools[tool.id].where}
            </p>
          </Link>
        ))}
      </div>

      <Panel className="mt-6" title={t.howUsed}>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {t.how.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-4" title={t.comingLaterTitle}>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {t.comingLater.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
