import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import type { RubricAiMarkingSchema, Stimulus, StudentAnswer } from "@/lib/domain";

const geminiMarkSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number().positive(),
  studentFeedback: z.string().min(1),
  tutorRationale: z.string().min(1),
  missingRubricPoints: z.array(z.string()).default([])
});

export type GeminiMarkInput = {
  prompt: string;
  visibleStimuli: Stimulus[];
  studentAnswer: StudentAnswer;
  marking: RubricAiMarkingSchema;
  maxScore: number;
};

export type GeminiGenerate = (prompt: string) => Promise<string>;

export function buildGeminiPrompt(input: GeminiMarkInput) {
  return [
    "You are marking a K349 G3 Computing practice answer.",
    "Return only JSON with score, maxScore, studentFeedback, tutorRationale, and missingRubricPoints.",
    "studentFeedback must be broad, hint-safe, and must not reveal the model answer, exact missing rubric points, corrected lines, or accepted answers.",
    "tutorRationale may include detailed rubric reasoning.",
    "",
    JSON.stringify(
      {
        questionPrompt: input.prompt,
        visibleStimuli: input.visibleStimuli,
        studentAnswer: input.studentAnswer,
        maxScore: input.maxScore,
        modelAnswer: input.marking.modelAnswer,
        rubricPoints: input.marking.rubricPoints
      },
      null,
      2
    )
  ].join("\n");
}

export async function requestGeminiMark(input: GeminiMarkInput, generate?: GeminiGenerate) {
  const prompt = buildGeminiPrompt(input);
  const raw = generate ? await generate(prompt) : await callGemini(prompt);
  const parsedJson = JSON.parse(raw);
  const parsed = geminiMarkSchema.parse(parsedJson);

  if (parsed.maxScore !== input.maxScore) {
    throw new Error(`Gemini returned maxScore ${parsed.maxScore}, expected ${input.maxScore}.`);
  }

  if (parsed.score > input.maxScore) {
    throw new Error(`Gemini returned score ${parsed.score}, above maxScore ${input.maxScore}.`);
  }

  return parsed;
}

async function callGemini(prompt: string) {
  const env = getEnv();

  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });
  const response = await model.generateContent(prompt);

  return response.response.text();
}
