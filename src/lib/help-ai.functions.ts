import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callClaude } from "./claude";
import { helpArticlesAsText, SUPPORT_EMAIL } from "./help-articles";
import { HELP_QUESTIONS_PER_DAY } from "./pricing";

// The help center's Ask AI assistant. Answers are short and come from the help articles,
// so the smallest, fastest Claude model is enough: a question costs about a quarter of a
// US cent.
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = [
  "You are the help assistant inside TeachDesk, a web app for teachers in Sweden. TeachDesk gathers exams, retakes, grading and student follow-up in one place, alongside SchoolSoft, Vklass and Unikum.",
  "",
  "How to answer:",
  "- Questions about TeachDesk: answer only from the help articles below. Don't invent features, buttons, settings or prices.",
  `- If the articles don't cover it, say so briefly and suggest emailing ${SUPPORT_EMAIL}.`,
  "- Simple general teaching questions (for example how to word feedback or plan a retake) are fine too; keep those brief.",
  "- Politely decline anything unrelated to teaching or TeachDesk.",
  "- Reply in the language of the question, usually Swedish or English. Write the names of TeachDesk's pages, tabs and buttons exactly as the articles do (in English), also in Swedish answers.",
  "- Be friendly and brief: at most about 120 words. Write plain text only, with no Markdown such as ** or #, and use a short numbered list for steps.",
  "",
  "Help articles:",
  "",
  helpArticlesAsText(),
].join("\n");

/** Error code from use_help_question() once today's questions are used up. */
const NO_QUESTIONS_LEFT = "TD429";

const AskInput = z.object({ question: z.string().trim().min(1).max(500) });

export interface HelpAnswer {
  answer: string;
  /** How many more questions the teacher can ask today. */
  questionsLeft: number;
}

/** Answers a teacher's question about TeachDesk. Counts toward their daily questions. */
export const askHelpAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data, context }): Promise<HelpAnswer> => {
    const { data: questionsLeft, error } = await context.supabase.rpc("use_help_question");
    if (error?.code === NO_QUESTIONS_LEFT) {
      throw new Error(
        `You've asked ${HELP_QUESTIONS_PER_DAY} questions today, which is the daily limit. Search the articles, or ask again tomorrow.`,
      );
    }
    if (error) throw new Error("Couldn't check today's questions. Please try again.");

    const response = await callClaude((client) =>
      client.messages.create({
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: data.question }],
      }),
    );

    const answer = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .replaceAll("**", "") // Shown as plain text, so drop any stray bold markers.
      .trim();
    if (response.stop_reason === "refusal" || !answer) {
      throw new Error("The assistant couldn't answer that. Try asking in another way.");
    }
    return { answer, questionsLeft };
  });
