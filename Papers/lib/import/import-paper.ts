import "server-only";

import { and, desc, eq, max, notInArray } from "drizzle-orm";
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

    const mappedAccessCodeIds: string[] = [];

    for (const accessCode of paper.accessCodes) {
      const codeHash = hashAccessCode(accessCode.code);
      const [storedCode] = await tx
        .insert(accessCodes)
        .values({
          codeHash,
          label: accessCode.label,
          active: true,
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: accessCodes.codeHash,
          set: {
            label: accessCode.label,
            active: true,
            updatedAt: now
          }
        })
        .returning();

      mappedAccessCodeIds.push(storedCode.id);

      await tx
        .insert(paperAccessCodes)
        .values({
          paperId: paper.paperId,
          accessCodeId: storedCode.id,
          createdAt: now
        })
        .onConflictDoNothing();
    }

    if (mappedAccessCodeIds.length > 0) {
      await tx
        .delete(paperAccessCodes)
        .where(
          and(
            eq(paperAccessCodes.paperId, paper.paperId),
            notInArray(paperAccessCodes.accessCodeId, mappedAccessCodeIds)
          )
        );

      for (const accessCodeId of mappedAccessCodeIds) {
        await tx
          .insert(paperAccessCodes)
          .values({ paperId: paper.paperId, accessCodeId, createdAt: now })
          .onConflictDoNothing();
      }
    }

    for (const [questionIndex, question] of paper.questions.entries()) {
      const [storedQuestion] = await tx
        .insert(questions)
        .values({
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
        })
        .returning();

      for (const [partIndex, part] of question.parts.entries()) {
        await tx.insert(questionParts).values({
          questionId: storedQuestion.id,
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
        });
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
