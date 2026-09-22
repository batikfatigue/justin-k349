# Proposal

## Why

Parts with a `code_writing` response schema (e.g. "write a Python function that...") currently render as a plain `<textarea>` with a monospace class. Pressing Tab moves focus out of the box instead of indenting, and Enter does not preserve the current indentation, so students writing Python — where indentation is syntax — have to fight the input. A basic code-editor feel makes writing indented code natural without changing how answers are stored or marked.

## What Changes

- Replace the plain textarea for `code_writing` parts with a lightweight, dependency-free client-side code editor component:
  - Monospace font, `tab-size: 4`, no spellcheck, no autocorrect/autocapitalize, horizontal scroll instead of soft-wrap.
  - Line-number gutter that stays in sync with the textarea content and scroll position.
  - Tab inserts 4 spaces at the caret (Shift+Tab removes up to 4 leading spaces on the current line); focus does not leave the box. Escape then Tab still allows keyboard users to move focus away.
  - Enter preserves the current line's leading whitespace and adds one extra indent level when the current line ends with `:`.
- The editor remains a real `<textarea name="part-<id>">` inside the existing form, so answer submission, saving, revisiting, and marking are unchanged.
- A single icon-only "open in new tab" button (`type="button"`, with an accessible label) in the editor's corner opens the current textarea contents in Python Tutor (`pythontutor.com/visualize.html#code=<encoded>&mode=edit&py=3`) in a new tab, so students can run the code and check its output without saving or leaving the attempt. Nothing is sent to our server; the attempt page and the answer are untouched.
- Non-code response kinds (`short_text`, `structured_response`, `flowchart_interpretation`) keep the existing plain textarea.
- No in-app code execution, no syntax highlighting, no new npm dependency.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `student-practice-attempts`: the "One-question multi-part answering flow" gains a requirement that `code_writing` parts are answered in a code-oriented input that supports indentation via keyboard (Tab / Enter behaviour), shows line numbers, and offers a one-click way to try the current code in Python Tutor in a new tab, while still persisting the answer as plain text.

## Impact

- `components/student/AnswerControls.tsx` — branch `code_writing` to the new editor.
- New client component `components/student/CodeEditor.tsx` (`"use client"`), following the pattern of `Stopwatch.tsx`.
- `app/globals.css` — styles for the editor wrapper, gutter, and textarea.
- `tests/student/answer-controls.test.tsx` and a new `tests/student/code-editor.test.tsx` — jsdom tests for rendering and key handling.
- No changes to `lib/domain.ts`, `lib/student/data.ts` (`parseAnswer`), the import schema, the database, or marking. The saved `StudentAnswer` shape (`{ value: string }`) is unchanged.
