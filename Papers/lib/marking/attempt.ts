import "server-only";

import { ne } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db/client";
import { partAnswers, questionParts, questions } from "@/lib/db/schema";
import type { MarkingResult, MarkingSource, StudentAnswer } from "@/lib/domain";
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
  markingSource: MarkingSource;
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
    markingSource: "auto",
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
  preserveManualMark = false,
  question
}: {
  answer: StudentAnswer;
  attemptId: string;
  db?: Db;
  generateGemini?: GeminiGenerate;
  now?: Date;
  part: QuestionPartRow;
  preserveManualMark?: boolean;
  question: QuestionRow;
}) {
  const result = await markPartAnswer(buildMarkablePart(question, part), answer, {
    generateGemini
  });
  const fields = buildPartAnswerMarkFields({ answer, markedAt: now, result });

  const upsert = db
    .insert(partAnswers)
    .values({
      attemptId,
      questionId: question.id,
      questionPartId: part.id,
      ...fields
    })
    .onConflictDoUpdate({
      target: [partAnswers.attemptId, partAnswers.questionPartId],
      set: fields,
      ...(preserveManualMark ? { setWhere: ne(partAnswers.markingSource, "manual") } : {})
    });

  let persisted = true;

  if (preserveManualMark) {
    const written = await upsert.returning({ id: partAnswers.id });
    persisted = written.length > 0;
  } else {
    await upsert;
  }

  return {
    result,
    markedAt: now,
    persisted
  };
}
