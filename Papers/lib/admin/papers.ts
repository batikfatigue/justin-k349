import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db/client";
import { accessCodes, attempts, paperAccessCodes, papers, paperVersions } from "@/lib/db/schema";
import type { ImportedPaper } from "@/lib/domain";

export type AdminPaperSummary = {
  id: string;
  title: string;
  syllabus: string;
  status: string;
  totalMarks: number;
  currentVersionNumber: number | null;
  lastImportedOrUpdatedAt: Date;
  attemptCount: number;
};

export type AdminPaperSource = {
  id: string;
  title: string;
  versionNumber: number;
  importedAt: Date;
  sourceJson: ImportedPaper;
};

export type DeleteAdminPaperResult =
  | {
      ok: true;
      paperId: string;
    }
  | {
      ok: false;
      reason: "not_found";
    }
  | {
      ok: false;
      reason: "stale_attempt_count";
      attemptCount: number;
      confirmedAttemptCount: number;
    };

export async function listAdminPapers(db: Db = getDb()): Promise<AdminPaperSummary[]> {
  const rows = await db
    .select({
      id: papers.id,
      title: papers.title,
      syllabus: papers.syllabus,
      status: papers.status,
      totalMarks: papers.totalMarks,
      updatedAt: papers.updatedAt,
      currentVersionNumber: paperVersions.versionNumber,
      currentVersionImportedAt: paperVersions.importedAt,
      attemptCount: sql<number>`count(${attempts.id})::int`
    })
    .from(papers)
    .leftJoin(paperVersions, eq(papers.currentVersionId, paperVersions.id))
    .leftJoin(attempts, eq(attempts.paperId, papers.id))
    .groupBy(
      papers.id,
      papers.title,
      papers.syllabus,
      papers.status,
      papers.totalMarks,
      papers.updatedAt,
      paperVersions.versionNumber,
      paperVersions.importedAt
    )
    .orderBy(desc(sql`coalesce(${paperVersions.importedAt}, ${papers.updatedAt})`), asc(papers.title));

  return rows.map((row) => {
    const attemptCount = numberFromCount(row.attemptCount);

    return {
      id: row.id,
      title: row.title,
      syllabus: row.syllabus,
      status: row.status,
      totalMarks: row.totalMarks,
      currentVersionNumber: row.currentVersionNumber,
      lastImportedOrUpdatedAt: row.currentVersionImportedAt ?? row.updatedAt,
      attemptCount
    };
  });
}

export async function getCurrentPaperSourceJson(
  paperId: string,
  db: Db = getDb()
): Promise<AdminPaperSource | null> {
  const [row] = await db
    .select({
      id: papers.id,
      title: papers.title,
      versionNumber: paperVersions.versionNumber,
      importedAt: paperVersions.importedAt,
      sourceJson: paperVersions.sourceJson
    })
    .from(papers)
    .innerJoin(paperVersions, eq(papers.currentVersionId, paperVersions.id))
    .where(eq(papers.id, paperId));

  return row ?? null;
}

export async function deleteAdminPaperWithConfirmation(
  paperId: string,
  confirmedAttemptCount: number,
  db: Db = getDb()
): Promise<DeleteAdminPaperResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: papers.id,
        attemptCount: sql<number>`count(${attempts.id})::int`
      })
      .from(papers)
      .leftJoin(attempts, eq(attempts.paperId, papers.id))
      .where(eq(papers.id, paperId))
      .groupBy(papers.id);

    if (!row) {
      return { ok: false, reason: "not_found" };
    }

    const attemptCount = numberFromCount(row.attemptCount);

    if (attemptCount !== confirmedAttemptCount) {
      return {
        ok: false,
        reason: "stale_attempt_count",
        attemptCount,
        confirmedAttemptCount
      };
    }

    const mappedAccessCodes = await tx
      .select({
        accessCodeId: paperAccessCodes.accessCodeId
      })
      .from(paperAccessCodes)
      .where(eq(paperAccessCodes.paperId, paperId));
    const accessCodeIds = mappedAccessCodes.map((accessCode) => accessCode.accessCodeId);

    await tx.delete(attempts).where(eq(attempts.paperId, paperId));
    await tx.delete(papers).where(eq(papers.id, paperId));

    if (accessCodeIds.length > 0) {
      await tx
        .delete(accessCodes)
        .where(
          and(
            inArray(accessCodes.id, accessCodeIds),
            sql`not exists (
              select 1
              from ${paperAccessCodes}
              where ${paperAccessCodes.accessCodeId} = ${accessCodes.id}
            )`
          )
        );
    }

    return { ok: true, paperId };
  });
}

function numberFromCount(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}
