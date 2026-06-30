import { describe, expect, it, vi } from "vitest";
import { deleteAdminPaperWithConfirmation } from "@/lib/admin/papers";
import { accessCodes, attempts, papers } from "@/lib/db/schema";

vi.mock("server-only", () => ({}));

describe("admin paper delete helper", () => {
  it("deletes a zero-attempt paper inside a transaction", async () => {
    const { db, tx } = createDeleteDb({
      rows: [{ id: "paper-1", attemptCount: 0 }]
    });

    await expect(deleteAdminPaperWithConfirmation("paper-1", 0, db as any)).resolves.toEqual({
      ok: true,
      paperId: "paper-1"
    });

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(tx.delete).toHaveBeenNthCalledWith(1, attempts);
    expect(tx.delete).toHaveBeenNthCalledWith(2, papers);
  });

  it("deletes a confirmed paper with attempts", async () => {
    const { db, tx } = createDeleteDb({
      rows: [{ id: "paper-1", attemptCount: "2" }]
    });

    await expect(deleteAdminPaperWithConfirmation("paper-1", 2, db as any)).resolves.toEqual({
      ok: true,
      paperId: "paper-1"
    });

    expect(tx.delete).toHaveBeenNthCalledWith(1, attempts);
    expect(tx.delete).toHaveBeenNthCalledWith(2, papers);
  });

  it("rejects stale attempt-count confirmations without deleting data", async () => {
    const { db, tx } = createDeleteDb({
      rows: [{ id: "paper-1", attemptCount: "3" }]
    });

    await expect(deleteAdminPaperWithConfirmation("paper-1", 2, db as any)).resolves.toEqual({
      ok: false,
      reason: "stale_attempt_count",
      attemptCount: 3,
      confirmedAttemptCount: 2
    });

    expect(tx.delete).not.toHaveBeenCalled();
  });

  it("cleans up mapped access codes after deleting the paper", async () => {
    const { db, tx } = createDeleteDb({
      rows: [{ id: "paper-1", attemptCount: 0 }],
      accessCodeRows: [{ accessCodeId: "code-1" }]
    });

    await expect(deleteAdminPaperWithConfirmation("paper-1", 0, db as any)).resolves.toEqual({
      ok: true,
      paperId: "paper-1"
    });

    expect(tx.delete).toHaveBeenNthCalledWith(3, accessCodes);
  });
});

function createDeleteDb({
  accessCodeRows = [],
  rows
}: {
  accessCodeRows?: unknown[];
  rows: unknown[];
}) {
  const countBuilder = {
    from: vi.fn(() => countBuilder),
    leftJoin: vi.fn(() => countBuilder),
    where: vi.fn(() => countBuilder),
    groupBy: vi.fn(async () => rows)
  };
  const accessCodeBuilder = {
    from: vi.fn(() => accessCodeBuilder),
    where: vi.fn(async () => accessCodeRows)
  };
  const deleteBuilder = {
    where: vi.fn(async () => undefined)
  };
  const tx = {
    select: vi.fn((selection: Record<string, unknown>) =>
      "attemptCount" in selection ? countBuilder : accessCodeBuilder
    ),
    delete: vi.fn(() => deleteBuilder)
  };
  const db = {
    transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx))
  };

  return { db, tx };
}
