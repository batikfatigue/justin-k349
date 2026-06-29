import { describe, expect, it, vi } from "vitest";
import {
  manuallyOverrideAttemptPartMarkWithRepository,
  type ManualOverrideRepository
} from "@/lib/admin/manual-override";

vi.mock("server-only", () => ({}));

const now = new Date("2026-06-26T04:00:00.000Z");

const submittedAttempt = {
  id: "attempt-1",
  paperVersionId: "version-1",
  status: "submitted"
} as any;

const inProgressAttempt = {
  ...submittedAttempt,
  status: "in_progress"
} as any;

const part = {
  id: "part-1",
  paperVersionId: "version-1",
  marks: 2
} as any;

const answer = {
  id: "answer-1",
  attemptId: "attempt-1",
  questionPartId: "part-1",
  maxScore: 2
} as any;

describe("manual mark override", () => {
  it("updates a submitted saved answer when the score is in range", async () => {
    const repository = createRepository();

    const result = await manuallyOverrideAttemptPartMarkWithRepository(
      {
        attemptId: "attempt-1",
        questionPartId: "part-1",
        score: 2,
        studentFeedback: "  Updated feedback.  ",
        tutorRationale: "   "
      },
      repository,
      now
    );

    expect(result).toEqual({ ok: true, markedAt: now });
    expect(repository.getAttempt).toHaveBeenCalledWith("attempt-1");
    expect(repository.getPart).toHaveBeenCalledWith(submittedAttempt, "part-1");
    expect(repository.getAnswer).toHaveBeenCalledWith("attempt-1", "part-1");
    expect(repository.updateAnswerMark).toHaveBeenCalledWith({
      answer,
      markedAt: now,
      score: 2,
      studentFeedback: "Updated feedback.",
      tutorRationale: null
    });
  });

  it("rejects missing attempts before loading part or answer data", async () => {
    const repository = createRepository({ attempt: null });

    const result = await manuallyOverrideAttemptPartMarkWithRepository(
      makeInput(),
      repository,
      now
    );

    expect(result).toEqual({ ok: false, reason: "attempt_not_found" });
    expect(repository.getPart).not.toHaveBeenCalled();
    expect(repository.getAnswer).not.toHaveBeenCalled();
    expect(repository.updateAnswerMark).not.toHaveBeenCalled();
  });

  it("rejects attempts that are not submitted", async () => {
    const repository = createRepository({ attempt: inProgressAttempt });

    const result = await manuallyOverrideAttemptPartMarkWithRepository(
      makeInput(),
      repository,
      now
    );

    expect(result).toEqual({ ok: false, reason: "attempt_not_submitted" });
    expect(repository.getPart).not.toHaveBeenCalled();
    expect(repository.updateAnswerMark).not.toHaveBeenCalled();
  });

  it("rejects parts outside the attempt paper version", async () => {
    const repository = createRepository({ part: null });

    const result = await manuallyOverrideAttemptPartMarkWithRepository(
      makeInput(),
      repository,
      now
    );

    expect(result).toEqual({ ok: false, reason: "part_not_found" });
    expect(repository.getAnswer).not.toHaveBeenCalled();
    expect(repository.updateAnswerMark).not.toHaveBeenCalled();
  });

  it("rejects missing saved answers", async () => {
    const repository = createRepository({ answer: null });

    const result = await manuallyOverrideAttemptPartMarkWithRepository(
      makeInput(),
      repository,
      now
    );

    expect(result).toEqual({ ok: false, reason: "answer_not_found" });
    expect(repository.updateAnswerMark).not.toHaveBeenCalled();
  });

  it("rejects non-integer and out-of-range scores", async () => {
    for (const score of [-1, 1.5, 3]) {
      const repository = createRepository();

      const result = await manuallyOverrideAttemptPartMarkWithRepository(
        makeInput({ score }),
        repository,
        now
      );

      expect(result).toEqual({ ok: false, reason: "invalid_score" });
      expect(repository.updateAnswerMark).not.toHaveBeenCalled();
    }
  });
});

function makeInput(overrides: Partial<Parameters<typeof manuallyOverrideAttemptPartMarkWithRepository>[0]> = {}) {
  return {
    attemptId: "attempt-1",
    questionPartId: "part-1",
    score: 1,
    studentFeedback: "Updated feedback.",
    tutorRationale: "Tutor rationale.",
    ...overrides
  };
}

function createRepository({
  answer: answerOverride = answer,
  attempt = submittedAttempt,
  part: partOverride = part
}: {
  answer?: typeof answer | null;
  attempt?: typeof submittedAttempt | null;
  part?: typeof part | null;
} = {}) {
  return {
    getAttempt: vi.fn(async () => attempt),
    getPart: vi.fn(async () => partOverride),
    getAnswer: vi.fn(async () => answerOverride),
    updateAnswerMark: vi.fn(async () => undefined)
  } satisfies ManualOverrideRepository;
}
