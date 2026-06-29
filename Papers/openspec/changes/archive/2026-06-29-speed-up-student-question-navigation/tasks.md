## 1. Optimize Student Question Data Paths

- [x] 1.1 Add a lean save loader that validates the student session owns an in-progress attempt and fetches only the current question plus its answerable parts.
- [x] 1.2 Update question saving to use the lean save loader instead of the full display loader.
- [x] 1.3 Persist all current-question part answers with one bulk upsert while preserving the existing answer, marking reset, feedback reset, and timestamp fields.
- [x] 1.4 Update elapsed seconds/last-seen from the save path without performing a second full attempt fetch.
- [x] 1.5 Narrow question display loading so saved answers are fetched only for the currently visible question parts.

## 2. Add Student Navigation Feedback

- [x] 2.1 Add a small client navigation-controls component that disables previous/next/submit controls while the form submission is pending.
- [x] 2.2 Show concise pending feedback during previous, next, and submit actions without changing the existing page layout or navigation semantics.
- [x] 2.3 Replace the inline question page navigation buttons with the pending-aware component.

## 3. Verify Behavior and Performance-Sensitive Regressions

- [x] 3.1 Add regression coverage that saving a multi-part question persists every visible part answer through optimized navigation.
- [x] 3.2 Add regression coverage that returning to a saved question restores only the visible question's saved answers and does not expose marking metadata.
- [x] 3.3 Add component coverage for duplicate-submit prevention and pending feedback on question navigation controls.
- [x] 3.4 Run `npm run typecheck` and the relevant Vitest suite.
