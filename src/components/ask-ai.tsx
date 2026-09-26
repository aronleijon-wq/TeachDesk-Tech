import { Loader2, Send, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askHelpAssistant } from "@/lib/help-ai.functions";
import { defineMessages, useMessages } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    suggestions: [
      "How do I add my class?",
      "What does “Needs a retake” mean?",
      "How do I invite colleagues?",
    ],
    somethingWrong: "Something went wrong. Please try again.",
    title: "Ask TeachDesk AI",
    subtitle: "Ask how something works, or a quick teaching question — in Swedish or English.",
    placeholder: "How do I schedule a retake?",
    label: "Your question",
    ask: "Ask",
    disclaimer:
      "AI can make mistakes, so check important details in the articles. Please don't include students' names or other personal details.",
    left: (n: number) => ` ${n} ${n === 1 ? "question" : "questions"} left today.`,
  },
  sv: {
    suggestions: [
      "Hur lägger jag till min klass?",
      "Vad betyder ”Behöver omprov”?",
      "Hur bjuder jag in kollegor?",
    ],
    somethingWrong: "Något gick fel. Försök igen.",
    title: "Fråga TeachDesk AI",
    subtitle:
      "Fråga hur något fungerar, eller en snabb fråga om undervisning — på svenska eller engelska.",
    placeholder: "Hur bokar jag ett omprov?",
    label: "Din fråga",
    ask: "Fråga",
    disclaimer:
      "AI kan göra fel, så kontrollera viktiga detaljer i artiklarna. Skriv inte elevers namn eller andra personuppgifter.",
    left: (n) => ` ${n} ${n === 1 ? "fråga" : "frågor"} kvar idag.`,
  },
});

/** Below this many questions left today, the panel says how many remain. */
const SHOW_LEFT_BELOW = 5;

interface Exchange {
  id: number;
  question: string;
  answer: string;
}

/** Ask TeachDesk AI: quick answers about the app, from the help articles. */
export function AskAi() {
  const t = useMessages(messages);
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [questionsLeft, setQuestionsLeft] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (text: string) => {
    const asked = text.trim();
    if (!asked || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await askHelpAssistant({ data: { question: asked } });
      setExchanges((list) => [{ id: Date.now(), question: asked, answer: result.answer }, ...list]);
      setQuestionsLeft(result.questionsLeft);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.somethingWrong);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(question);
  };

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" /> {t.title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.placeholder}
          maxLength={500}
          aria-label={t.label}
        />
        <Button type="submit" disabled={busy || !question.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t.ask}
        </Button>
      </form>

      {exchanges.length === 0 && !busy && (
        <div className="mt-3 flex flex-wrap gap-2">
          {t.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => void ask(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {exchanges.length > 0 && (
        <ul className="mt-4 space-y-3">
          {exchanges.map((exchange) => (
            <li key={exchange.id} className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">{exchange.question}</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{exchange.answer}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {t.disclaimer}
        {questionsLeft !== null && questionsLeft < SHOW_LEFT_BELOW && t.left(questionsLeft)}
      </p>
    </section>
  );
}
