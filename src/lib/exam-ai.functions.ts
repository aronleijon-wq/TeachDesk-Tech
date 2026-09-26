import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as z4 from "zod/v4";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { callClaude } from "./claude";
import { FREE_AI_PER_MONTH } from "./pricing";

const MODEL = "claude-opus-5";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Plans: the database decides what the signed-in teacher may use
// ---------------------------------------------------------------------------

type TeacherDatabase = SupabaseClient<Database>;

/** Stops a free-plan teacher who has used this month's AI allowance. */
async function checkAiAllowance(db: TeacherDatabase) {
  const { data, error } = await db.rpc("ai_generations_left");
  if (error) throw new Error("Couldn't check your plan. Please try again.");
  const left = data as number | null; // null means unlimited (Pro)
  if (left !== null && left <= 0) {
    throw new Error(
      `You've used this month's ${FREE_AI_PER_MONTH} free AI retakes. Upgrade to Pro for unlimited retakes.`,
    );
  }
}

/** Stops teachers without Pro (paid, trial or through their school). */
async function requirePro(db: TeacherDatabase, feature: string) {
  const { data, error } = await db.rpc("has_pro_access");
  if (error) throw new Error("Couldn't check your plan. Please try again.");
  if (!data) throw new Error(`${feature} is part of Pro. Upgrade to use it.`);
}

/** Counts a finished generation; a failed count never costs the teacher their result. */
async function recordAiUse(db: TeacherDatabase) {
  const { error } = await db.rpc("record_ai_generation");
  if (error) console.error("Couldn't record AI use", error);
}

/** Runs a structured-output request and checks that a complete result came back. */
async function runStructured<T>(
  schema: z4.ZodType<T>,
  content: string | BetaContentBlockParam[],
  tooLongMessage: string,
): Promise<T> {
  const response = await callClaude((client) =>
    client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
      messages: [{ role: "user", content }],
    }),
  );

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined this request. Try rewording or removing unusual content.");
  }
  if (response.stop_reason === "max_tokens") throw new Error(tooLongMessage);
  if (!response.parsed_output)
    throw new Error("The AI returned an incomplete result. Please try again.");
  return response.parsed_output;
}

const QuestionOutput = z4.object({
  number: z4.number(),
  type: z4.enum(["multiple-choice", "short-answer", "open-ended", "calculation"]),
  topic: z4.string(),
  skill: z4.string(),
  difficulty: z4.enum(["Easy", "Medium", "Hard"]),
  points: z4.number(),
  prompt: z4.string(),
  expectedAnswer: z4.string(),
  gradingCriteria: z4.string(),
  objective: z4.string(),
});

export type GeneratedQuestion = z4.infer<typeof QuestionOutput>;

// ---------------------------------------------------------------------------
// Equivalent version generation
// ---------------------------------------------------------------------------

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

const GenerateOutput = z4.object({
  equivalenceScore: z4.number(),
  equivalenceNotes: z4.string(),
  questions: z4.array(QuestionOutput),
});

export type GenerateResult = z4.infer<typeof GenerateOutput>;

/**
 * Generates an equivalent exam version with Claude. Server-side only.
 * Needs ANTHROPIC_API_KEY on the server (see claude.ts).
 */
export const generateEquivalentVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }): Promise<GenerateResult> => {
    await checkAiAllowance(context.supabase);
    const instruction = [
      `You are an experienced ${data.subject} teacher writing ${data.versionLabel} of the exam "${data.examTitle}".`,
      "This version is a retake for students who missed the original, so it must be fair: a student who could solve",
      "the original should find this version exactly as hard, and one who could not should not find it easier.",
      "",
      "For every original question, write one new question that:",
      "- tests the same skill and learning objective, with the same question type, difficulty and points;",
      "- asks for exactly the same kind of answer. Do not add extra parts, explanations, justifications or",
      "  follow-up tasks, and do not remove any part the original asks for;",
      "- needs the same number and kind of solution steps (e.g. one chain-rule application stays one);",
      "- uses different numbers, functions, contexts and wording, so answers cannot be copied from the original;",
      "- has clean, solvable values (no messier arithmetic than the original).",
      "",
      "Keep the question count and order identical, and write in the same language as the original.",
      "For each question give a short expected answer and grading criteria.",
      "Then rate how equivalent the whole version is (equivalenceScore, 0-100) and give one sentence of",
      "equivalence notes naming the question that differs most from its original, if any.",
      "",
      "Original questions:",
      JSON.stringify(data.questions),
    ].join("\n");

    const result = await runStructured(
      GenerateOutput,
      instruction,
      "This exam is too long to generate in one go. Try splitting it into two exams.",
    );
    await recordAiUse(context.supabase);
    return result;
  });

// ---------------------------------------------------------------------------
// Extract questions from a teacher's existing exam (pasted text, PDF or photo)
// ---------------------------------------------------------------------------

const MAX_FILE_BASE64_CHARS = 14_000_000; // ~10 MB file

const ExtractInput = z
  .object({
    subject: z.string(),
    examTitle: z.string(),
    text: z.string().max(200_000).optional(),
    file: z
      .object({
        mediaType: z.enum([
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif",
        ]),
        data: z.string().max(MAX_FILE_BASE64_CHARS),
      })
      .optional(),
  })
  .refine((d) => Boolean(d.text?.trim()) || Boolean(d.file), {
    message: "Paste the exam text or choose a file.",
  });

/** Questions for a new exam, read from an existing one or generated. */
const ExamDraftOutput = z4.object({
  questions: z4.array(QuestionOutput),
  objectives: z4.array(z4.string()),
  warnings: z4.array(z4.string()),
});

export type ExamDraft = z4.infer<typeof ExamDraftOutput>;

export const extractExamQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data, context }): Promise<ExamDraft> => {
    await requirePro(context.supabase, "Importing existing exams");
    const instruction = [
      `Below is an existing ${data.subject} exam${data.examTitle ? ` called "${data.examTitle}"` : ""}, written by a teacher.`,
      "Extract every question into structured form so it can be used in an exam tool.",
      "",
      "- Keep each question's wording exactly as written (fix only obvious scanning errors). Keep the original",
      "  language. If a question has sub-parts (a, b, c), keep them together as one question.",
      "- Use the points stated in the exam. If none are stated, estimate sensible points from the difficulty.",
      "- If the exam includes an answer key, use it for expectedAnswer; otherwise write a concise correct answer.",
      "- Write short, practical grading criteria for each question.",
      "- Choose topic, skill, difficulty and learning objective per question, and list the exam's distinct",
      "  learning objectives in objectives.",
      "- In warnings, list anything the teacher should double-check, one short sentence each: unreadable or",
      "  ambiguous parts, and every question whose points you estimated (name the question number).",
      "  Leave the list empty if there is nothing to flag.",
      "- If the content is not an exam at all, return no questions and explain why in warnings.",
    ].join("\n");

    const content: BetaContentBlockParam[] = [];
    if (data.file) {
      content.push(
        data.file.mediaType === "application/pdf"
          ? {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: data.file.data },
            }
          : {
              type: "image",
              source: { type: "base64", media_type: data.file.mediaType, data: data.file.data },
            },
      );
    }
    if (data.text?.trim()) content.push({ type: "text", text: `Exam text:\n${data.text}` });
    content.push({ type: "text", text: instruction });

    const result = await runStructured(
      ExamDraftOutput,
      content,
      "This exam is too long to read in one go. Try splitting it into two parts.",
    );
    await recordAiUse(context.supabase);
    return result;
  });

// ---------------------------------------------------------------------------
// Generate a new exam from topics and learning objectives
// ---------------------------------------------------------------------------

const GenerateExamInput = z.object({
  subject: z.string().max(200),
  examTitle: z.string().max(200),
  topics: z.string().max(2000),
  objectives: z.array(z.string().max(500)).max(20),
  difficulty: z.enum(["Easy", "Mixed", "Hard"]),
  totalPoints: z.number().int().min(1).max(200),
  durationMin: z.number().int().min(10).max(300),
});

export const generateExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateExamInput.parse(input))
  .handler(async ({ data, context }): Promise<ExamDraft> => {
    await requirePro(context.supabase, "Generating exams with AI");
    const difficulty =
      data.difficulty === "Mixed"
        ? "a mix of easy, medium and hard questions"
        : `mostly ${data.difficulty.toLowerCase()} questions`;
    const instruction = [
      `Write a ${data.subject} exam called "${data.examTitle}" for students at a Swedish school.`,
      `Topics: ${data.topics.trim() || "choose them from the title and the learning objectives"}.`,
      data.objectives.length > 0
        ? `Learning objectives to test:\n${data.objectives.map((o) => `- ${o}`).join("\n")}`
        : "No learning objectives were given: choose 3 to 5 that fit the title and topics.",
      `Difficulty: ${difficulty}.`,
      `Students have ${data.durationMin} minutes, and the points must add up to exactly ${data.totalPoints}.`,
      "",
      "- Write in the language of the title and topics (Swedish unless they are in English).",
      "- Every question must be solvable and unambiguous, with clean values.",
      "- For each question give its type, topic, skill, difficulty, points, the question text, a concise",
      "  correct answer, short grading criteria and the learning objective it tests.",
      "- List the exam's learning objectives in objectives.",
      "- In warnings, note anything the teacher should check before using the exam, one short sentence",
      "  each, or leave it empty.",
    ].join("\n");

    const result = await runStructured(
      ExamDraftOutput,
      instruction,
      "The exam came out too long. Try fewer topics or fewer points.",
    );
    await recordAiUse(context.supabase);
    return result;
  });
