import "server-only";

import { asc, desc, eq } from "drizzle-orm";
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

export async function listAdminAttempts() {
  const rows = await getDb()
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
    .orderBy(desc(attempts.startedAt));

  return rows.map((row) => ({
    ...row,
    displayStatus: displayAttemptStatus(row.status, row.lastSeenAt)
  }));
}

export async function getAdminAttemptDetail(attemptId: string) {
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
    questions: questionRows.map((question) => ({
      ...question,
      parts: partRows
        .filter((part) => part.questionId === question.id)
        .map((part) => ({
          ...part,
          answer: answersByPartId.get(part.id) ?? null
        }))
    }))
  };
}
