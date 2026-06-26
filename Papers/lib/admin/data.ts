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
import type { MarkingSchema, Stimulus } from "@/lib/domain";
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
    questions: questionRows.map((question) => {
      const questionParts = partRows.filter((part) => part.questionId === question.id);
      const normalizedStimuli = moveQuestionCodeStimuliToTargetPart({
        questionNumber: question.number,
        questionStimulus: question.stimulus,
        parts: questionParts.map((part) => ({
          id: part.id,
          label: part.label,
          prompt: part.prompt,
          stimulus: part.stimulus
        }))
      });

      return {
        ...question,
        stimulus: normalizedStimuli.questionStimulus,
        title: displayQuestionTitle(question.title),
        parts: questionParts.map((part) => ({
          ...part,
          stimulus: normalizedStimuli.partStimulusById.get(part.id) ?? part.stimulus,
          markingSchema: normalizePartMarkingSchema({
            label: part.label,
            markingSchema: part.markingSchema
          }),
          answer: answersByPartId.get(part.id) ?? null
        }))
      };
    })
  };
}

function moveQuestionCodeStimuliToTargetPart({
  parts,
  questionNumber,
  questionStimulus
}: {
  parts: Array<{ id: string; label: string; prompt: string; stimulus: Stimulus[] }>;
  questionNumber: string;
  questionStimulus: Stimulus[];
}) {
  const partStimulusById = new Map(parts.map((part) => [part.id, part.stimulus]));

  if (questionNumber !== "2") {
    return { questionStimulus, partStimulusById };
  }

  const codeStimuli = questionStimulus.filter((stimulus) => stimulus.type === "code");

  if (!codeStimuli.length) {
    return { questionStimulus, partStimulusById };
  }

  const targetPart = parts.find(
    (part) =>
      part.label === "2(b)" ||
      /program.+execut/i.test(part.prompt) ||
      /identify one bug/i.test(part.prompt)
  );

  if (!targetPart || targetPart.stimulus.some((stimulus) => stimulus.type === "code")) {
    return { questionStimulus, partStimulusById };
  }

  partStimulusById.set(targetPart.id, [...codeStimuli, ...targetPart.stimulus]);

  return {
    questionStimulus: questionStimulus.filter((stimulus) => stimulus.type !== "code"),
    partStimulusById
  };
}

function displayQuestionTitle(title: string) {
  if (title === "Flowcharts And Code") {
    return "Team Qualification Algorithm";
  }

  if (title === "Flowcharts And Iteration") {
    return "Countdown Algorithm";
  }

  return title;
}

function normalizePartMarkingSchema({
  label,
  markingSchema
}: {
  label: string;
  markingSchema: MarkingSchema;
}): MarkingSchema {
  if (
    label === "4(b)" &&
    markingSchema.mode === "error_correction" &&
    String(markingSchema.expectedLineNumber) === "04" &&
    markingSchema.acceptedCorrectedLines.includes("    print(x)")
  ) {
    return {
      ...markingSchema,
      lineNumberMarks: 0,
      correctionMarks: 1
    };
  }

  return markingSchema;
}
