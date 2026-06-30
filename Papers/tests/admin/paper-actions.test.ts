import { beforeEach, describe, expect, it, vi } from "vitest";
import { deletePaperAction, updateSelectedPaperAction } from "@/app/admin/papers/actions";
import { initialPaperUpdateFormState } from "@/app/admin/papers/form-state";

const requireTutorSessionMock = vi.hoisted(() => vi.fn());
const parsePaperJsonTextMock = vi.hoisted(() => vi.fn());
const importPaperMock = vi.hoisted(() => vi.fn());
const deleteAdminPaperWithConfirmationMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  })
);

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({
  requireTutorSession: requireTutorSessionMock
}));
vi.mock("@/lib/import/k349-schema", () => ({
  parsePaperJsonText: parsePaperJsonTextMock
}));
vi.mock("@/lib/import/import-paper", () => ({
  importPaper: importPaperMock
}));
vi.mock("@/lib/admin/papers", () => ({
  deleteAdminPaperWithConfirmation: deleteAdminPaperWithConfirmationMock
}));
vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));
vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

describe("admin paper server actions", () => {
  beforeEach(() => {
    requireTutorSessionMock.mockReset();
    parsePaperJsonTextMock.mockReset();
    importPaperMock.mockReset();
    deleteAdminPaperWithConfirmationMock.mockReset();
    revalidatePathMock.mockReset();
    redirectMock.mockClear();
    redirectMock.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it("requires a tutor session before parsing update JSON", async () => {
    requireTutorSessionMock.mockImplementation(() => {
      throw new Error("auth redirect");
    });

    await expect(
      updateSelectedPaperAction("paper-1", initialPaperUpdateFormState, new FormData())
    ).rejects.toThrow("auth redirect");

    expect(parsePaperJsonTextMock).not.toHaveBeenCalled();
    expect(importPaperMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("rejects replacement JSON whose paperId does not match the selected paper", async () => {
    requireTutorSessionMock.mockReturnValue({ kind: "tutor" });
    parsePaperJsonTextMock.mockReturnValue({
      ok: true,
      paper: { paperId: "other-paper" },
      summary: makeSummary(),
      errors: []
    });
    const formData = new FormData();
    formData.set("paperJson", "{}");

    const result = await updateSelectedPaperAction("paper-1", initialPaperUpdateFormState, formData);

    expect(result).toMatchObject({
      status: "error",
      message: "The replacement JSON is for a different paper.",
      errors: ["Expected paperId 'paper-1', but received 'other-paper'."],
      jsonText: "{}"
    });
    expect(importPaperMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("reuses importPaper and redirects to paper management after a selected update", async () => {
    requireTutorSessionMock.mockReturnValue({ kind: "tutor" });
    const paper = { paperId: "paper-1" };
    parsePaperJsonTextMock.mockReturnValue({
      ok: true,
      paper,
      summary: makeSummary(),
      errors: []
    });
    importPaperMock.mockResolvedValue({
      paperId: "paper-1",
      versionNumber: 2,
      summary: makeSummary()
    });
    const formData = new FormData();
    formData.set("intent", "update");
    formData.set("paperJson", "{}");

    await expect(
      updateSelectedPaperAction("paper-1", initialPaperUpdateFormState, formData)
    ).rejects.toThrow("redirect:/admin/papers?updated=paper-1");

    expect(importPaperMock).toHaveBeenCalledWith(paper);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/papers");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/papers/paper-1");
  });

  it("requires a tutor session before deleting paper data", async () => {
    requireTutorSessionMock.mockImplementation(() => {
      throw new Error("auth redirect");
    });

    await expect(deletePaperAction(new FormData())).rejects.toThrow("auth redirect");

    expect(deleteAdminPaperWithConfirmationMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects with success after deleting a zero-attempt paper", async () => {
    requireTutorSessionMock.mockReturnValue({ kind: "tutor" });
    deleteAdminPaperWithConfirmationMock.mockResolvedValue({ ok: true, paperId: "paper-1" });
    const formData = new FormData();
    formData.set("paperId", "paper-1");
    formData.set("confirmedAttemptCount", "0");

    await expect(deletePaperAction(formData)).rejects.toThrow(
      "redirect:/admin/papers?deleted=paper-1"
    );

    expect(deleteAdminPaperWithConfirmationMock).toHaveBeenCalledWith("paper-1", 0);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/papers");
  });

  it("redirects with success after deleting a confirmed paper with attempts", async () => {
    requireTutorSessionMock.mockReturnValue({ kind: "tutor" });
    deleteAdminPaperWithConfirmationMock.mockResolvedValue({ ok: true, paperId: "paper-1" });
    const formData = new FormData();
    formData.set("paperId", "paper-1");
    formData.set("confirmedAttemptCount", "2");

    await expect(deletePaperAction(formData)).rejects.toThrow(
      "redirect:/admin/papers?deleted=paper-1"
    );

    expect(deleteAdminPaperWithConfirmationMock).toHaveBeenCalledWith("paper-1", 2);
  });

  it("redirects with a stale deletion reason when the attempt count changed", async () => {
    requireTutorSessionMock.mockReturnValue({ kind: "tutor" });
    deleteAdminPaperWithConfirmationMock.mockResolvedValue({
      ok: false,
      reason: "stale_attempt_count",
      attemptCount: 3,
      confirmedAttemptCount: 2
    });
    const formData = new FormData();
    formData.set("paperId", "paper-1");
    formData.set("confirmedAttemptCount", "2");

    await expect(deletePaperAction(formData)).rejects.toThrow(
      "redirect:/admin/papers?delete=blocked&paperId=paper-1&reason=stale_attempt_count&attempts=3&confirmed=2"
    );
  });
});

function makeSummary() {
  return {
    title: "Practice Paper",
    syllabus: "K349",
    accessCodeCount: 1,
    questionCount: 1,
    partCount: 1,
    totalMarks: 1
  };
}
