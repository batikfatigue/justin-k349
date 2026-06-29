import "server-only";

import { and, asc, eq, inArray, max, sql } from "drizzle-orm";
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
import { markAndPersistPartAnswer } from "@/lib/marking/attempt";
import {
  displayQuestionTitle,
  moveQuestionCodeStimuliToTargetPart,
  normalizeChoicePart
} from "@/lib/paper/presentation";
import { hashAccessCode } from "@/lib/security";
import type { StudentSession } from "@/lib/auth/session";

export async function resolveAccessCode(code: string) {
  const [accessCode] = await getDb()
    .select()
    .from(accessCodes)
    .where(and(eq(accessCodes.codeHash, hashAccessCode(code)), eq(accessCodes.active, true)));

  return accessCode ?? null;
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

  if (!paper?.currentVersionId) {
    notFound();
  }

  const [created] = await getDb()
    .insert(attempts)
    .values({
      paperId,
      paperVersionId: paper.currentVersionId,
      accessCodeId: session.accessCodeId,
      studentName: session.studentName,
      normalizedStudentName: session.normalizedStudentName,
      attemptNumber: paper.nextAttemptNumber,
      status: "in_progress",
      elapsedSeconds: 0
    })
    .returning();

  return created;
}

export async function getStudentAttempt(attemptId: string, session: StudentSession) {
  const [attempt] = await getDb()
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.accessCodeId, session.accessCodeId),
        eq(attempts.normalizedStudentName, session.normalizedStudentName)
      )
    );

  return attempt ?? null;
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
  const normalizedStimuli = moveQuestionCodeStimuliToTargetPart({
    questionNumber: question.number,
    questionStimulus: question.stimulus,
    parts: parts.map((part) => ({
      id: part.id,
      label: part.label,
      prompt: part.prompt,
      stimulus: part.stimulus
    }))
  });

  return {
    attempt,
    paper,
    question: {
      id: question.id,
      number: question.number,
      title: displayQuestionTitle(question.title),
      marks: question.marks,
      stimulus: normalizedStimuli.questionStimulus,
      position: question.position
    },
    parts: parts.map((part) => {
      const partStimulus = normalizedStimuli.partStimulusById.get(part.id) ?? part.stimulus;
      const normalizedPart = normalizeChoicePart({
        prompt: part.prompt,
        stimulus: partStimulus,
        responseSchema: part.responseSchema
      });

      return {
        id: part.id,
        label: part.label,
        type: part.type,
        prompt: part.prompt,
        marks: part.marks,
        stimulus: normalizedPart.stimulus,
        responseSchema: normalizedPart.responseSchema,
        studentFeedbackPolicy: part.studentFeedbackPolicy,
        answer: answerByPartId.get(part.id)?.answer ?? defaultAnswer(normalizedPart.responseSchema)
      };
    }),
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

  await updateStudentAttemptProgress(
    db,
    attemptId,
    session,
    Number(formData.get("elapsedSeconds") ?? 0),
    now
  );

  return safeQuestion;
}

export async function updateStudentHeartbeat(
  attemptId: string,
  session: StudentSession,
  elapsedSeconds: number
) {
  return updateStudentAttemptProgress(getDb(), attemptId, session, elapsedSeconds, new Date());
}

export async function submitStudentAttempt(
  attemptId: string,
  elapsedSeconds: number,
  session: StudentSession
) {
  const attempt = await getStudentAttempt(attemptId, session);

  if (!attempt) {
    notFound();
  }

  const db = getDb();
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
  const now = new Date();

  for (const part of allParts) {
    const question = questionById.get(part.questionId);

    if (!question) {
      continue;
    }

    const savedAnswer = answerByPartId.get(part.id);
    const answer = savedAnswer?.answer ?? defaultAnswer(part.responseSchema);

    await markAndPersistPartAnswer({
      answer,
      attemptId,
      db,
      now,
      part,
      question
    });
  }

  const [submitted] = await db
    .update(attempts)
    .set({
      status: "submitted",
      submittedAt: now,
      lastSeenAt: now,
      elapsedSeconds: Math.max(0, Math.floor(elapsedSeconds || attempt.elapsedSeconds))
    })
    .where(eq(attempts.id, attemptId))
    .returning();

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

  const [attempt] = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.accessCodeId, session.accessCodeId),
        eq(attempts.normalizedStudentName, session.normalizedStudentName),
        eq(attempts.status, "in_progress")
      )
    );

  if (!attempt) {
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
  attemptId: string,
  session: StudentSession,
  elapsedSeconds: number,
  now: Date
) {
  const [updated] = await db
    .update(attempts)
    .set({
      lastSeenAt: now,
      elapsedSeconds: Math.max(0, Math.floor(elapsedSeconds || 0))
    })
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.accessCodeId, session.accessCodeId),
        eq(attempts.normalizedStudentName, session.normalizedStudentName),
        eq(attempts.status, "in_progress")
      )
    )
    .returning();

  return updated ?? null;
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
