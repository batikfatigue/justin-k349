import "server-only";

import { and, asc, eq, inArray, isNull, max, or, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb, type Db } from "@/lib/db/client";
import {
  accessCodes,
  attempts,
  paperAccessCodes,
  papers,
  partAnswers,
  questionParts,
  questions
} from "@/lib/db/schema";
import type { ResponseSchema, StudentAnswer } from "@/lib/domain";
import {
  buildPartAnswerMarkFields,
  markAndPersistPartAnswer
} from "@/lib/marking/attempt";
import { hashAccessCode, isUuid } from "@/lib/security";
import type { StudentSession } from "@/lib/auth/session";

const SUBMIT_MARKING_CONCURRENCY = 5;
const attemptCreateRetries = 3;

type AttemptRow = typeof attempts.$inferSelect;
type QuestionRow = typeof questions.$inferSelect;
type QuestionPartRow = typeof questionParts.$inferSelect;

async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await task(items[index]);
    }
  });

  await Promise.all(workers);

  return results;
}

export async function resolveAccessCode(code: string) {
  const [accessCode] = await getDb()
    .select()
    .from(accessCodes)
    .where(and(eq(accessCodes.codeHash, hashAccessCode(code)), eq(accessCodes.active, true)));

  return accessCode ?? null;
}

async function isAccessCodeActive(accessCodeId: string, db: Db) {
  const [accessCode] = await db
    .select({ active: accessCodes.active })
    .from(accessCodes)
    .where(eq(accessCodes.id, accessCodeId));

  return accessCode?.active === true;
}

export async function getPublishedPapersForStudent(accessCodeId: string) {
  return getDb()
    .select({
      id: papers.id,
      title: papers.title,
      syllabus: papers.syllabus,
      totalMarks: papers.totalMarks
    })
    .from(paperAccessCodes)
    .innerJoin(papers, eq(paperAccessCodes.paperId, papers.id))
    .innerJoin(
      accessCodes,
      and(eq(paperAccessCodes.accessCodeId, accessCodes.id), eq(accessCodes.active, true))
    )
    .where(and(eq(paperAccessCodes.accessCodeId, accessCodeId), eq(papers.status, "published")))
    .orderBy(asc(papers.title));
}

export async function getStudentPaperIntro(paperId: string, session: StudentSession) {
  const [paper] = await getDb()
    .select({
      id: papers.id,
      title: papers.title,
      syllabus: papers.syllabus,
      totalMarks: papers.totalMarks,
      currentVersionId: papers.currentVersionId
    })
    .from(paperAccessCodes)
    .innerJoin(papers, eq(paperAccessCodes.paperId, papers.id))
    .innerJoin(
      accessCodes,
      and(eq(paperAccessCodes.accessCodeId, accessCodes.id), eq(accessCodes.active, true))
    )
    .where(
      and(
        eq(paperAccessCodes.paperId, paperId),
        eq(paperAccessCodes.accessCodeId, session.accessCodeId),
        eq(papers.status, "published")
      )
    );

  if (!paper?.currentVersionId) {
    return null;
  }

  const paperQuestions = await getDb()
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.paperVersionId, paper.currentVersionId));

  const [attemptAggregate] = await getDb()
    .select({ latestAttempt: max(attempts.attemptNumber) })
    .from(attempts)
    .where(
      and(
        eq(attempts.paperId, paperId),
        eq(attempts.accessCodeId, session.accessCodeId),
        eq(attempts.normalizedStudentName, session.normalizedStudentName)
      )
    );

  return {
    ...paper,
    questionCount: paperQuestions.length,
    nextAttemptNumber: (attemptAggregate?.latestAttempt ?? 0) + 1
  };
}

export async function createStudentAttempt(paperId: string, session: StudentSession) {
  const paper = await getStudentPaperIntro(paperId, session);
  const paperVersionId = paper?.currentVersionId;

  if (!paperVersionId) {
    notFound();
  }

  const db = getDb();

  for (let retry = 0; retry < attemptCreateRetries; retry += 1) {
    try {
      return await db.transaction(async (tx) => {
        const [attemptAggregate] = await tx
          .select({ latestAttempt: max(attempts.attemptNumber) })
          .from(attempts)
          .where(
            and(
              eq(attempts.paperId, paperId),
              eq(attempts.accessCodeId, session.accessCodeId),
              eq(attempts.normalizedStudentName, session.normalizedStudentName)
            )
          );

        const [created] = await tx
          .insert(attempts)
          .values({
            paperId,
            paperVersionId,
            accessCodeId: session.accessCodeId,
            studentName: session.studentName,
            normalizedStudentName: session.normalizedStudentName,
            sessionToken: session.sessionToken,
            attemptNumber: (attemptAggregate?.latestAttempt ?? 0) + 1,
            status: "in_progress",
            elapsedSeconds: 0
          })
          .returning();

        return created;
      });
    } catch (error) {
      if (!isUniqueViolation(error) || retry === attemptCreateRetries - 1) {
        throw error;
      }
    }
  }

  throw new Error("Unable to create attempt.");
}

export async function getStudentAttempt(attemptId: string, session: StudentSession) {
  if (!isUuid(attemptId)) {
    return null;
  }

  const db = getDb();
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.accessCodeId, session.accessCodeId),
        eq(attempts.normalizedStudentName, session.normalizedStudentName),
        or(isNull(attempts.sessionToken), eq(attempts.sessionToken, session.sessionToken))
      )
    );

  if (!attempt || !(await isAccessCodeActive(session.accessCodeId, db))) {
    return null;
  }

  return attempt;
}

export async function getStudentQuestion(attemptId: string, questionNumber: number, session: StudentSession) {
  const attempt = await getStudentAttempt(attemptId, session);

  if (!attempt) {
    notFound();
  }

  const [paper] = await getDb()
    .select({
      id: papers.id,
      title: papers.title,
      syllabus: papers.syllabus,
      totalMarks: papers.totalMarks
    })
    .from(papers)
    .where(eq(papers.id, attempt.paperId));

  const allQuestions = await getDb()
    .select()
    .from(questions)
    .where(eq(questions.paperVersionId, attempt.paperVersionId))
    .orderBy(asc(questions.position));
  const question = allQuestions[questionNumber - 1];

  if (!question) {
    notFound();
  }

  const parts = await getDb()
    .select()
    .from(questionParts)
    .where(eq(questionParts.questionId, question.id))
    .orderBy(asc(questionParts.position));
  const partIds = parts.map((part) => part.id);
  const savedAnswers =
    partIds.length > 0
      ? await getDb()
          .select()
          .from(partAnswers)
          .where(
            and(eq(partAnswers.attemptId, attempt.id), inArray(partAnswers.questionPartId, partIds))
          )
      : [];
  const answerByPartId = new Map(savedAnswers.map((answer) => [answer.questionPartId, answer]));

  return {
    attempt,
    paper,
    question: {
      id: question.id,
      number: question.number,
      title: question.title,
      marks: question.marks,
      stimulus: question.stimulus,
      position: question.position
    },
    parts: parts.map((part) => ({
      id: part.id,
      label: part.label,
      type: part.type,
      prompt: part.prompt,
      marks: part.marks,
      stimulus: part.stimulus,
      responseSchema: part.responseSchema,
      studentFeedbackPolicy: part.studentFeedbackPolicy,
      answer: answerByPartId.get(part.id)?.answer ?? defaultAnswer(part.responseSchema)
    })),
    questionNumber,
    questionCount: allQuestions.length
  };
}

export async function saveQuestionAnswers(
  attemptId: string,
  questionNumber: number,
  formData: FormData,
  session: StudentSession
) {
  const db = getDb();
  const safeQuestion = await getStudentQuestionForSave(attemptId, questionNumber, session, db);
  const now = new Date();
  const answerRows = safeQuestion.parts.map((part) => ({
    attemptId,
    questionId: safeQuestion.question.id,
    questionPartId: part.id,
    answer: parseAnswer(formData, part.id, part.responseSchema),
    maxScore: part.marks,
    markingStatus: "pending",
    markingSource: "auto" as const,
    score: null,
    studentFeedback: null,
    tutorRationale: null,
    missingRubricPoints: [],
    exactMarkingDetails: null,
    markedAt: null,
    updatedAt: now
  }));

  if (answerRows.length > 0) {
    await db
      .insert(partAnswers)
      .values(answerRows)
      .onConflictDoUpdate({
        target: [partAnswers.attemptId, partAnswers.questionPartId],
        set: {
          answer: sql`excluded.answer`,
          markingStatus: "pending",
          markingSource: "auto",
          score: null,
          studentFeedback: null,
          tutorRationale: null,
          missingRubricPoints: [],
          exactMarkingDetails: null,
          markedAt: null,
          updatedAt: now
        }
      });
  }

  await updateStudentAttemptProgress(db, safeQuestion.attempt, session, now);

  return safeQuestion;
}

export async function updateStudentHeartbeat(attemptId: string, session: StudentSession) {
  const attempt = await getStudentAttempt(attemptId, session);

  if (!attempt || attempt.status !== "in_progress") {
    return null;
  }

  return updateStudentAttemptProgress(getDb(), attempt, session, new Date());
}

export async function submitStudentAttempt(attemptId: string, session: StudentSession) {
  const attempt = await getStudentAttempt(attemptId, session);

  if (!attempt) {
    notFound();
  }

  if (attempt.status === "submitted") {
    return attempt;
  }

  const db = getDb();
  const now = new Date();
  const [submitted] = await db
    .update(attempts)
    .set({
      status: "submitted",
      submittedAt: now,
      lastSeenAt: now,
      elapsedSeconds: elapsedSinceStart(attempt, now)
    })
    .where(and(eq(attempts.id, attemptId), eq(attempts.status, "in_progress")))
    .returning();

  if (!submitted) {
    return (await getStudentAttempt(attemptId, session)) ?? attempt;
  }

  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.paperVersionId, attempt.paperVersionId))
    .orderBy(asc(questions.position));
  const allParts = await db
    .select()
    .from(questionParts)
    .where(eq(questionParts.paperVersionId, attempt.paperVersionId))
    .orderBy(asc(questionParts.position));
  const existingAnswers = await db
    .select()
    .from(partAnswers)
    .where(eq(partAnswers.attemptId, attemptId));
  const answerByPartId = new Map(existingAnswers.map((answer) => [answer.questionPartId, answer]));
  const questionById = new Map(allQuestions.map((question) => [question.id, question]));

  const markablePartsWithQuestions = allParts.flatMap((part) => {
    const question = questionById.get(part.questionId);

    return question ? [{ part, question }] : [];
  });

  await runWithConcurrency(markablePartsWithQuestions, SUBMIT_MARKING_CONCURRENCY, async ({ part, question }) => {
    const answer = answerByPartId.get(part.id)?.answer ?? defaultAnswer(part.responseSchema);

    try {
      await markAndPersistPartAnswer({ answer, attemptId, db, now, part, question });
    } catch (error) {
      await persistFailedMark(db, attemptId, question, part, answer, now, error);
    }
  });

  return submitted;
}

export async function getStudentResults(attemptId: string, session: StudentSession) {
  const attempt = await getStudentAttempt(attemptId, session);

  if (!attempt) {
    notFound();
  }

  const [paper] = await getDb()
    .select({
      id: papers.id,
      title: papers.title,
      syllabus: papers.syllabus,
      totalMarks: papers.totalMarks
    })
    .from(papers)
    .where(eq(papers.id, attempt.paperId));

  const rows = await getDb()
    .select({
      questionNumber: questions.number,
      questionTitle: questions.title,
      partId: questionParts.id,
      partLabel: questionParts.label,
      partPrompt: questionParts.prompt,
      partMarks: questionParts.marks,
      markingStatus: partAnswers.markingStatus,
      score: partAnswers.score,
      maxScore: partAnswers.maxScore,
      studentFeedback: partAnswers.studentFeedback
    })
    .from(questionParts)
    .innerJoin(questions, eq(questionParts.questionId, questions.id))
    .leftJoin(
      partAnswers,
      and(eq(partAnswers.questionPartId, questionParts.id), eq(partAnswers.attemptId, attemptId))
    )
    .where(eq(questionParts.paperVersionId, attempt.paperVersionId))
    .orderBy(asc(questions.position), asc(questionParts.position));

  const totalScore = rows.reduce((sum, row) => sum + (row.score ?? 0), 0);
  const pendingCount = rows.filter((row) => row.markingStatus !== "marked").length;

  return {
    attempt,
    paper,
    totalScore,
    pendingCount,
    parts: rows
  };
}

function parseAnswer(formData: FormData, partId: string, responseSchema: ResponseSchema | null) {
  if (responseSchema?.kind === "multiple_choice") {
    return {
      values: formData.getAll(`part-${partId}`).map(String)
    };
  }

  if (responseSchema?.kind === "code_output_table") {
    return {
      rows: Object.fromEntries(
        responseSchema.rows.map((row) => [
          row.id,
          String(formData.get(`part-${partId}-row-${row.id}`) ?? "")
        ])
      )
    };
  }

  if (responseSchema?.kind === "error_correction") {
    return {
      lineNumber: String(formData.get(`part-${partId}-line-number`) ?? ""),
      correctedLine: String(formData.get(`part-${partId}-corrected-line`) ?? "")
    };
  }

  return {
    value: String(formData.get(`part-${partId}`) ?? "")
  };
}

async function getStudentQuestionForSave(
  attemptId: string,
  questionNumber: number,
  session: StudentSession,
  db: Db
) {
  if (!Number.isInteger(questionNumber) || questionNumber < 1) {
    notFound();
  }

  const attempt = await getStudentAttempt(attemptId, session);

  if (!attempt || attempt.status !== "in_progress") {
    notFound();
  }

  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.paperVersionId, attempt.paperVersionId))
    .orderBy(asc(questions.position))
    .limit(1)
    .offset(questionNumber - 1);

  if (!question) {
    notFound();
  }

  const parts = await db
    .select()
    .from(questionParts)
    .where(
      and(
        eq(questionParts.paperVersionId, attempt.paperVersionId),
        eq(questionParts.questionId, question.id)
      )
    )
    .orderBy(asc(questionParts.position));

  return {
    attempt,
    question,
    parts,
    questionNumber
  };
}

async function updateStudentAttemptProgress(
  db: Db,
  attempt: AttemptRow,
  session: StudentSession,
  now: Date
) {
  const [updated] = await db
    .update(attempts)
    .set({
      lastSeenAt: now,
      elapsedSeconds: elapsedSinceStart(attempt, now)
    })
    .where(
      and(
        eq(attempts.id, attempt.id),
        eq(attempts.accessCodeId, session.accessCodeId),
        eq(attempts.normalizedStudentName, session.normalizedStudentName),
        or(isNull(attempts.sessionToken), eq(attempts.sessionToken, session.sessionToken)),
        eq(attempts.status, "in_progress")
      )
    )
    .returning();

  return updated ?? null;
}

async function persistFailedMark(
  db: Db,
  attemptId: string,
  question: QuestionRow,
  part: QuestionPartRow,
  answer: StudentAnswer,
  now: Date,
  error: unknown
) {
  const fields = buildPartAnswerMarkFields({
    answer,
    markedAt: now,
    result: {
      status: "failed",
      score: 0,
      maxScore: part.marks,
      studentFeedback: "This answer was saved, but marking is pending review.",
      tutorRationale: error instanceof Error ? error.message : "Marking failed.",
      missingRubricPoints: [],
      exactMarkingDetails: null
    }
  });

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
}

function elapsedSinceStart(attempt: AttemptRow, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000));
}

function isUniqueViolation(error: unknown) {
  let current: unknown = error;

  while (current && typeof current === "object") {
    if ((current as { code?: string }).code === "23505") {
      return true;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return false;
}

function defaultAnswer(responseSchema: ResponseSchema | null): StudentAnswer {
  if (responseSchema?.kind === "multiple_choice") {
    return { values: [] };
  }

  if (responseSchema?.kind === "code_output_table") {
    return {
      rows: Object.fromEntries(responseSchema.rows.map((row) => [row.id, ""]))
    };
  }

  if (responseSchema?.kind === "error_correction") {
    return {
      lineNumber: "",
      correctedLine: ""
    };
  }

  return { value: "" };
}
