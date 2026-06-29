import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  manualOverrideMarkAction,
  resubmitAiMarkAction
} from "@/app/admin/attempts/[attemptId]/actions";

const requireTutorSessionMock = vi.hoisted(() => vi.fn());
const resubmitAttemptPartToAiMarkingMock = vi.hoisted(() => vi.fn());
const manuallyOverrideAttemptPartMarkMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  })
);

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({
  requireTutorSession: requireTutorSessionMock
}));
vi.mock("@/lib/admin/ai-remark", () => ({
  resubmitAttemptPartToAiMarking: resubmitAttemptPartToAiMarkingMock
}));
vi.mock("@/lib/admin/manual-override", () => ({
  manuallyOverrideAttemptPartMark: manuallyOverrideAttemptPartMarkMock
}));
vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

describe("admin attempt server actions", () => {
  beforeEach(() => {
    requireTutorSessionMock.mockReset();
    resubmitAttemptPartToAiMarkingMock.mockReset();
    manuallyOverrideAttemptPartMarkMock.mockReset();
    redirectMock.mockClear();
    redirectMock.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it("requires a tutor session before loading attempt or answer details for AI remarking", async () => {
    requireTutorSessionMock.mockImplementation(() => {
      throw new Error("auth redirect");
    });

    await expect(resubmitAiMarkAction(new FormData())).rejects.toThrow("auth redirect");

    expect(resubmitAttemptPartToAiMarkingMock).not.toHaveBeenCalled();
    expect(manuallyOverrideAttemptPartMarkMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects back to the attempt detail page with a success outcome", async () => {
    requireTutorSessionMock.mockReturnValue({ kind: "tutor" });
    resubmitAttemptPartToAiMarkingMock.mockResolvedValue({
      ok: true,
      status: "marked",
      markedAt: new Date("2026-06-26T04:00:00.000Z")
    });
    const formData = new FormData();
    formData.set("attemptId", "attempt-1");
    formData.set("questionPartId", "part-ai");

    await expect(resubmitAiMarkAction(formData)).rejects.toThrow(
      "redirect:/admin/attempts/attempt-1?remark=success"
    );

    expect(requireTutorSessionMock.mock.invocationCallOrder[0]).toBeLessThan(
      resubmitAttemptPartToAiMarkingMock.mock.invocationCallOrder[0]
    );
    expect(resubmitAttemptPartToAiMarkingMock).toHaveBeenCalledWith("attempt-1", "part-ai");
  });

  it("requires a tutor session before loading attempt or answer details for manual overrides", async () => {
    requireTutorSessionMock.mockImplementation(() => {
      throw new Error("auth redirect");
    });

    await expect(manualOverrideMarkAction(new FormData())).rejects.toThrow("auth redirect");

    expect(manuallyOverrideAttemptPartMarkMock).not.toHaveBeenCalled();
    expect(resubmitAttemptPartToAiMarkingMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects back to the attempt detail page with a manual override success outcome", async () => {
    requireTutorSessionMock.mockReturnValue({ kind: "tutor" });
    manuallyOverrideAttemptPartMarkMock.mockResolvedValue({
      ok: true,
      markedAt: new Date("2026-06-26T04:00:00.000Z")
    });
    const formData = new FormData();
    formData.set("attemptId", "attempt-1");
    formData.set("questionPartId", "part-ai");
    formData.set("score", "2");
    formData.set("studentFeedback", "Updated feedback.");
    formData.set("tutorRationale", "Updated rationale.");

    await expect(manualOverrideMarkAction(formData)).rejects.toThrow(
      "redirect:/admin/attempts/attempt-1?override=success"
    );

    expect(requireTutorSessionMock.mock.invocationCallOrder[0]).toBeLessThan(
      manuallyOverrideAttemptPartMarkMock.mock.invocationCallOrder[0]
    );
    expect(manuallyOverrideAttemptPartMarkMock).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      questionPartId: "part-ai",
      score: 2,
      studentFeedback: "Updated feedback.",
      tutorRationale: "Updated rationale."
    });
  });

  it("redirects back to the attempt detail page with a manual override failure reason", async () => {
    requireTutorSessionMock.mockReturnValue({ kind: "tutor" });
    manuallyOverrideAttemptPartMarkMock.mockResolvedValue({
      ok: false,
      reason: "invalid_score"
    });
    const formData = new FormData();
    formData.set("attemptId", "attempt-1");
    formData.set("questionPartId", "part-ai");
    formData.set("score", "9");

    await expect(manualOverrideMarkAction(formData)).rejects.toThrow(
      "redirect:/admin/attempts/attempt-1?override=failed&overrideReason=invalid_score"
    );
  });
});
