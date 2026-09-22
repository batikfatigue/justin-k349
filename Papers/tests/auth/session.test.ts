import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cookieMocks = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    cookies: () => ({
      get: (name: string) => {
        const value = store.get(name);
        return value ? { name, value } : undefined;
      },
      set: (name: string, value: string) => {
        store.set(name, value);
      },
      delete: (name: string) => {
        store.delete(name);
      }
    })
  };
});

vi.mock("next/headers", () => ({ cookies: cookieMocks.cookies }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  }
}));

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ getDb: dbMocks.getDb }));

class FakeDb {
  rows: Record<string, unknown>[] = [];

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
}

async function importSession() {
  return import("@/lib/auth/session");
}

describe("tutor session credential binding", () => {
  let db: FakeDb;

  beforeEach(() => {
    vi.resetModules();
    cookieMocks.store.clear();
    process.env.SESSION_SECRET = "test-secret-key-with-32-plus-chars";
    process.env.TUTOR_PASSWORD_HASH = "hash-A";
    db = new FakeDb();
    dbMocks.getDb.mockReturnValue(db);
  });

  it("accepts a session while the configured credential is unchanged", async () => {
    const session = await importSession();
    session.setTutorSession();

    expect(session.getTutorSession()).toMatchObject({ kind: "tutor" });
  });

  it("rejects sessions after the tutor password credential rotates", async () => {
    const session = await importSession();
    session.setTutorSession();

    process.env.TUTOR_PASSWORD_HASH = "hash-B";
    vi.resetModules();
    const rotated = await importSession();

    expect(rotated.getTutorSession()).toBeNull();
  });

  it("rejects sessions when the tutor credential is no longer configured", async () => {
    const session = await importSession();
    session.setTutorSession();

    delete process.env.TUTOR_PASSWORD_HASH;
    vi.resetModules();
    const reimported = await importSession();

    expect(reimported.getTutorSession()).toBeNull();
  });
});

describe("student session access-code revocation", () => {
  let db: FakeDb;

  beforeEach(() => {
    vi.resetModules();
    cookieMocks.store.clear();
    process.env.SESSION_SECRET = "test-secret-key-with-32-plus-chars";
    db = new FakeDb();
    dbMocks.getDb.mockReturnValue(db);
  });

  it("returns the session while the access code remains active", async () => {
    const session = await importSession();
    session.setStudentSession("code-1", "Ada Lovelace");
    db.rows = [{ id: "code-1" }];

    await expect(session.getStudentSession()).resolves.toMatchObject({
      kind: "student",
      accessCodeId: "code-1"
    });
  });

  it("invalidates the session once the access code is deactivated or removed", async () => {
    const session = await importSession();
    session.setStudentSession("code-1", "Ada Lovelace");
    db.rows = [];

    await expect(session.getStudentSession()).resolves.toBeNull();
  });
});
