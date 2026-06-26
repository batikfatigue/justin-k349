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
    render(<AttemptDetailView detail={makeDetail()} resubmitAction={"/remark" as any} />);

    expect(screen.getAllByRole("button", { name: "Resubmit AI marking" })).toHaveLength(1);
    expect(screen.getAllByText(/^Marked /).length).toBeGreaterThan(0);
  });

  it("hides the AI remark control when no answer part is eligible", () => {
    const detail = makeDetail({
      aiCanResubmit: false
    });

    render(<AttemptDetailView detail={detail} resubmitAction={"/remark" as any} />);

    expect(screen.queryByRole("button", { name: "Resubmit AI marking" })).not.toBeInTheDocument();
  });
});

function makeDetail({ aiCanResubmit = true }: { aiCanResubmit?: boolean } = {}) {
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
      status: "submitted",
      displayStatus: "submitted",
      startedAt: new Date("2026-06-26T03:00:00.000Z"),
      submittedAt: markedAt,
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
              score: 2,
              maxScore: 2,
              markingStatus: "marked",
              studentFeedback: "Good explanation.",
              tutorRationale: "Covers repeated stages and change handling.",
              missingRubricPoints: [],
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
              studentFeedback: "Your response matched the expected answer.",
              tutorRationale: "Exact marker matched one accepted answer.",
              missingRubricPoints: [],
              exactMarkingDetails: null,
              markedAt,
              updatedAt: markedAt
            }
          }
        ]
      }
    ]
  } as any;
}
