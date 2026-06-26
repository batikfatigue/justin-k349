// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptText } from "@/components/student/PromptText";

describe("PromptText", () => {
  it("renders explicit prompt line breaks as readable paragraphs", () => {
    const { container } = render(
      <PromptText
        text={
          "First paragraph explains the scenario.\n\nSecond paragraph asks the actual question.\nLine two stays attached."
        }
      />
    );

    const paragraphs = container.querySelectorAll("p");

    expect(paragraphs).toHaveLength(2);
    expect(screen.getByText("First paragraph explains the scenario.")).toBeInTheDocument();
    expect(paragraphs[1].textContent).toBe("Second paragraph asks the actual question.Line two stays attached.");
    expect(container.querySelector("br")).toBeInTheDocument();
  });
});
