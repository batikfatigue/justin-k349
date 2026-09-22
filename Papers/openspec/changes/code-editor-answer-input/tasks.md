# Tasks

## 1. Editor component

- [x] 1.1 Create `components/student/CodeEditor.tsx` (`"use client"`) rendering a flex wrapper with an `aria-hidden` line-number gutter and a controlled `<textarea name={name} defaultValue→state wrap="off" spellCheck={false} autoCorrect="off" autoCapitalize="off">`; verify `npm run typecheck` passes and the gutter shows N numbers for an N-line `defaultValue` in a jsdom render.
- [x] 1.2 Implement Tab / Shift+Tab handling (4-space indent/outdent, multi-line selection support, caret restored after re-render, focus kept); verify with new tests in `tests/student/code-editor.test.tsx` using `fireEvent.keyDown` that the textarea value and `selectionStart` change as specified and `document.activeElement` stays on the textarea.
- [x] 1.3 Implement Enter handling (copy leading whitespace of current line, add 4 spaces when trimmed line ends with `:`; Shift/Ctrl/Meta+Enter fall through); verify with tests for `def f():` → newline + 8 spaces, `    x = 1` → newline + 4 spaces, and that modified Enter is not prevented.
- [x] 1.4 Implement Escape-then-Tab escape hatch (ref flag reset on blur or any other key); verify with a test that after Escape a Tab keydown is not `defaultPrevented` and the value is unchanged.
- [x] 1.5 Sync gutter `scrollTop` with textarea `onScroll`; verify by a test that dispatching `scroll` on the textarea copies `scrollTop` to the gutter element.
- [x] 1.6 Export a pure `buildPythonTutorUrl(code)` helper returning `https://pythontutor.com/visualize.html#code=<encodeURIComponent(code)>&mode=edit&py=3`; verify with tests that newlines, `#`, `&`, `+`, and quotes are percent-encoded and the suffix params are present.
- [x] 1.7 Add a single icon-only `<button type="button" aria-label="Open in Python Tutor" title="Open in Python Tutor">` with an inline monochrome "open in new tab" SVG in the editor's top-right corner; on click call `window.open(buildPythonTutorUrl(value), "_blank", "noopener,noreferrer")`; verify with a test that stubs `window.open`, types code, clicks the button, and asserts it was called once with the expected URL and that no `submit` event fired on an enclosing `<form>`.

## 2. Wire into answer controls and styles

- [x] 2.1 In `components/student/AnswerControls.tsx`, render `<CodeEditor name={`part-${partId}`} defaultValue={value} rows={responseSchema?.lines ?? 10} />` for `code_writing` and keep the plain textarea for other text kinds; verify `tests/student/answer-controls.test.tsx` gains cases asserting a code part renders the gutter and a `short_text` part does not.
- [x] 2.2 Add `.code-editor`, `.code-editor-gutter`, `.code-editor textarea`, and `.code-editor-open` rules to `app/globals.css` (monospace stack, `tab-size: 4`, `white-space: pre`, `overflow: auto`, shared line-height/padding, `:focus-within` outline, muted gutter, `user-select: none`; wrapper `position: relative`, button absolutely positioned top-right, ~16px `currentColor` icon, transparent background, existing `:focus-visible` outline); verify visually in `npm run dev` that gutter numbers align with lines, long lines scroll horizontally, the icon button does not overlap the first line of text, and the box matches the neutral UI (no colour beyond existing tokens).

## 3. Verification

- [x] 3.1 Run `npm run lint`, `npm run typecheck`, and `npm test`; verify all pass.
- [x] 3.2 Manual end-to-end check in `npm run dev` with the fixture paper (`tests/fixtures/k349-paper.ts` code_writing part): type indented Python using Tab and Enter, navigate next/previous, confirm the exact text and line numbers are restored, submit, and confirm marking/result flow is unchanged.
- [x] 3.3 Manual check of the Python Tutor button: type a short program that uses `input()` and `print()`, click the icon, confirm a new tab opens at pythontutor.com with the code pre-filled in edit mode and Python 3 selected, run it there, then confirm the attempt page's textarea and form state are unchanged and the page did not navigate.
