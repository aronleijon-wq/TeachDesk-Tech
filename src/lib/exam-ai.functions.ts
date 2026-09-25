import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as z4 from "zod/v4";

const QuestionInput = z.object({
  number: z.number(),
  type: z.string(),
  topic: z.string(),
  skill: z.string(),
  difficulty: z.string(),
  points: z.number(),
  prompt: z.string(),
  expectedAnswer: z.string(),
  objective: z.string(),
});

const GenerateInput = z.object({
  examTitle: z.string(),
  subject: z.string(),
  versionLabel: z.string(),
  questions: z.array(QuestionInput).min(1),
});

// Shape Claude must return. The SDK helper turns this into a JSON schema and
// validates the response against it.
const GenerateOutput = z4.object({
  equivalenceScore: z4.number(),
  equivalenceNotes: z4.string(),
  questions: z4.array(
    z4.object({
      number: z4.number(),
      type: z4.string(),
      topic: z4.string(),
      skill: z4.string(),
      difficulty: z4.string(),
      points: z4.number(),
      prompt: z4.string(),
      expectedAnswer: z4.string(),
      gradingCriteria: z4.string(),
      objective: z4.string(),
    }),
  ),
});

export type GenerateResult = z4.infer<typeof GenerateOutput>;
export type GeneratedQuestion = GenerateResult["questions"][number];

/**
 * Generates an equivalent exam version with Claude. Server-side only.
 * Needs ANTHROPIC_API_KEY in the server environment (.env.local when running locally).
 */
export const generateEquivalentVersion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data }): Promise<GenerateResult> => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("AI is not configured. Add ANTHROPIC_API_KEY to .env.local and restart the server.");
    }

    const client = new Anthropic();

    const instruction = [
      `You are an experienced ${data.subject} teacher creating an equivalent version of the exam "${data.examTitle}".`,
      `Produce ${data.versionLabel}: keep topic, skill, difficulty, points, question type, objective and question count identical.`,
      "Change numbers, contexts, wording and examples so the version cannot be copied from the original.",
      "Include a short expected answer and grading criteria for every question,",
      "plus an equivalenceScore between 0 and 100 and one sentence of equivalence notes.",
      "Write in the same language as the original questions.",
      "",
      "Original questions:",
      JSON.stringify(data.questions),
    ].join("\n");

    try {
      const response = await client.beta.messages.parse({
        model: "claude-opus-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: betaZodOutputFormat(GenerateOutput) },
        messages: [{ role: "user", content: instruction }],
      });

      if (response.stop_reason === "refusal") {
        throw new Error("The AI declined to generate this version. Try rewording the questions.");
      }
      if (response.stop_reason === "max_tokens" || !response.parsed_output) {
        throw new Error("The AI returned an incomplete result. Please try again.");
      }
      return response.parsed_output;
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        throw new Error("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.local.");
      }
      if (err instanceof Anthropic.RateLimitError) {
        throw new Error("AI is busy right now. Please try again in a moment.");
      }
      if (err instanceof Anthropic.APIError) {
        throw new Error(`AI request failed (${err.status ?? "network error"}). Please try again.`);
      }
      throw err;
    }
  });
