"use client";

import React, { useEffect, useRef, useState } from "react";

const INDENT = "    ";

export function buildPythonTutorUrl(code: string): string {
  return `https://pythontutor.com/visualize.html#code=${encodeURIComponent(code)}&mode=edit&py=3`;
}

type Edit = { value: string; selectionStart: number; selectionEnd: number };

function lineStartAt(value: string, index: number): number {
  return value.lastIndexOf("\n", index - 1) + 1;
}

function lineEndAt(value: string, index: number): number {
  const end = value.indexOf("\n", index);
  return end === -1 ? value.length : end;
}

function indentSelection(value: string, start: number, end: number, outdent: boolean): Edit {
  const blockStart = lineStartAt(value, start);
  const blockEnd = lineEndAt(value, Math.max(start, end - (end > start && value[end - 1] === "\n" ? 1 : 0)));
  const lines = value.slice(blockStart, blockEnd).split("\n");
  let firstDelta = 0;
  let totalDelta = 0;

  const changed = lines.map((line, index) => {
    if (outdent) {
      const removed = Math.min(INDENT.length, line.match(/^ */)![0].length);
      if (index === 0) firstDelta = -removed;
      totalDelta -= removed;
      return line.slice(removed);
    }
    if (index === 0) firstDelta = INDENT.length;
    totalDelta += INDENT.length;
    return INDENT + line;
  });

  const nextValue = value.slice(0, blockStart) + changed.join("\n") + value.slice(blockEnd);
  const nextStart = Math.max(blockStart, start + firstDelta);
  const nextEnd = Math.max(nextStart, end + totalDelta);
  return { value: nextValue, selectionStart: nextStart, selectionEnd: nextEnd };
}

function insertAt(value: string, start: number, end: number, text: string): Edit {
  const caret = start + text.length;
  return { value: value.slice(0, start) + text + value.slice(end), selectionStart: caret, selectionEnd: caret };
}

function newlineWithIndent(value: string, start: number, end: number): Edit {
  const lineStart = lineStartAt(value, start);
  const line = value.slice(lineStart, start);
  const leading = line.match(/^ */)![0];
  const extra = line.trimEnd().endsWith(":") ? INDENT : "";
  return insertAt(value, start, end, `\n${leading}${extra}`);
}

export function CodeEditor({
  name,
  defaultValue,
  rows = 10
}: {
  name: string;
  defaultValue: string;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  const tabTrapDisabled = useRef(false);

  useEffect(() => {
    const selection = pendingSelection.current;
    const textarea = textareaRef.current;
    if (!selection || !textarea) return;
    pendingSelection.current = null;
    textarea.setSelectionRange(selection.start, selection.end);
  }, [value]);

  const applyEdit = (edit: Edit) => {
    pendingSelection.current = { start: edit.selectionStart, end: edit.selectionEnd };
    setValue(edit.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    if (event.key === "Escape") {
      tabTrapDisabled.current = true;
      return;
    }

    if (event.key === "Tab") {
      if (tabTrapDisabled.current) {
        tabTrapDisabled.current = false;
        return;
      }
      event.preventDefault();
      const multiLine = value.slice(selectionStart, selectionEnd).includes("\n");
      if (event.shiftKey || multiLine) {
        applyEdit(indentSelection(value, selectionStart, selectionEnd, event.shiftKey));
      } else {
        applyEdit(insertAt(value, selectionStart, selectionEnd, INDENT));
      }
      return;
    }

    tabTrapDisabled.current = false;

    if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      applyEdit(newlineWithIndent(value, selectionStart, selectionEnd));
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
  };

  const openInPythonTutor = () => {
    window.open(buildPythonTutorUrl(value), "_blank", "noopener,noreferrer");
  };

  const lineCount = value.split("\n").length;

  return (
    <div className="code-editor">
      <div className="code-editor-gutter" aria-hidden="true" ref={gutterRef} data-testid="code-editor-gutter">
        {Array.from({ length: lineCount }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        rows={rows}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        onBlur={() => {
          tabTrapDisabled.current = false;
        }}
        wrap="off"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="Answer"
      />
      <button
        type="button"
        className="code-editor-open"
        aria-label="Open in Python Tutor"
        title="Open in Python Tutor"
        onClick={openInPythonTutor}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M6.5 3H3v10h10V9.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 3h4v4M13 3 7.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
