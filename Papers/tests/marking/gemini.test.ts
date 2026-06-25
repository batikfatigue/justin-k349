import { describe, expect, it } from "vitest";
import { buildGeminiPrompt, requestGeminiMark } from "@/lib/marking/gemini";
import { markPartAnswer } from "@/lib/marking/mark";

const rubricMarking = {
  mode: "rubric_ai" as const,
  modelAnswer: "Use an if statement and print End after the selection.",
  rubricPoints: [
    { text: "Uses if.", marks: 1 },
    { text: "Prints End.", marks: 1 }
  ],
  maxScore: 2
};

describe("Gemini marking", () => {
  it("validates structured output", async () => {
    const result = await requestGeminiMark(
      {
        prompt: "Write code from the flowchart.",
        visibleStimuli: [],
        studentAnswer: { value: "if rank <= 3:\n    print('yes')\nprint('End')" },
        marking: rubricMarking,
        maxScore: 2
      },
      async () =>
        JSON.stringify({
          score: 2,
          maxScore: 2,
          studentFeedback: "This is a strong response with the main control flow present.",
          tutorRationale: "The answer uses selection and prints End after the branch.",
          missingRubricPoints: []
        })
    );

    expect(result.score).toBe(2);
  });

  it("fails malformed output without trusting feedback", async () => {
    await expect(
      requestGeminiMark(
        {
          prompt: "Explain agile.",
          visibleStimuli: [],
          studentAnswer: { value: "short cycles" },
          marking: rubricMarking,
          maxScore: 2
        },
        async () => JSON.stringify({ score: 9 })
      )
    ).rejects.toThrow();
  });

  it("stores AI failures as failed marking states", async () => {
    const result = await markPartAnswer(
      {
        id: "part",
        label: "1(b)",
        type: "structured_response",
        prompt: "Explain agile.",
        marks: 2,
        stimulus: [],
        markingSchema: rubricMarking
      },
      { value: "short cycles" },
      {
        generateGemini: async () => {
          throw new Error("network unavailable");
        }
      }
    );

    expect(result.status).toBe("failed");
    expect(result.studentFeedback).not.toContain("Use an if statement");
  });

  it("minimizes private student data and instructs hint-safe feedback", () => {
    const prompt = buildGeminiPrompt({
      prompt: "Explain agile.",
      visibleStimuli: [],
      studentAnswer: { value: "short cycles" },
      marking: rubricMarking,
      maxScore: 2
    });

    expect(prompt).not.toContain("studentName");
    expect(prompt).not.toContain("accessCode");
    expect(prompt).not.toContain("attemptId");
    expect(prompt).toContain("hint-safe");
  });
});
