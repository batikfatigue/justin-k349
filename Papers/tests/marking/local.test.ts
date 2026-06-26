import { describe, expect, it } from "vitest";
import {
  markCodeOutputTable,
  markErrorCorrection,
  markExact
} from "@/lib/marking/mark";

describe("local marking", () => {
  it("marks exact Boolean, numeric, string, and accepted alternatives", () => {
    expect(markExact({ value: "False" }, { mode: "exact", acceptedAnswers: ["False"], caseSensitive: true }, 1).score).toBe(1);
    expect(markExact({ value: "true" }, { mode: "exact", acceptedAnswers: ["True"], caseSensitive: false }, 1).score).toBe(1);
    expect(markExact({ value: "8" }, { mode: "exact", acceptedAnswers: [8], caseSensitive: true }, 1).score).toBe(1);
    expect(markExact({ value: "nna" }, { mode: "exact", acceptedAnswers: ["nna"], caseSensitive: true }, 1).score).toBe(1);
    expect(markExact({ value: "if-else" }, { mode: "exact", acceptedAnswers: ["selection", "if-else"] }, 1).score).toBe(1);
  });

  it("marks exact multiple-choice selections independent of checkbox order", () => {
    const result = markExact(
      { values: ["test_refine_code", "deploy_code", "design_solutions"] },
      {
        mode: "exact",
        acceptedAnswers: ["deploy_code;design_solutions;test_refine_code"],
        caseSensitive: false
      },
      1
    );

    expect(result.score).toBe(1);
    expect(result.exactMarkingDetails).toMatchObject({
      submitted: "deploy_code;design_solutions;test_refine_code",
      matched: true
    });
  });

  it("marks code-output table rows independently", () => {
    const result = markCodeOutputTable(
      { rows: { a: "False", b: "wrong" } },
      {
        mode: "code_output_table",
        rows: [
          { id: "a", expectedOutput: "False", marks: 1 },
          { id: "b", expectedOutput: "True", marks: 1 }
        ],
        caseSensitive: true
      },
      2
    );

    expect(result.score).toBe(1);
    expect(result.exactMarkingDetails).toMatchObject({
      rows: [
        expect.objectContaining({ id: "a", matched: true }),
        expect.objectContaining({ id: "b", matched: false })
      ]
    });
  });

  it("marks line-number corrections and corrected-line alternatives", () => {
    const result = markErrorCorrection(
      { lineNumber: "01", correctedLine: "message = \"It's time to go!\"" },
      {
        mode: "error_correction",
        expectedLineNumber: "01",
        acceptedCorrectedLines: ["message = \"It's time to go!\"", "message = 'It\\'s time to go!'"],
        lineNumberMarks: 1,
        correctionMarks: 1
      },
      2
    );

    expect(result.score).toBe(2);
    expect(result.exactMarkingDetails).toMatchObject({
      lineMatched: true,
      correctionMatched: true
    });
  });

  it("requires one indentation level for the q4b while-loop correction", () => {
    const schema = {
      mode: "error_correction" as const,
      expectedLineNumber: "04",
      acceptedCorrectedLines: ["    print(x)"],
      lineNumberMarks: 0,
      correctionMarks: 1,
      caseSensitive: true
    };

    expect(markErrorCorrection({ lineNumber: "04", correctedLine: "    print(x)" }, schema, 1).score).toBe(1);
    expect(markErrorCorrection({ lineNumber: "04", correctedLine: "\tprint(x)" }, schema, 1).score).toBe(1);
    expect(markErrorCorrection({ lineNumber: "04", correctedLine: "print(x)" }, schema, 1).score).toBe(0);
  });
});
