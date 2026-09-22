# Design

## Context

See proposal.md - Why. Today `components/student/AnswerControls.tsx` is a server-compatible component; for `code_writing` it renders `<textarea name="part-<id>" className="code-block" spellCheck={false}>` and the question page's `<form>` posts it through `parseAnswer` in `lib/student/data.ts`, which reads `formData.get("part-<id>")` into `{ value }`. The only existing client component in the student area is `Stopwatch.tsx` (`"use client"`). The UI must stay within the "AI Neutral student interface" requirement (system fonts, black text, restrained controls), and `.code-block` styling (`white-space: pre; overflow-x: auto; line-height: 1.5`) already exists in `app/globals.css`.

## Goals / Non-Goals

**Goals:**
- Keep the answer a native `<textarea>` with the existing `name`, so form submission, `parseAnswer`, saving, revisiting, and marking need no changes.
- Zero new runtime dependencies; a single small client component.
- Behave predictably under jsdom so key handling can be unit-tested with `@testing-library/react`.

**Non-Goals:**
- Syntax highlighting, autocomplete, bracket matching, or running code inside the app (user chose the lightweight option). Running is delegated to Python Tutor in a new tab — see Decision 7.
- Changing the `code_writing` response schema, `lines`, or `language` handling beyond reading `lines` for the initial height.
- Touching the admin JSON editor (`.json-editor`).

## Decisions

1. **Native textarea + gutter, not contenteditable or a library.**
   A `<textarea>` keeps native undo, IME, mobile keyboards, form participation, and accessibility for free. A `contenteditable` would require serialising HTML to text and re-implementing selection, undo and form submission. CodeMirror/Monaco were rejected per the user's choice (bundle size, dependency, visual weight against the neutral UI).

2. **Component shape: `components/student/CodeEditor.tsx` (`"use client"`).**
   Props: `{ name: string; defaultValue: string; rows?: number }`. It owns local `value` state (initialised from `defaultValue`) so the gutter can derive `value.split("\n").length`. The textarea is controlled (`value`/`onChange`) but still uncontrolled from the form's perspective — the form reads the DOM value on submit exactly as before. `AnswerControls` stays a plain component and just branches `isCode ? <CodeEditor .../> : <textarea .../>`.

3. **Key handling in `onKeyDown` with manual `setRangeText`-style edits.**
   - Tab / Shift+Tab: `preventDefault()`, compute new text and caret from `selectionStart`/`selectionEnd`, set state, then restore the selection in a `requestAnimationFrame`/effect after React re-renders. Multi-line selections indent/outdent every touched line. Indent unit is a constant `"    "` (4 spaces) — Python convention, matches `tab-size: 4`.
   - Enter: `preventDefault()`, take the leading whitespace of the current line, append 4 spaces if the trimmed line ends with `:`, insert `"\n" + indent`. Shift/Ctrl/Meta+Enter fall through (they submit the form today in some browsers; we don't change that).
   - Escape: sets a `tabTrapDisabled` ref to `true`; the next Tab is not intercepted and the ref resets on `onBlur` or on any other key. This is the standard escape hatch recommended for keyboard-trapping editors.
   Alternative considered: `document.execCommand("insertText")` preserves native undo but is deprecated and unsupported in jsdom; rejected.

4. **Gutter sync.**
   The gutter is a `<div aria-hidden>` of line numbers rendered next to the textarea inside a flex wrapper with the same `font-family`, `font-size`, `line-height`, and vertical padding. Horizontal scroll is on the textarea only; vertical scrolling of the gutter is kept in sync by mirroring `textarea.scrollTop` onto the gutter in `onScroll`. Because the textarea uses `white-space: pre` / `wrap="off"`, one logical line == one visual line, so counting `\n` is exact. Resizing is `resize: vertical` on the wrapper via the textarea, same as now.

5. **Styling.**
   New classes in `app/globals.css`: `.code-editor` (flex wrapper, border/radius reusing `--line`/`--radius`), `.code-editor-gutter` (right-aligned, muted `color: var(--muted)` or similar existing token, `user-select: none`), `.code-editor textarea` (no own border, `white-space: pre`, `overflow: auto`, `tab-size: 4`, monospace stack already used by `pre, code`). Focus ring moves to the wrapper via `:focus-within` so the whole box outlines, matching existing `:focus-visible` treatment. Minimum height derives from `rows` (`responseSchema.lines ?? 10`) as before.

6. **Textarea attributes.** `spellCheck={false} autoCorrect="off" autoCapitalize="off" wrap="off"` plus `aria-label="Answer"` so the existing "Answer" label semantics are kept (the visible `<label>` wraps the component as today).

7. **"Try it" = open in Python Tutor in a new tab; no in-app runner.**
   The requirement is only "run to check output without saving", and exam-style questions use `input()` heavily. An embedded Pyodide runner would need a Web Worker, a ~10 MB download, and stdin engineering for blocking `input()`; Python Tutor already handles all of this (Python 3, `input()` prompts, step-through visualisation) and accepts code in the URL fragment, so the whole feature is one button.
   - A single icon-only `<button type="button" className="code-editor-open" aria-label="Open in Python Tutor" title="Open in Python Tutor">` positioned in the top-right corner of the `.code-editor` wrapper (absolutely positioned; wrapper gets `position: relative`). The glyph is an inline SVG "open in new window" arrow (box with an arrow leaving the top-right), monochrome via `currentColor`, ~16px, so it stays within the neutral UI; no text label, no emoji.
   - `type="button"` so it never submits the form. On click it reads the current textarea value (from state) and calls `window.open(url, "_blank", "noopener,noreferrer")`, where `url = "https://pythontutor.com/visualize.html#code=" + encodeURIComponent(value) + "&mode=edit&py=3"`. The URL is built in a small pure helper `buildPythonTutorUrl(code: string): string` exported from the component module so it can be unit-tested without a browser.
   - Empty code still opens Python Tutor (with an empty editor) rather than disabling the button — simpler, and still useful.
   - Nothing is posted to our server, no state changes, no analytics. The textarea and form are untouched by the click.
   - Alternatives considered: embedded Pyodide (rejected: bundle size, `input()` handling, infinite-loop termination, exam-conditions concern); JupyterLite REPL `?code=` (viable but needs hosting or a third-party demo URL, and Python Tutor's visualiser is more useful for "predict the output" practice). Trailing spaces/very long programs: Python Tutor's fragment limit is generous (tens of KB); exam answers are far below it.

## Risks / Trade-offs

- [Controlled textarea re-renders on every keystroke] → Component is tiny and per-part; no measurable cost. Only local state, no context.
- [Manual text edits break native undo history for Tab/Enter insertions] → Accepted; the same trade-off every textarea-based editor makes. Ordinary typing still has native undo.
- [Tab trapping harms keyboard navigation] → Escape-then-Tab escape hatch, documented in spec; matches ARIA authoring practice for text editors.
- [Gutter and textarea line heights drift on some fonts] → Both use identical font/line-height/padding declarations from the same CSS rule; add a jsdom-independent visual check in the manual test plan.
- [Hydration mismatch if server renders textarea and client renders editor] → `CodeEditor` renders the same DOM on server and client (state initialised from `defaultValue`); no `useEffect`-only rendering.
- [Existing `.code-block` class no longer applied to the answer textarea] → Nothing else targets `.code-block` on textareas; stimulus rendering keeps using it.
- [Dependency on third-party pythontutor.com availability / URL format] → Failure mode is benign (the tab opens but code isn't pre-filled, or the site is down); the answer flow is unaffected. The URL is built in one helper, so a format change is a one-line fix. Python Tutor's `#code=...&mode=edit&py=3` permalink format has been stable for over a decade.
- [Popup blockers] → `window.open` is invoked synchronously inside a user click handler, which browsers allow by default. If blocked, nothing happens; acceptable.
- [Icon-only button discoverability] → `aria-label` + `title` tooltip; positioned consistently in the editor corner. Screen readers read "Open in Python Tutor".
- [Students could "cheat" by running code during practice] → This is a practice platform, not a timed exam, and the user explicitly wants students to be able to check output. No per-question toggle for now; can be added to `responseSchema` later if needed.

## Migration Plan

Pure front-end change; deploy with the app. Rollback is reverting the `AnswerControls` branch to the plain textarea. No data migration — stored answers are unchanged plain text.
