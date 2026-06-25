import { describe, expect, it } from "vitest";
import { validatePaperJson } from "@/lib/import/k349-schema";
import { k349Paper } from "@/tests/fixtures/k349-paper";

describe("K349 paper import contract", () => {
  it("represents the parallel practice paper without losing nested structure", () => {
    const roundTripped = JSON.parse(JSON.stringify(k349Paper));
    const result = validatePaperJson(roundTripped);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.errors.join("\n"));
    }

    expect(result.summary).toEqual({
      title: "K349 G3 Computing Practice Paper 1",
      syllabus: "K349 G3 Computing",
      accessCodeCount: 1,
      questionCount: 5,
      partCount: 11,
      totalMarks: 30
    });
    expect(result.paper.questions[1].stimulus?.[0]).toMatchObject({
      type: "code",
      code: expect.stringContaining("    number = random.randint")
    });
    expect(result.paper.questions[4].stimulus?.[0]).toMatchObject({
      type: "flowchart",
      nodes: expect.arrayContaining([expect.objectContaining({ id: "decision" })])
    });
  });
});
