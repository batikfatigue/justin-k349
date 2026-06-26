import { describe, expect, it } from "vitest";
import { buildFlowchartLayout } from "@/components/student/StimulusRenderer";
import type { Stimulus } from "@/lib/domain";

const teamQualificationStimulus: Extract<Stimulus, { type: "flowchart" }> = {
  type: "flowchart",
  title: "Team qualification flowchart",
  nodes: [
    { id: "start", kind: "terminal", text: "START" },
    { id: "input_rank", kind: "input", text: "INPUT final rank (rank)" },
    { id: "decision_rank", kind: "decision", text: "rank less than or equal to 3?" },
    { id: "promoted_output", kind: "output", text: 'OUTPUT "Promoted to the finals."' },
    { id: "not_promoted_output", kind: "output", text: 'OUTPUT "Not promoted."' },
    { id: "end_output", kind: "output", text: 'OUTPUT "End"' },
    { id: "stop", kind: "terminal", text: "STOP" }
  ],
  edges: [
    { from: "start", to: "input_rank" },
    { from: "input_rank", to: "decision_rank" },
    { from: "decision_rank", to: "promoted_output", label: "yes" },
    { from: "decision_rank", to: "not_promoted_output", label: "no" },
    { from: "promoted_output", to: "end_output" },
    { from: "not_promoted_output", to: "end_output" },
    { from: "end_output", to: "stop" }
  ]
};

describe("flowchart layout", () => {
  it("places branching outputs side by side before the joined output", () => {
    const layout = buildFlowchartLayout(teamQualificationStimulus);
    const nodesById = new Map(layout.nodes.map((node) => [node.id, node]));
    const decision = nodesById.get("decision_rank")!;
    const promoted = nodesById.get("promoted_output")!;
    const notPromoted = nodesById.get("not_promoted_output")!;
    const endOutput = nodesById.get("end_output")!;
    const stop = nodesById.get("stop")!;

    expect(layout.nodes).toHaveLength(7);
    expect(promoted.x).toBeLessThan(notPromoted.x);
    expect(promoted.y).toBe(notPromoted.y);
    expect(decision.y).toBeLessThan(promoted.y);
    expect(endOutput.y).toBeGreaterThan(promoted.y);
    expect(stop.y).toBeGreaterThan(endOutput.y);
    expect(layout.width).toBeGreaterThanOrEqual(640);
  });
});
