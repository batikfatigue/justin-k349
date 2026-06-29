// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { useFormStatus } from "react-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionNavigationControls } from "@/components/student/QuestionNavigationControls";

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();

  return {
    ...actual,
    useFormStatus: vi.fn()
  };
});

const mockedUseFormStatus = vi.mocked(useFormStatus);

function idleFormStatus(): ReturnType<typeof useFormStatus> {
  return {
    pending: false,
    data: null,
    method: null,
    action: null
  };
}

function pendingFormStatus(intent: string): ReturnType<typeof useFormStatus> {
  const data = new FormData();
  data.set("intent", intent);

  return {
    pending: true,
    data,
    method: "post",
    action: "/attempts/attempt-1/questions/1"
  };
}

describe("QuestionNavigationControls", () => {
  beforeEach(() => {
    mockedUseFormStatus.mockReturnValue(idleFormStatus());
  });

  it("renders the existing previous and next controls when idle", () => {
    render(
      <form>
        <QuestionNavigationControls questionNumber={2} questionCount={3} />
      </form>
    );

    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save and next" })).toBeEnabled();
  });

  it("prevents duplicate navigation submissions and shows saving feedback", () => {
    mockedUseFormStatus.mockReturnValue(pendingFormStatus("next"));

    render(
      <form>
        <QuestionNavigationControls questionNumber={2} questionCount={3} />
      </form>
    );

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("prevents duplicate final submissions and shows submit feedback", () => {
    mockedUseFormStatus.mockReturnValue(pendingFormStatus("submit"));

    render(
      <form>
        <QuestionNavigationControls questionNumber={3} questionCount={3} />
      </form>
    );

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled();
  });
});
