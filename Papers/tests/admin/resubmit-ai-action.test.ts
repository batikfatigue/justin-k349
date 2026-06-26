import { beforeEach, describe, expect, it, vi } from "vitest";
import { resubmitAiMarkAction } from "@/app/admin/attempts/[attemptId]/actions";

const requireTutorSessionMock = vi.hoisted(() => vi.fn());
const resubmitAttemptPartToAiMarkingMock = vi.hoisted(() => vi.fn());
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
vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

describe("resubmitAiMarkAction", () => {
  beforeEach(() => {
    requireTutorSessionMock.mockReset();
    resubmitAttemptPartToAiMarkingMock.mockReset();
    redirectMock.mockClear();
    redirectMock.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it("requires a tutor session before loading attempt or answer details", async () => {
    requireTutorSessionMock.mockImplementation(() => {
      throw new Error("auth redirect");
    });

    await expect(resubmitAiMarkAction(new FormData())).rejects.toThrow("auth redirect");

    expect(resubmitAttemptPartToAiMarkingMock).not.toHaveBeenCalled();
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
});
