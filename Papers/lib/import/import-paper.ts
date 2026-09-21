import "server-only";

import { and, desc, eq, max, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  accessCodes,
  paperAccessCodes,
  papers,
  paperVersions,
  questionParts,
  questions
} from "@/lib/db/schema";
import type { ImportedPaper } from "@/lib/domain";
import { hashAccessCode } from "@/lib/security";
import { summarizePaper } from "@/lib/import/k349-schema";

export type ImportResult = {
  paperId: string;
  versionNumber: number;
  summary: ReturnType<typeof summarizePaper>;
};

export async function importPaper(paper: ImportedPaper): Promise<ImportResult> {
  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx
      .insert(papers)
      .values({
        id: paper.paperId,
        title: paper.title,
        syllabus: paper.syllabus,
        mode: paper.mode,
        status: paper.status,
        totalMarks: paper.totalMarks,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: papers.id,
        set: {
          title: paper.title,
          syllabus: paper.syllabus,
          mode: paper.mode,
          status: paper.status,
          totalMarks: paper.totalMarks,
          updatedAt: now
        }
      });

    const [versionAggregate] = await tx
      .select({ currentMax: max(paperVersions.versionNumber) })
      .from(paperVersions)
      .where(eq(paperVersions.paperId, paper.paperId));

    const versionNumber = (versionAggregate?.currentMax ?? 0) + 1;

    const [version] = await tx
      .insert(paperVersions)
      .values({
        paperId: paper.paperId,
        versionNumber,
        sourceJson: paper,
        importedAt: now
      })
      .returning();

    await tx
      .update(papers)
      .set({
        currentVersionId: version.id,
        title: paper.title,
        syllabus: paper.syllabus,
        mode: paper.mode,
        status: paper.status,
        totalMarks: paper.totalMarks,
        updatedAt: now
      })
      .where(eq(papers.id, paper.paperId));

    // Dedupe by hash (last label wins); a multi-row upsert cannot touch the same row twice.
    const accessCodeRows = new Map<string, { codeHash: string; label: string }>();
    for (const accessCode of paper.accessCodes) {
      const codeHash = hashAccessCode(accessCode.code);
      accessCodeRows.set(codeHash, { codeHash, label: accessCode.label });
    }

    if (accessCodeRows.size > 0) {
      const storedCodes = await tx
        .insert(accessCodes)
        .values(
          [...accessCodeRows.values()].map(({ codeHash, label }) => ({
            codeHash,
            label,
            active: true,
            createdAt: now,
            updatedAt: now
          }))
        )
        .onConflictDoUpdate({
          target: accessCodes.codeHash,
          set: {
            label: sql`excluded.label`,
            updatedAt: now
          }
        })
        .returning({ id: accessCodes.id });

      const mappedAccessCodeIds = storedCodes.map((code) => code.id);

      await tx
        .delete(paperAccessCodes)
        .where(
          and(
            eq(paperAccessCodes.paperId, paper.paperId),
            notInArray(paperAccessCodes.accessCodeId, mappedAccessCodeIds)
          )
        );

      await tx
        .insert(paperAccessCodes)
        .values(
          mappedAccessCodeIds.map((accessCodeId) => ({
            paperId: paper.paperId,
            accessCodeId,
            createdAt: now
          }))
        )
        .onConflictDoNothing();
    }

    if (paper.questions.length > 0) {
      const storedQuestions = await tx
        .insert(questions)
        .values(
          paper.questions.map((question, questionIndex) => ({
            paperId: paper.paperId,
            paperVersionId: version.id,
            externalId: question.id,
            number: question.number,
            title: question.title,
            marks: question.marks,
            outcomeId: question.outcomeId,
            variantGroupId: question.variantGroupId,
            targetAnswerId: question.targetAnswerId,
            difficulty: question.difficulty,
            stimulus: question.stimulus ?? [],
            position: questionIndex
          }))
        )
        .returning({ id: questions.id, externalId: questions.externalId });

      const questionIdByExternalId = new Map(
        storedQuestions.map((question) => [question.externalId, question.id])
      );

      const partRows = paper.questions.flatMap((question) => {
        const questionId = questionIdByExternalId.get(question.id);
        if (!questionId) {
          throw new Error(`Inserted question '${question.id}' was not returned.`);
        }

        return question.parts.map((part, partIndex) => ({
          questionId,
          paperVersionId: version.id,
          externalId: part.id,
          label: part.label,
          type: part.type,
          prompt: part.prompt,
          marks: part.marks,
          outcomeId: part.outcomeId,
          variantGroupId: part.variantGroupId,
          targetAnswerId: part.targetAnswerId,
          difficulty: part.difficulty,
          stimulus: part.stimulus ?? [],
          responseSchema: part.response,
          markingSchema: part.marking,
          studentFeedbackPolicy: part.studentFeedbackPolicy,
          position: partIndex
        }));
      });

      if (partRows.length > 0) {
        await tx.insert(questionParts).values(partRows);
      }
    }

    return {
      paperId: paper.paperId,
      versionNumber,
      summary: summarizePaper(paper)
    };
  });
}

export async function listPaperVersions(paperId: string) {
  return getDb()
    .select()
    .from(paperVersions)
    .where(eq(paperVersions.paperId, paperId))
    .orderBy(desc(paperVersions.versionNumber));
}

export async function findAccessCodeByHash(codeHash: string) {
  const [accessCode] = await getDb()
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.codeHash, codeHash));

  return accessCode ?? null;
}
