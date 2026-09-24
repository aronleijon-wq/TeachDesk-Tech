import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export type GeneratedQuestion = {
  number: number;
  type: string;
  topic: string;
  skill: string;
  difficulty: string;
  points: number;
  prompt: string;
  expectedAnswer: string;
  gradingCriteria: string;
  objective: string;
};

export type GenerateResult = {
  questions: GeneratedQuestion[];
  equivalenceScore: number;
  equivalenceNotes: string;
};

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    equivalenceScore: { type: "number" },
    equivalenceNotes: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          number: { type: "number" },
          type: { type: "string" },
          topic: { type: "string" },
          skill: { type: "string" },
          difficulty: { type: "string" },
          points: { type: "number" },
          prompt: { type: "string" },
          expectedAnswer: { type: "string" },
          gradingCriteria: { type: "string" },
          objective: { type: "string" },
        },
        required: [
          "number", "type", "topic", "skill", "difficulty",
          "points", "prompt", "expectedAnswer", "gradingCriteria", "objective",
        ],
      },
    },
  },
  required: ["equivalenceScore", "equivalenceNotes", "questions"],
} as const;

/**
 * Generates an equivalent exam version with Lovable AI. Server-side only.
 */
export const generateEquivalentVersion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data }): Promise<GenerateResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this workspace.");

    const instruction = [
      `You are an experienced ${data.subject} teacher creating an equivalent version of the exam "${data.examTitle}".`,
      `Produce ${data.versionLabel}: keep topic, skill, difficulty, points, question type, objective and question count identical.`,
      "Change numbers, contexts, wording and examples so the version cannot be copied from the original.",
      "Return json matching the schema, including a short expected answer and grading criteria for every question,",
      "plus an equivalenceScore between 0 and 100 and one sentence of equivalence notes.",
      "",
      "Original questions:",
      JSON.stringify(data.questions),
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: instruction,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: {
          format: { type: "json_schema", name: "equivalent_exam", strict: true, schema: jsonSchema },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI is busy right now. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits are exhausted. Add credits in workspace settings.");
      throw new Error(`AI request failed (${res.status}). ${detail.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
              text += evt.delta;
            } else if (evt.type === "response.completed" && typeof evt.response?.output_text === "string" && !text) {
              text = evt.response.output_text;
            }
          } catch {
            // ignore partial frames
          }
        }
      }
    }

    if (!text.trim()) throw new Error("The AI returned an empty result. Please try again.");

    const parsed = JSON.parse(text) as GenerateResult;
    return parsed;
  });
