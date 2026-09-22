import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  })
);
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const throttleMocks = vi.hoisted(() => ({
  isThrottled: vi.fn(),
  recordFailure: vi.fn(),
  clearFailures: vi.fn()
}));
vi.mock("@/lib/auth/throttle", () => throttleMocks);

const passwordMocks = vi.hoisted(() => ({ verifyTutorPassword: vi.fn() }));
vi.mock("@/lib/auth/password", () => passwordMocks);

const sessionMocks = vi.hoisted(() => ({
  setTutorSession: vi.fn(),
  clearTutorSession: vi.fn(),
  setStudentSession: vi.fn(),
  clearStudentSession: vi.fn(),
  requireStudentSession: vi.fn()
}));
vi.mock("@/lib/auth/session", () => sessionMocks);

const dataMocks = vi.hoisted(() => ({
  resolveAccessCode: vi.fn(),
  createStudentAttempt: vi.fn(),
  saveQuestionAnswers: vi.fn(),
  submitStudentAttempt: vi.fn()
}));
vi.mock("@/lib/student/data", () => dataMocks);

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe("tutor login throttling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    throttleMocks.isThrottled.mockResolvedValue(false);
    passwordMocks.verifyTutorPassword.mockResolvedValue({ ok: true });
  });

  it("rejects sign-in during cooldown without checking the password", async () => {
    const { loginTutorAction } = await import("@/app/admin/login/actions");
    throttleMocks.isThrottled.mockResolvedValue(true);

    await expect(loginTutorAction(formData({ password: "correct" }))).rejects.toMatchObject({
      url: "/admin/login?error=throttled"
    });
    expect(passwordMocks.verifyTutorPassword).not.toHaveBeenCalled();
  });

  it("records a failure on an invalid password", async () => {
    const { loginTutorAction } = await import("@/app/admin/login/actions");
    passwordMocks.verifyTutorPassword.mockResolvedValue({ ok: false, reason: "invalid" });

    await expect(loginTutorAction(formData({ password: "wrong" }))).rejects.toMatchObject({
      url: "/admin/login?error=invalid"
    });
    expect(throttleMocks.recordFailure).toHaveBeenCalledWith("tutor");
  });

  it("clears failures and creates a session on success", async () => {
    const { loginTutorAction } = await import("@/app/admin/login/actions");

    await expect(loginTutorAction(formData({ password: "correct" }))).rejects.toMatchObject({
      url: "/admin/import"
    });
    expect(throttleMocks.clearFailures).toHaveBeenCalledWith("tutor");
    expect(sessionMocks.setTutorSession).toHaveBeenCalled();
  });
});

describe("student access-code throttling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    throttleMocks.isThrottled.mockResolvedValue(false);
    dataMocks.resolveAccessCode.mockResolvedValue({ id: "code-1" });
  });

  it("refuses a valid code during cooldown without checking it", async () => {
    const { enterStudentAccessAction } = await import("@/lib/student/actions");
    throttleMocks.isThrottled.mockResolvedValue(true);

    await expect(
      enterStudentAccessAction(formData({ accessCode: "VALID1", studentName: "Ada" }))
    ).rejects.toMatchObject({ url: "/?error=throttled" });
    expect(dataMocks.resolveAccessCode).not.toHaveBeenCalled();
  });

  it("records a failure on an invalid or inactive code", async () => {
    const { enterStudentAccessAction } = await import("@/lib/student/actions");
    dataMocks.resolveAccessCode.mockResolvedValue(null);

    await expect(
      enterStudentAccessAction(formData({ accessCode: "BAD", studentName: "Ada" }))
    ).rejects.toMatchObject({ url: "/?error=access" });
    expect(throttleMocks.recordFailure).toHaveBeenCalledWith("access-code");
  });

  it("clears failures and creates a session on success", async () => {
    const { enterStudentAccessAction } = await import("@/lib/student/actions");

    await expect(
      enterStudentAccessAction(formData({ accessCode: "VALID1", studentName: "Ada" }))
    ).rejects.toMatchObject({ url: "/" });
    expect(throttleMocks.clearFailures).toHaveBeenCalledWith("access-code");
    expect(sessionMocks.setStudentSession).toHaveBeenCalledWith("code-1", "Ada");
  });
});
