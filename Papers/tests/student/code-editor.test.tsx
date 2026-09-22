// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeEditor, buildPythonTutorUrl } from "@/components/student/CodeEditor";

function renderEditor(defaultValue = "") {
  render(<CodeEditor name="part-q1" defaultValue={defaultValue} />);
  const textarea = screen.getByLabelText("Answer") as HTMLTextAreaElement;
  const gutter = screen.getByTestId("code-editor-gutter");
  return { textarea, gutter };
}

function setCaret(textarea: HTMLTextAreaElement, start: number, end = start) {
  textarea.focus();
  textarea.setSelectionRange(start, end);
}

describe("CodeEditor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a code-oriented textarea with one gutter number per line", () => {
    const { textarea, gutter } = renderEditor("a\nb\nc");

    expect(textarea).toHaveAttribute("name", "part-q1");
    expect(textarea).toHaveAttribute("wrap", "off");
    expect(textarea).toHaveAttribute("spellcheck", "false");
    expect(textarea).toHaveAttribute("autocorrect", "off");
    expect(textarea).toHaveAttribute("autocapitalize", "off");
    expect(gutter).toHaveAttribute("aria-hidden", "true");
    expect(gutter.querySelectorAll("span")).toHaveLength(3);
  });

  it("updates the gutter as lines are typed", () => {
    const { textarea, gutter } = renderEditor("");
    fireEvent.change(textarea, { target: { value: "x\ny\nz\nw" } });
    expect(gutter.querySelectorAll("span")).toHaveLength(4);
  });

  it("Tab inserts four spaces at the caret and keeps focus", () => {
    const { textarea } = renderEditor("ab");
    setCaret(textarea, 1);

    const event = fireEvent.keyDown(textarea, { key: "Tab" });

    expect(event).toBe(false);
    expect(textarea.value).toBe("a    b");
    expect(textarea.selectionStart).toBe(5);
    expect(document.activeElement).toBe(textarea);
  });

  it("Tab with a multi-line selection indents every selected line", () => {
    const { textarea } = renderEditor("a\nb\nc");
    setCaret(textarea, 0, 3);

    fireEvent.keyDown(textarea, { key: "Tab" });

    expect(textarea.value).toBe("    a\n    b\nc");
    expect(textarea.selectionStart).toBe(4);
    expect(textarea.selectionEnd).toBe(11);
  });

  it("Shift+Tab removes up to four leading spaces from the current line", () => {
    const { textarea } = renderEditor("      x\n  y");
    setCaret(textarea, 7);

    fireEvent.keyDown(textarea, { key: "Tab", shiftKey: true });

    expect(textarea.value).toBe("  x\n  y");
    expect(textarea.selectionStart).toBe(3);
    expect(document.activeElement).toBe(textarea);
  });

  it("Shift+Tab with a multi-line selection outdents every selected line", () => {
    const { textarea } = renderEditor("    a\n  b\nc");
    setCaret(textarea, 0, 11);

    fireEvent.keyDown(textarea, { key: "Tab", shiftKey: true });

    expect(textarea.value).toBe("a\nb\nc");
  });

  it("Enter copies the current line's indentation", () => {
    const { textarea } = renderEditor("    x = 1");
    setCaret(textarea, 9);

    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(textarea.value).toBe("    x = 1\n    ");
    expect(textarea.selectionStart).toBe(14);
  });

  it("Enter adds an extra indent after a line ending in a colon", () => {
    const { textarea } = renderEditor("    def f():");
    setCaret(textarea, 12);

    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(textarea.value).toBe("    def f():\n        ");
    expect(textarea.selectionStart).toBe(21);
  });

  it("modified Enter is not intercepted", () => {
    const { textarea } = renderEditor("a:");
    setCaret(textarea, 2);

    expect(fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true })).toBe(true);
    expect(fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(textarea, { key: "Enter", metaKey: true })).toBe(true);
    expect(textarea.value).toBe("a:");
  });

  it("Escape then Tab lets focus leave without changing the value", () => {
    const { textarea } = renderEditor("abc");
    setCaret(textarea, 1);

    fireEvent.keyDown(textarea, { key: "Escape" });
    const notPrevented = fireEvent.keyDown(textarea, { key: "Tab" });

    expect(notPrevented).toBe(true);
    expect(textarea.value).toBe("abc");

    const prevented = fireEvent.keyDown(textarea, { key: "Tab" });
    expect(prevented).toBe(false);
    expect(textarea.value).toBe("a    bc");
  });

  it("Escape flag is reset by another key or blur", () => {
    const { textarea } = renderEditor("");
    setCaret(textarea, 0);

    fireEvent.keyDown(textarea, { key: "Escape" });
    fireEvent.keyDown(textarea, { key: "a" });
    expect(fireEvent.keyDown(textarea, { key: "Tab" })).toBe(false);

    fireEvent.keyDown(textarea, { key: "Escape" });
    fireEvent.blur(textarea);
    expect(fireEvent.keyDown(textarea, { key: "Tab" })).toBe(false);
  });

  it("mirrors textarea scrollTop onto the gutter", () => {
    const { textarea, gutter } = renderEditor("a\nb");
    Object.defineProperty(textarea, "scrollTop", { value: 42, writable: true });

    fireEvent.scroll(textarea);

    expect(gutter.scrollTop).toBe(42);
  });

  it("buildPythonTutorUrl percent-encodes the code and appends edit-mode params", () => {
    const url = buildPythonTutorUrl('x = 1 + 2 # a & b\nprint("x")');

    expect(url.startsWith("https://pythontutor.com/visualize.html#code=")).toBe(true);
    expect(url.endsWith("&mode=edit&py=3")).toBe(true);
    const encoded = url.slice("https://pythontutor.com/visualize.html#code=".length, -"&mode=edit&py=3".length);
    expect(encoded).not.toMatch(/[\n#&+"]/);
    expect(encoded).toContain("%0A");
    expect(encoded).toContain("%23");
    expect(encoded).toContain("%26");
    expect(encoded).toContain("%2B");
    expect(encoded).toContain("%22");
    expect(decodeURIComponent(encoded)).toBe('x = 1 + 2 # a & b\nprint("x")');
  });

  it("the icon button opens Python Tutor in a new tab without submitting the form", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <CodeEditor name="part-q1" defaultValue="" />
      </form>
    );
    const textarea = screen.getByLabelText("Answer") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "print(1)" } });

    const button = screen.getByRole("button", { name: "Open in Python Tutor" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("title", "Open in Python Tutor");
    expect(button.textContent).toBe("");

    fireEvent.click(button);

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(buildPythonTutorUrl("print(1)"), "_blank", "noopener,noreferrer");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea.value).toBe("print(1)");
  });
});
