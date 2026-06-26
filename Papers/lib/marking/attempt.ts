import "server-only";

import { getDb, type Db } from "@/lib/db/client";
import { partAnswers, questionParts, questions } from "@/lib/db/schema";
import type { MarkingResult, StudentAnswer } from "@/lib/domain";
import { type GeminiGenerate } from "@/lib/marking/gemini";
import { markPartAnswer, type MarkablePart } from "@/lib/marking/mark";
import { normalizePartMarkingSchema } from "@/lib/paper/presentation";

type QuestionRow = typeof questions.$inferSelect;
type QuestionPartRow = typeof questionParts.$inferSelect;

export type PartAnswerMarkFields = {
  answer: StudentAnswer;
  score: number;
  maxScore: number;
  markingStatus: MarkingResult["status"];
  studentFeedback: string;
  tutorRationale: string | null;
  missingRubricPoints: string[];
  exactMarkingDetails: unknown;
  markedAt: Date;
  updatedAt: Date;
};

export function buildMarkablePart(question: QuestionRow, part: QuestionPartRow): MarkablePart {
  return {
    id: part.id,
    label: part.label,
    type: part.type,
    prompt: part.prompt,
    marks: part.marks,
    stimulus: [...(question.stimulus ?? []), ...(part.stimulus ?? [])],
    markingSchema: normalizePartMarkingSchema({
      label: part.label,
      markingSchema: part.markingSchema
    })
  };
}

export function buildPartAnswerMarkFields({
  answer,
  markedAt,
  result
}: {
  answer: StudentAnswer;
  markedAt: Date;
  result: MarkingResult;
}): PartAnswerMarkFields {
  return {
    answer,
    score: result.score,
    maxScore: result.maxScore,
    markingStatus: result.status,
    studentFeedback: result.studentFeedback,
    tutorRationale: result.tutorRationale ?? null,
    missingRubricPoints: result.missingRubricPoints ?? [],
    exactMarkingDetails: result.exactMarkingDetails ?? null,
    markedAt,
    updatedAt: markedAt
  };
}

export async function markAndPersistPartAnswer({
  answer,
  attemptId,
  db = getDb(),
  generateGemini,
  now = new Date(),
  part,
  question
}: {
  answer: StudentAnswer;
  attemptId: string;
  db?: Db;
  generateGemini?: GeminiGenerate;
  now?: Date;
  part: QuestionPartRow;
  question: QuestionRow;
}) {
  const result = await markPartAnswer(buildMarkablePart(question, part), answer, {
    generateGemini
  });
  const fields = buildPartAnswerMarkFields({ answer, markedAt: now, result });

  await db
    .insert(partAnswers)
    .values({
      attemptId,
      questionId: question.id,
      questionPartId: part.id,
      ...fields
    })
    .onConflictDoUpdate({
      target: [partAnswers.attemptId, partAnswers.questionPartId],
      set: fields
    });

  return {
    result,
    markedAt: now
  };
}
