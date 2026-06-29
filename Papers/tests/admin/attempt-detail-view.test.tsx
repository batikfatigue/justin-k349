// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttemptDetailView } from "@/components/admin/AttemptDetailView";

vi.mock("server-only", () => ({}));
vi.mock("@/app/admin/login/actions", () => ({
  logoutTutorAction: "/admin/login"
}));

describe("AttemptDetailView", () => {
  it("shows the AI remark control and marked timestamp for eligible submitted AI answers", () => {
    render(
      <AttemptDetailView
        detail={makeDetail()}
        manualOverrideAction={"/override" as any}
        resubmitAction={"/remark" as any}
      />
    );

    expect(screen.getAllByRole("button", { name: "Resubmit AI marking" })).toHaveLength(1);
    expect(screen.getAllByText(/^Marked /).length).toBeGreaterThan(0);
  });

  it("hides the AI remark control when no answer part is eligible", () => {
    const detail = makeDetail({
      aiCanResubmit: false
    });

    render(
      <AttemptDetailView
        detail={detail}
        manualOverrideAction={"/override" as any}
        resubmitAction={"/remark" as any}
      />
    );

    expect(screen.queryByRole("button", { name: "Resubmit AI marking" })).not.toBeInTheDocument();
  });

  it("renders readable review content without generic JSON blocks", () => {
    const { container } = render(
      <AttemptDetailView
        detail={makeDetail()}
        manualOverrideAction={"/override" as any}
        resubmitAction={"/remark" as any}
      />
    );

    expect(screen.getByText("The team can adjust in the next sprint.")).toBeInTheDocument();
    expect(screen.getByText("Model answer")).toBeInTheDocument();
    expect(screen.getByText("Short iterations allow changes to be handled in later sprints.")).toBeInTheDocument();
    expect(screen.getByText("Needs a specific sprint example.")).toBeInTheDocument();
    expect(screen.getAllByText("Accepted answers").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Matched").length).toBeGreaterThan(0);
    expect(screen.queryByText(/"mode"/)).not.toBeInTheDocument();
    expect(container.querySelector(".code-block")).not.toBeInTheDocument();
  });

  it("shows manual override controls and mark source for submitted saved answers", () => {
    render(
      <AttemptDetailView
        detail={makeDetail()}
        manualOverrideAction={"/override" as any}
        resubmitAction={"/remark" as any}
      />
    );

    expect(screen.getAllByRole("button", { name: "Save manual mark" })).toHaveLength(2);
    expect(screen.getByLabelText("Score for 1(b)")).toHaveValue(1);
    expect(screen.getByLabelText("Student feedback for 1(b)")).toHaveValue("Good explanation.");
    expect(screen.getAllByText("Source: Auto")).toHaveLength(1);
    expect(screen.getAllByText("Source: Manual")).toHaveLength(1);
  });

  it("hides manual override controls before submission", () => {
    const detail = makeDetail({
      aiCanResubmit: false,
      status: "in_progress"
    });

    render(
      <AttemptDetailView
        detail={detail}
        manualOverrideAction={"/override" as any}
        resubmitAction={"/remark" as any}
      />
    );

    expect(screen.queryByRole("button", { name: "Save manual mark" })).not.toBeInTheDocument();
  });
});

function makeDetail({
  aiCanResubmit = true,
  status = "submitted"
}: {
  aiCanResubmit?: boolean;
  status?: "in_progress" | "submitted";
} = {}) {
  const markedAt = new Date("2026-06-26T04:00:00.000Z");

  return {
    attempt: {
      id: "attempt-1",
      paperId: "paper-1",
      paperVersionId: "version-1",
      paperTitle: "K349 G3 Computing Practice Paper 1",
      syllabus: "K349 G3 Computing",
      accessCodeLabel: "G3 Computing",
      studentName: "Ada Lovelace",
      normalizedStudentName: "ada lovelace",
      attemptNumber: 1,
      status,
      displayStatus: status,
      startedAt: new Date("2026-06-26T03:00:00.000Z"),
      submittedAt: status === "submitted" ? markedAt : null,
      lastSeenAt: markedAt,
      elapsedSeconds: 120
    },
    questions: [
      {
        id: "question-1",
        paperId: "paper-1",
        paperVersionId: "version-1",
        externalId: "q1",
        number: "1",
        title: "Iterative Software Development",
        marks: 3,
        outcomeId: null,
        variantGroupId: null,
        targetAnswerId: null,
        difficulty: null,
        stimulus: [],
        position: 1,
        parts: [
          {
            id: "part-ai",
            questionId: "question-1",
            paperVersionId: "version-1",
            externalId: "q1b",
            label: "1(b)",
            type: "structured_response",
            prompt: "Explain how short sprint cycles help when a requirement changes.",
            marks: 2,
            outcomeId: null,
            variantGroupId: null,
            targetAnswerId: null,
            difficulty: null,
            stimulus: [],
            responseSchema: { kind: "structured_response", lines: 4 },
            markingSchema: {
              mode: "rubric_ai",
              maxScore: 2,
              modelAnswer: "Short iterations allow changes to be handled in later sprints.",
              rubricPoints: [{ text: "Explains iterative change handling.", marks: 2 }]
            },
            studentFeedbackPolicy: null,
            position: 1,
            canResubmitAiMark: aiCanResubmit,
            answer: {
              id: "answer-ai",
              attemptId: "attempt-1",
              questionId: "question-1",
              questionPartId: "part-ai",
              answer: { value: "The team can adjust in the next sprint." },
              score: 1,
              maxScore: 2,
              markingStatus: "marked",
              markingSource: "auto",
              studentFeedback: "Good explanation.",
              tutorRationale: "Covers repeated stages and change handling.",
              missingRubricPoints: ["Needs a specific sprint example."],
              exactMarkingDetails: null,
              markedAt,
              updatedAt: markedAt
            }
          },
          {
            id: "part-exact",
            questionId: "question-1",
            paperVersionId: "version-1",
            externalId: "q1c",
            label: "1(c)",
            type: "short_text",
            prompt: "State one iterative methodology.",
            marks: 1,
            outcomeId: null,
            variantGroupId: null,
            targetAnswerId: null,
            difficulty: null,
            stimulus: [],
            responseSchema: { kind: "short_text", lines: 1 },
            markingSchema: {
              mode: "exact",
              acceptedAnswers: ["scrum"],
              caseSensitive: false
            },
            studentFeedbackPolicy: null,
            position: 2,
            canResubmitAiMark: false,
            answer: {
              id: "answer-exact",
              attemptId: "attempt-1",
              questionId: "question-1",
              questionPartId: "part-exact",
              answer: { value: "scrum" },
              score: 1,
              maxScore: 1,
              markingStatus: "marked",
              markingSource: "manual",
              studentFeedback: "Your response matched the expected answer.",
              tutorRationale: "Exact marker matched one accepted answer.",
              missingRubricPoints: [],
              exactMarkingDetails: {
                submitted: "scrum",
                acceptedAnswers: ["scrum"],
                caseSensitive: false,
                matched: true
              },
              markedAt,
              updatedAt: markedAt
            }
          }
        ]
      }
    ]
  } as any;
}
