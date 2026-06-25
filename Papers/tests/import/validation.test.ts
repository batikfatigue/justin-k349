import { describe, expect, it } from "vitest";
import { validatePaperJson } from "@/lib/import/k349-schema";
import { k349Paper } from "@/tests/fixtures/k349-paper";

function clonePaper() {
  return structuredClone(k349Paper) as any;
}

function expectInvalid(input: unknown) {
  const result = validatePaperJson(input);
  expect(result.ok).toBe(false);

  if (result.ok) {
    throw new Error("Expected validation to fail.");
  }

  return result.errors.join("\n");
}

describe("paper JSON validation", () => {
  it("reports missing required fields with paths", () => {
    const paper = clonePaper();
    delete paper.questions[0].parts[0].prompt;

    expect(expectInvalid(paper)).toContain("questions.0.parts.0.prompt");
  });

  it("rejects invalid mark totals", () => {
    const paper = clonePaper();
    paper.questions[0].marks = 99;

    expect(expectInvalid(paper)).toContain("Question q1 declares 99 marks");
  });

  it("rejects unsupported part types", () => {
    const paper = clonePaper();
    paper.questions[0].parts[0].type = "essay";

    expect(expectInvalid(paper)).toContain("questions.0.parts.0.type");
  });

  it("rejects unsupported stimulus types", () => {
    const paper = clonePaper();
    paper.questions[0].stimulus = [{ type: "video", url: "https://example.test/video.mp4" }];

    expect(expectInvalid(paper)).toContain("questions.0.stimulus.0.type");
  });

  it("rejects malformed flowcharts", () => {
    const paper = clonePaper();
    paper.questions[4].stimulus[0].edges[0].from = "missing";

    expect(expectInvalid(paper)).toContain("unknown source node 'missing'");
  });

  it("rejects unsupported marking modes", () => {
    const paper = clonePaper();
    paper.questions[0].parts[0].marking.mode = "manual";

    expect(expectInvalid(paper)).toContain("questions.0.parts.0.marking.mode");
  });
});
