import { describe, expect, it, vi } from "vitest";
import { resubmitAttemptPartToAiMarkingWithRepository } from "@/lib/admin/ai-remark";
import { markAndPersistPartAnswer } from "@/lib/marking/attempt";

vi.mock("server-only", () => ({}));

const now = new Date("2026-06-26T04:00:00.000Z");

const attempt = {
  id: "attempt-1",
  paperVersionId: "version-1",
  status: "submitted"
} as any;

const question = {
  id: "question-1",
  paperVersionId: "version-1",
  stimulus: []
} as any;

const rubricPart = {
  id: "part-ai",
  questionId: "question-1",
  paperVersionId: "version-1",
  label: "1(b)",
  type: "structured_response",
  prompt: "Explain how short sprint cycles help.",
  marks: 2,
  stimulus: [],
  markingSchema: {
    mode: "rubric_ai",
    maxScore: 2,
    modelAnswer: "Short iterations let teams incorporate changed requirements.",
    rubricPoints: [
      { text: "Mentions short repeated stages or iterations.", marks: 1 },
      { text: "Explains that changes can be handled in a later sprint.", marks: 1 }
    ]
  }
} as any;

const exactPart = {
  ...rubricPart,
  id: "part-exact",
  markingSchema: {
    mode: "exact",
    acceptedAnswers: ["scrum"],
    caseSensitive: false
  }
} as any;

const answer = {
  id: "answer-1",
  attemptId: "attempt-1",
  questionId: "question-1",
  questionPartId: "part-ai",
  answer: { value: "Teams can adapt in the next sprint." },
  score: 0,
  maxScore: 2,
  markingStatus: "failed",
  studentFeedback: "Old feedback",
  tutorRationale: "Old rationale",
  missingRubricPoints: ["Old missing point"],
  exactMarkingDetails: null,
  markedAt: new Date("2026-06-25T04:00:00.000Z"),
  updatedAt: new Date("2026-06-25T04:00:00.000Z")
} as any;

describe("AI remarking", () => {
  it("replaces stored mark fields after successful tutor-triggered AI remarking", async () => {
    const { db, calls } = createInsertCaptureDb();

    await markAndPersistPartAnswer({
      answer: answer.answer,
      attemptId: attempt.id,
      db: db as any,
      now,
      part: rubricPart,
      question,
      generateGemini: async () =>
        JSON.stringify({
          score: 2,
          maxScore: 2,
          studentFeedback: "Good explanation of iterative change.",
          tutorRationale: "Mentions short cycles and handling changed requirements.",
          missingRubricPoints: []
        })
    });

    expect(calls.values).toMatchObject({
      attemptId: attempt.id,
      questionId: question.id,
      questionPartId: rubricPart.id,
      answer: answer.answer,
      score: 2,
      maxScore: 2,
      markingStatus: "marked",
      studentFeedback: "Good explanation of iterative change.",
      tutorRationale: "Mentions short cycles and handling changed requirements.",
      missingRubricPoints: [],
      exactMarkingDetails: null,
      markedAt: now,
      updatedAt: now
    });
    expect(calls.set).toMatchObject({
      answer: answer.answer,
      score: 2,
      maxScore: 2,
      markingStatus: "marked",
      studentFeedback: "Good explanation of iterative change.",
      tutorRationale: "Mentions short cycles and handling changed requirements.",
      missingRubricPoints: [],
      exactMarkingDetails: null,
      markedAt: now,
      updatedAt: now
    });
  });

  it("stores Gemini failures as failed marks without changing answer or attempt status", async () => {
    const { db, calls } = createInsertCaptureDb();

    await markAndPersistPartAnswer({
      answer: answer.answer,
      attemptId: attempt.id,
      db: db as any,
      now,
      part: rubricPart,
      question,
      generateGemini: async () => {
        throw new Error("Gemini unavailable");
      }
    });

    expect(calls.values).toMatchObject({
      answer: answer.answer,
      markingStatus: "failed",
      score: 0,
      maxScore: 2,
      studentFeedback: "This answer was saved, but marking is pending review.",
      tutorRationale: "Gemini unavailable",
      markedAt: now,
      updatedAt: now
    });
    expect(calls.update).not.toHaveBeenCalled();
  });

  it("does not call the marker for ineligible non-AI parts", async () => {
    const markPart = vi.fn();
    const result = await resubmitAttemptPartToAiMarkingWithRepository(
      {
        attemptId: attempt.id,
        questionPartId: exactPart.id
      },
      {
        getAttempt: async () => attempt,
        getPartWithQuestion: async () => ({ question, part: exactPart }),
        getAnswer: async () => answer,
        markPart
      }
    );

    expect(result).toEqual({ ok: false, reason: "part_not_ai" });
    expect(markPart).not.toHaveBeenCalled();
  });
});

function createInsertCaptureDb() {
  const calls = {
    values: undefined as unknown,
    set: undefined as unknown,
    update: vi.fn()
  };
  const db = {
    insert: vi.fn(() => ({
      values: vi.fn((values) => {
        calls.values = values;

        return {
          onConflictDoUpdate: vi.fn((config) => {
            calls.set = config.set;
            return Promise.resolve();
          })
        };
      })
    })),
    update: calls.update
  };

  return { db, calls };
}
