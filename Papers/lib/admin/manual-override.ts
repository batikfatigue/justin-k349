import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db/client";
import { attempts, partAnswers, questionParts } from "@/lib/db/schema";

type AttemptRow = typeof attempts.$inferSelect;
type QuestionPartRow = typeof questionParts.$inferSelect;
type PartAnswerRow = typeof partAnswers.$inferSelect;

export type ManualOverrideFailureReason =
  | "attempt_not_found"
  | "attempt_not_submitted"
  | "part_not_found"
  | "answer_not_found"
  | "invalid_score";

export type ManualOverrideResult =
  | {
      ok: true;
      markedAt: Date;
    }
  | {
      ok: false;
      reason: ManualOverrideFailureReason;
    };

export type ManualOverrideInput = {
  attemptId: string;
  questionPartId: string;
  score: number;
  studentFeedback: string;
  tutorRationale?: string;
};

export type ManualOverrideRepository = {
  getAttempt(attemptId: string): Promise<AttemptRow | null>;
  getPart(attempt: AttemptRow, questionPartId: string): Promise<QuestionPartRow | null>;
  getAnswer(attemptId: string, questionPartId: string): Promise<PartAnswerRow | null>;
  updateAnswerMark(input: {
    answer: PartAnswerRow;
    markedAt: Date;
    score: number;
    studentFeedback: string;
    tutorRationale: string | null;
  }): Promise<void>;
};

export async function manuallyOverrideAttemptPartMark(
  input: ManualOverrideInput,
  options: {
    db?: Db;
    now?: Date;
  } = {}
): Promise<ManualOverrideResult> {
  const db = options.db ?? getDb();

  return manuallyOverrideAttemptPartMarkWithRepository(
    input,
    createDrizzleManualOverrideRepository(db),
    options.now ?? new Date()
  );
}

export async function manuallyOverrideAttemptPartMarkWithRepository(
  input: ManualOverrideInput,
  repository: ManualOverrideRepository,
  now = new Date()
): Promise<ManualOverrideResult> {
  const attempt = await repository.getAttempt(input.attemptId);

  if (!attempt) {
    return { ok: false, reason: "attempt_not_found" };
  }

  if (attempt.status !== "submitted") {
    return { ok: false, reason: "attempt_not_submitted" };
  }

  const part = await repository.getPart(attempt, input.questionPartId);

  if (!part) {
    return { ok: false, reason: "part_not_found" };
  }

  const answer = await repository.getAnswer(attempt.id, input.questionPartId);

  if (!answer) {
    return { ok: false, reason: "answer_not_found" };
  }

  if (!Number.isInteger(input.score) || input.score < 0 || input.score > answer.maxScore) {
    return { ok: false, reason: "invalid_score" };
  }

  await repository.updateAnswerMark({
    answer,
    markedAt: now,
    score: input.score,
    studentFeedback: input.studentFeedback.trim(),
    tutorRationale: normalizeOptionalText(input.tutorRationale)
  });

  return {
    ok: true,
    markedAt: now
  };
}

function createDrizzleManualOverrideRepository(db: Db): ManualOverrideRepository {
  return {
    async getAttempt(attemptId) {
      const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
      return attempt ?? null;
    },
    async getPart(attempt, questionPartId) {
      const [part] = await db
        .select()
        .from(questionParts)
        .where(
          and(
            eq(questionParts.id, questionPartId),
            eq(questionParts.paperVersionId, attempt.paperVersionId)
          )
        );

      return part ?? null;
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
    async updateAnswerMark({ answer, markedAt, score, studentFeedback, tutorRationale }) {
      await db
        .update(partAnswers)
        .set({
          score,
          markingStatus: "marked",
          markingSource: "manual",
          studentFeedback,
          tutorRationale,
          markedAt,
          updatedAt: markedAt
        })
        .where(eq(partAnswers.id, answer.id));
    }
  };
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}
