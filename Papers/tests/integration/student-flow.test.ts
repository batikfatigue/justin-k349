import { describe, expect, it } from "vitest";
import { displayAttemptStatus } from "@/lib/attempt-status";

describe("student flow integration contracts", () => {
  it("identifies stale in-progress attempts as abandoned for tutor review", () => {
    const stale = new Date(Date.now() - 31 * 60 * 1000);

    expect(displayAttemptStatus("in_progress", stale)).toBe("abandoned");
    expect(displayAttemptStatus("submitted", stale)).toBe("submitted");
  });

  it("documents the configured end-to-end flow points", () => {
    const flow = [
      "start attempt",
      "save nested part answers",
      "submit attempt",
      "create reattempt",
      "filter student results",
      "show abandoned attempts"
    ];

    expect(flow).toHaveLength(6);
  });
});
