import "server-only";

import { asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  accessCodes,
  attempts,
  papers,
  partAnswers,
  questionParts,
  questions
} from "@/lib/db/schema";
import { displayAttemptStatus } from "@/lib/attempt-status";
import { isUuid } from "@/lib/security";

export const ADMIN_ATTEMPTS_PAGE_SIZE = 50;

export type ListAdminAttemptsOptions = {
  page?: number;
  pageSize?: number;
};

export async function listAdminAttempts({
  page = 1,
  pageSize = ADMIN_ATTEMPTS_PAGE_SIZE
}: ListAdminAttemptsOptions = {}) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const requestedPage = Math.max(1, Math.floor(page));
  const db = getDb();

  const [{ total }] = await db.select({ total: count() }).from(attempts);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(requestedPage, totalPages);

  const rows = await db
    .select({
      id: attempts.id,
      paperId: attempts.paperId,
      paperTitle: papers.title,
      accessCodeLabel: accessCodes.label,
      studentName: attempts.studentName,
      attemptNumber: attempts.attemptNumber,
      status: attempts.status,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      lastSeenAt: attempts.lastSeenAt,
      elapsedSeconds: attempts.elapsedSeconds
    })
    .from(attempts)
    .innerJoin(papers, eq(attempts.paperId, papers.id))
    .innerJoin(accessCodes, eq(attempts.accessCodeId, accessCodes.id))
    .orderBy(desc(attempts.startedAt), desc(attempts.id))
    .limit(safePageSize)
    .offset((safePage - 1) * safePageSize);

  return {
    attempts: rows.map((row) => ({
      ...row,
      displayStatus: displayAttemptStatus(row.status, row.lastSeenAt)
    })),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages
  };
}

export async function getAdminAttemptDetail(attemptId: string) {
  if (!isUuid(attemptId)) {
    return null;
  }

  const [attempt] = await getDb()
    .select({
      id: attempts.id,
      paperId: attempts.paperId,
      paperVersionId: attempts.paperVersionId,
      paperTitle: papers.title,
      syllabus: papers.syllabus,
      accessCodeLabel: accessCodes.label,
      studentName: attempts.studentName,
      normalizedStudentName: attempts.normalizedStudentName,
      attemptNumber: attempts.attemptNumber,
      status: attempts.status,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      lastSeenAt: attempts.lastSeenAt,
      elapsedSeconds: attempts.elapsedSeconds
    })
    .from(attempts)
    .innerJoin(papers, eq(attempts.paperId, papers.id))
    .innerJoin(accessCodes, eq(attempts.accessCodeId, accessCodes.id))
    .where(eq(attempts.id, attemptId));

  if (!attempt) {
    return null;
  }

  const questionRows = await getDb()
    .select()
    .from(questions)
    .where(eq(questions.paperVersionId, attempt.paperVersionId))
    .orderBy(asc(questions.position));
  const partRows = await getDb()
    .select()
    .from(questionParts)
    .where(eq(questionParts.paperVersionId, attempt.paperVersionId))
    .orderBy(asc(questionParts.position));
  const answerRows = await getDb()
    .select()
    .from(partAnswers)
    .where(eq(partAnswers.attemptId, attempt.id));
  const answersByPartId = new Map(answerRows.map((answer) => [answer.questionPartId, answer]));

  return {
    attempt: {
      ...attempt,
      displayStatus: displayAttemptStatus(attempt.status, attempt.lastSeenAt)
    },
    questions: questionRows.map((question) => {
      const questionParts = partRows.filter((part) => part.questionId === question.id);
      return {
        ...question,
        stimulus: question.stimulus,
        title: question.title,
        parts: questionParts.map((part) => {
          const markingSchema = part.markingSchema;
          const answer = answersByPartId.get(part.id) ?? null;

          return {
            ...part,
            stimulus: part.stimulus,
            markingSchema,
            answer,
            canResubmitAiMark:
              attempt.status === "submitted" && Boolean(answer) && markingSchema.mode === "rubric_ai"
          };
        })
      };
    })
  };
}
