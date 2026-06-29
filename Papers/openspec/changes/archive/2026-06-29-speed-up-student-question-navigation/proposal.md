## Why

Students experience a noticeable delay when moving between questions during an attempt because each page turn waits for multiple server/database operations before rendering the next question. This should feel near-immediate while still preserving the current guarantee that answers are durably saved before navigation or submission.

## What Changes

- Reduce redundant data loading in the student question save path.
- Persist all answers for the current question with fewer database round trips.
- Keep navigation semantics unchanged: moving next or previous saves the current question first, then shows the requested question.
- Add a lightweight pending state for question navigation controls so students get immediate feedback after clicking.
- Keep all marking metadata and accepted-answer data server-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `student-practice-attempts`: Add a responsiveness requirement for moving between questions while preserving durable per-part answer persistence.

## Impact

- Affects the student attempt question route, student save action/data helpers, answer navigation controls, and related student flow tests.
- No database schema changes, public API changes, new dependencies, or breaking changes are expected.
