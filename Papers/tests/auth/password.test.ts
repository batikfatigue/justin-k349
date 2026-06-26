import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("tutor password verification", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.TUTOR_PASSWORD_HASH;
  });

  it("reports missing or malformed tutor hashes as configuration errors", async () => {
    const { verifyTutorPassword } = await import("@/lib/auth/password");

    await expect(verifyTutorPassword("password")).resolves.toEqual({
      ok: false,
      reason: "misconfigured"
    });

    process.env.TUTOR_PASSWORD_HASH = "not-a-bcrypt-hash";
    const malformed = await import("@/lib/auth/password");

    await expect(malformed.verifyTutorPassword("password")).resolves.toEqual({
      ok: false,
      reason: "misconfigured"
    });
  });

  it("matches a valid bcrypt tutor hash", async () => {
    process.env.TUTOR_PASSWORD_HASH = await bcrypt.hash("correct-password", 4);
    const { verifyTutorPassword } = await import("@/lib/auth/password");

    await expect(verifyTutorPassword("correct-password")).resolves.toEqual({ ok: true });
    await expect(verifyTutorPassword("wrong-password")).resolves.toEqual({
      ok: false,
      reason: "invalid"
    });
  });
});
