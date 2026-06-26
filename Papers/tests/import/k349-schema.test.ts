import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
    expect(result.paper.questions[1].stimulus ?? []).toEqual([]);
    expect(result.paper.questions[1].parts[1].stimulus?.[0]).toMatchObject({
      type: "code",
      code: expect.stringContaining("    number = random.randint")
    });
    expect(result.paper.questions[4].stimulus?.[0]).toMatchObject({
      type: "flowchart",
      nodes: expect.arrayContaining([expect.objectContaining({ id: "decision" })])
    });
  });

  it("validates the parallel import JSON with checkbox responses and neutral flowchart titles", () => {
    const paperJson = readFileSync(
      "openspec/changes/archive/2026-06-26-build-practice-exam-paper-app/research/k349-g3-parallel-paper-import.json",
      "utf8"
    );
    const result = validatePaperJson(JSON.parse(paperJson));

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.errors.join("\n"));
    }

    expect(result.summary).toMatchObject({
      questionCount: 6,
      partCount: 13,
      totalMarks: 38
    });
    expect(result.paper.questions[0].parts[0]).toMatchObject({
      type: "multiple_choice",
      response: { kind: "multiple_choice" },
      marking: {
        mode: "exact",
        acceptedAnswers: ["consolidate_requirements;deploy_code;design_solutions;test_refine_code"]
      }
    });
    expect(result.paper.questions[1].stimulus ?? []).toEqual([]);
    expect(result.paper.questions[1].parts[1].stimulus?.[0]).toMatchObject({
      type: "code",
      title: "Prize code generator"
    });
    expect(result.paper.questions[4].title).toBe("Team Qualification Algorithm");
    expect(result.paper.questions[5].title).toBe("Countdown Algorithm");
  });
});
