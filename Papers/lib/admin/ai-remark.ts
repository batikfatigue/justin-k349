import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db/client";
import { attempts, partAnswers, questionParts, questions } from "@/lib/db/schema";
import type { MarkingResult } from "@/lib/domain";
import { type GeminiGenerate } from "@/lib/marking/gemini";
import { markAndPersistPartAnswer } from "@/lib/marking/attempt";
import { normalizePartMarkingSchema } from "@/lib/paper/presentation";

type AttemptRow = typeof attempts.$inferSelect;
type QuestionRow = typeof questions.$inferSelect;
type QuestionPartRow = typeof questionParts.$inferSelect;
type PartAnswerRow = typeof partAnswers.$inferSelect;

export type AiRemarkFailureReason =
  | "attempt_not_found"
  | "attempt_not_submitted"
  | "part_not_found"
  | "answer_not_found"
  | "part_not_ai"
  | "marking_failed";

export type AiRemarkResult =
  | {
      ok: true;
      status: "marked";
      markedAt: Date;
    }
  | {
      ok: false;
      reason: AiRemarkFailureReason;
      status?: MarkingResult["status"];
      markedAt?: Date;
    };

type PartWithQuestion = {
  part: QuestionPartRow;
  question: QuestionRow;
};

type MarkPartInput = PartWithQuestion & {
  answer: PartAnswerRow;
  attempt: AttemptRow;
};

export type AiRemarkRepository = {
  getAttempt(attemptId: string): Promise<AttemptRow | null>;
  getPartWithQuestion(attempt: AttemptRow, questionPartId: string): Promise<PartWithQuestion | null>;
  getAnswer(attemptId: string, questionPartId: string): Promise<PartAnswerRow | null>;
  markPart(input: MarkPartInput): Promise<Awaited<ReturnType<typeof markAndPersistPartAnswer>>>;
};

export async function resubmitAttemptPartToAiMarking(
  attemptId: string,
  questionPartId: string,
  options: {
    db?: Db;
    generateGemini?: GeminiGenerate;
    now?: Date;
  } = {}
): Promise<AiRemarkResult> {
  const db = options.db ?? getDb();

  return resubmitAttemptPartToAiMarkingWithRepository(
    {
      attemptId,
      questionPartId
    },
    createDrizzleAiRemarkRepository(db, options)
  );
}

export async function resubmitAttemptPartToAiMarkingWithRepository(
  {
    attemptId,
    questionPartId
  }: {
    attemptId: string;
    questionPartId: string;
  },
  repository: AiRemarkRepository
): Promise<AiRemarkResult> {
  const attempt = await repository.getAttempt(attemptId);

  if (!attempt) {
    return { ok: false, reason: "attempt_not_found" };
  }

  if (attempt.status !== "submitted") {
    return { ok: false, reason: "attempt_not_submitted" };
  }

  const partWithQuestion = await repository.getPartWithQuestion(attempt, questionPartId);

  if (!partWithQuestion) {
    return { ok: false, reason: "part_not_found" };
  }

  const answer = await repository.getAnswer(attempt.id, questionPartId);

  if (!answer) {
    return { ok: false, reason: "answer_not_found" };
  }

  const markingSchema = normalizePartMarkingSchema({
    label: partWithQuestion.part.label,
    markingSchema: partWithQuestion.part.markingSchema
  });

  if (markingSchema.mode !== "rubric_ai") {
    return { ok: false, reason: "part_not_ai" };
  }

  const { markedAt, result } = await repository.markPart({
    ...partWithQuestion,
    answer,
    attempt,
    part: {
      ...partWithQuestion.part,
      markingSchema
    }
  });

  if (result.status !== "marked") {
    return {
      ok: false,
      reason: "marking_failed",
      status: result.status,
      markedAt
    };
  }

  return {
    ok: true,
    status: result.status,
    markedAt
  };
}

function createDrizzleAiRemarkRepository(
  db: Db,
  options: {
    generateGemini?: GeminiGenerate;
    now?: Date;
  }
): AiRemarkRepository {
  return {
    async getAttempt(attemptId) {
      const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
      return attempt ?? null;
    },
    async getPartWithQuestion(attempt, questionPartId) {
      const [row] = await db
        .select({
          part: questionParts,
          question: questions
        })
        .from(questionParts)
        .innerJoin(questions, eq(questionParts.questionId, questions.id))
        .where(
          and(
            eq(questionParts.id, questionPartId),
            eq(questionParts.paperVersionId, attempt.paperVersionId),
            eq(questions.paperVersionId, attempt.paperVersionId)
          )
        );

      return row ?? null;
    },
    async getAnswer(attemptId, questionPartId) {
      const [answer] = await db
        .select()
        .from(partAnswers)
        .where(
          and(
            eq(partAnswers.attemptId, attemptId),
            eq(partAnswers.questionPartId, questionPartId)
          )
        );

      return answer ?? null;
    },
    async markPart({ answer, attempt, part, question }) {
      return markAndPersistPartAnswer({
        answer: answer.answer,
        attemptId: attempt.id,
        db,
        generateGemini: options.generateGemini,
        now: options.now,
        part,
        question
      });
    }
  };
}
