import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: () => ({
    get: (name: string) => (name === "x-forwarded-for" ? "203.0.113.10, 10.0.0.1" : null)
  })
}));

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ getDb: dbMocks.getDb }));

class FakeDb {
  rows: Record<string, unknown>[] = [];
  insertedValues: Record<string, unknown>[] = [];
  conflictSets: Record<string, unknown>[] = [];
  insertedTable: unknown = null;
  deleteCalls = 0;

  select() {
    const db = this;
    return {
      from(_table: unknown) {
        return this;
      },
      where(_condition: unknown) {
        return Promise.resolve(db.rows);
      }
    };
  }

  insert(table: unknown) {
    const db = this;
    db.insertedTable = table;
    return {
      values(payload: Record<string, unknown>) {
        db.insertedValues.push(payload);
        return this;
      },
      onConflictDoUpdate(config: { set: Record<string, unknown> }) {
        db.conflictSets.push(config.set);
        return Promise.resolve();
      }
    };
  }

  delete(table: unknown) {
    const db = this;
    void table;
    return {
      where(_condition: unknown) {
        db.deleteCalls += 1;
        return Promise.resolve();
      }
    };
  }
}

async function importThrottle() {
  return import("@/lib/auth/throttle");
}

describe("credential throttling", () => {
  let db: FakeDb;

  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-secret-key-with-32-plus-chars";
    db = new FakeDb();
    dbMocks.getDb.mockReturnValue(db);
  });

  it("does not throttle when no failures are recorded", async () => {
    const { isThrottled } = await importThrottle();
    await expect(isThrottled("tutor")).resolves.toBe(false);
  });

  it("counts failures inside the active window without locking early", async () => {
    const { recordFailure, MAX_FAILURES } = await importThrottle();
    const now = new Date("2026-09-22T12:00:00.000Z");
    db.rows = [
      {
        key: "k",
        failureCount: MAX_FAILURES - 2,
        windowStartedAt: new Date(now.getTime() - 60_000),
        lockedUntil: null
      }
    ];

    await recordFailure("tutor", now);

    expect(db.insertedValues[0]).toMatchObject({ failureCount: MAX_FAILURES - 1 });
    expect(db.conflictSets[0]).toMatchObject({
      failureCount: MAX_FAILURES - 1,
      lockedUntil: null
    });
  });

  it("locks after reaching the failure threshold", async () => {
    const { recordFailure, isThrottled, MAX_FAILURES, COOLDOWN_MS } = await importThrottle();
    const now = new Date("2026-09-22T12:00:00.000Z");
    db.rows = [
      {
        key: "k",
        failureCount: MAX_FAILURES - 1,
        windowStartedAt: new Date(now.getTime() - 60_000),
        lockedUntil: null
      }
    ];

    await recordFailure("tutor", now);

    expect(db.conflictSets[0].failureCount).toBe(MAX_FAILURES);
    expect(db.conflictSets[0].lockedUntil).toEqual(new Date(now.getTime() + COOLDOWN_MS));

    db.rows = [{ key: "k", lockedUntil: new Date(now.getTime() + COOLDOWN_MS) }];
    await expect(isThrottled("tutor", now)).resolves.toBe(true);
    await expect(isThrottled("tutor", new Date(now.getTime() + COOLDOWN_MS + 1))).resolves.toBe(false);
  });

  it("resets the count after the window expires", async () => {
    const { recordFailure, COOLDOWN_MS } = await importThrottle();
    const now = new Date("2026-09-22T12:00:00.000Z");
    const windowStartedAt = new Date(now.getTime() - COOLDOWN_MS - 1);
    db.rows = [{ key: "k", failureCount: 4, windowStartedAt, lockedUntil: null }];

    await recordFailure("access-code", now);

    expect(db.conflictSets[0]).toMatchObject({
      failureCount: 1,
      windowStartedAt: now,
      lockedUntil: null
    });
  });

  it("clears recorded failures on success", async () => {
    const { clearFailures } = await importThrottle();

    await clearFailures("tutor");

    expect(db.deleteCalls).toBe(1);
  });

  it("derives distinct client keys per scope from the forwarded IP", async () => {
    const { getClientKey } = await importThrottle();

    expect(getClientKey("tutor")).not.toBe(getClientKey("access-code"));
  });
});
