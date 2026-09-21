import { describe, expect, it } from "vitest";
import type { MarkingSchema, Stimulus } from "@/lib/domain";
import {
  displayQuestionTitle,
  moveQuestionCodeStimuliToTargetPart,
  normalizeChoicePart,
  normalizePartMarkingSchema
} from "@/lib/paper/presentation";

describe("paper presentation normalization", () => {
  it("moves question-level code stimulus to the target question 2 part", () => {
    const codeStimulus: Stimulus = {
      type: "code",
      language: "python",
      code: "print('hello')"
    };
    const normalized = moveQuestionCodeStimuliToTargetPart({
      questionNumber: "2",
      questionStimulus: [
        codeStimulus,
        {
          type: "text",
          text: "Answer the following."
        }
      ],
      parts: [
        {
          id: "part-a",
          label: "2(a)",
          prompt: "Explain variable names.",
          stimulus: []
        },
        {
          id: "part-b",
          label: "2(b)",
          prompt: "Describe how the program executes.",
          stimulus: []
        }
      ]
    });

    expect(normalized.questionStimulus).toEqual([{ type: "text", text: "Answer the following." }]);
    expect(normalized.partStimulusById.get("part-b")).toEqual([codeStimulus]);
  });

  it("keeps paper-specific display titles and marking adjustments in one place", () => {
    const markingSchema: MarkingSchema = {
      mode: "error_correction",
      expectedLineNumber: "04",
      acceptedCorrectedLines: ["    print(x)"],
      lineNumberMarks: 1,
      correctionMarks: 0
    };

    expect(displayQuestionTitle("Flowcharts And Code")).toBe("Team Qualification Algorithm");
    expect(normalizePartMarkingSchema({ label: "4(b)", markingSchema })).toMatchObject({
      lineNumberMarks: 0,
      correctionMarks: 1
    });
  });

  it("converts option tables in tick-all prompts to multiple-choice controls", () => {
    const normalized = normalizeChoicePart({
      prompt: "Tick all applicable boxes.",
      responseSchema: { kind: "structured_response", lines: 2 },
      stimulus: [
        {
          type: "table",
          columns: ["Option"],
          rows: [["deploy code"], ["test solution"]]
        }
      ]
    });

    expect(normalized.responseSchema).toEqual({
      kind: "multiple_choice",
      options: [
        { value: "deploy code", label: "deploy code" },
        { value: "test solution", label: "test solution" }
      ]
    });
    expect(normalized.stimulus).toEqual([]);
  });
});
