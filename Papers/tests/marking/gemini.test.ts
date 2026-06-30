import { describe, expect, it, vi } from "vitest";
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

  it("marks empty rubric answers as zero without calling Gemini", async () => {
    const generateGemini = vi.fn();

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
      { value: "" },
      { generateGemini }
    );

    expect(generateGemini).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "marked",
      score: 0,
      maxScore: 2,
      missingRubricPoints: [],
      exactMarkingDetails: null
    });
    expect(result.studentFeedback).not.toContain("Use an if statement");
  });

  it("marks whitespace-only rubric answers as zero without calling Gemini", async () => {
    const generateGemini = vi.fn();

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
      { value: " \n\t " },
      { generateGemini }
    );

    expect(generateGemini).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "marked",
      score: 0,
      maxScore: 2,
      missingRubricPoints: [],
      exactMarkingDetails: null
    });
  });

  it("still calls Gemini for non-blank rubric answers and stores the returned mark", async () => {
    const generateGemini = vi.fn(async () =>
      JSON.stringify({
        score: 1,
        maxScore: 2,
        studentFeedback: "You described short cycles but missed adapting later.",
        tutorRationale: "Mentions iterations but not handling changed requirements.",
        missingRubricPoints: ["Explains that changes can be handled in a later sprint."]
      })
    );

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
      { value: "Teams work in short iterations." },
      { generateGemini }
    );

    expect(generateGemini).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      status: "marked",
      score: 1,
      maxScore: 2,
      studentFeedback: "You described short cycles but missed adapting later.",
      tutorRationale: "Mentions iterations but not handling changed requirements.",
      missingRubricPoints: ["Explains that changes can be handled in a later sprint."],
      exactMarkingDetails: null
    });
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
