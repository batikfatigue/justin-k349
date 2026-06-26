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
});
