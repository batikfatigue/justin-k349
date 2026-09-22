// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnswerControls } from "@/components/student/AnswerControls";

describe("AnswerControls", () => {
  it("renders multiple-choice responses as tick boxes", () => {
    render(
      <AnswerControls
        partId="q1a"
        responseSchema={{
          kind: "multiple_choice",
          options: [
            { value: "deploy_code", label: "deploy code" },
            { value: "design_solutions", label: "design solutions" }
          ]
        }}
        answer={{ values: ["design_solutions"] }}
      />
    );

    expect(screen.getByText("Tick all that apply")).toBeInTheDocument();
    expect(screen.getByLabelText("deploy code")).toHaveAttribute("type", "checkbox");
    expect(screen.getByLabelText("design solutions")).toBeChecked();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders code-writing parts in the code editor with a gutter and open button", () => {
    render(
      <AnswerControls
        partId="q2b"
        responseSchema={{ kind: "code_writing", lines: 8 }}
        answer={{ value: "def f():\n    pass" }}
      />
    );

    const textarea = screen.getByLabelText("Answer") as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute("name", "part-q2b");
    expect(textarea).toHaveAttribute("rows", "8");
    expect(textarea.value).toBe("def f():\n    pass");
    expect(screen.getByTestId("code-editor-gutter").querySelectorAll("span")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Open in Python Tutor" })).toBeInTheDocument();
  });

  it("keeps the plain textarea for short-text parts", () => {
    render(<AnswerControls partId="q3" responseSchema={{ kind: "short_text" }} answer={{ value: "hi" }} />);

    const textarea = screen.getByLabelText("Answer") as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute("name", "part-q3");
    expect(textarea.value).toBe("hi");
    expect(screen.queryByTestId("code-editor-gutter")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open in Python Tutor" })).not.toBeInTheDocument();
  });
});
