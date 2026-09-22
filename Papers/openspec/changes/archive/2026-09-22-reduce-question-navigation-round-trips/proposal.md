# Proposal

## Why

Clicking "Save and next" (or "Previous") on a student question page still shows a noticeable "Saving..." pause. The earlier `speed-up-student-question-navigation` change removed redundant work, but the remaining path is a chain of roughly twelve *serial* database round trips: one active-access-code check plus five sequential queries to save, then a redirect that repeats the access-code check and runs five more sequential queries to render the next question. On a hosted Postgres reached through a pooler, every serial round trip adds tens of milliseconds, so the wait is dominated by query count rather than query cost.

## What Changes

- Collapse the save path's attempt → question → parts lookups into a single joined query that still enforces session ownership and the `in_progress` status check.
- Run the save-path writes (part-answer bulk upsert and attempt `lastSeenAt`/`elapsedSeconds` update) concurrently instead of one after the other.
- Restructure the question display loader so independent reads (paper metadata, ordered question list, current-question parts, saved answers for those parts) are issued concurrently after the single attempt lookup, rather than as five sequential awaits.
- Avoid the duplicated active-access-code check when a server action redirects into a page render in the same request, by memoising the student session lookup per request.
- Keep server-confirmed navigation: the next question is still only shown after the save has succeeded. No optimistic navigation, no schema change, no change to what students see.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `student-practice-attempts`: The "Responsive question navigation" requirement is strengthened. It currently only forbids redundant full-attempt answer loading; it will additionally require that the save-and-navigate path validates the attempt and loads the current question's parts in one query, issues independent reads and writes concurrently, and does not repeat the access-code validity check within a single navigation request.

## Impact

- `lib/student/data.ts`: `getStudentQuestionForSave`, `saveQuestionAnswers`, `updateStudentAttemptProgress`, `getStudentQuestion`.
- `lib/auth/session.ts`: `getStudentSession` / `requireStudentSession` (per-request memoisation of the access-code check).
- `lib/student/actions.ts`: `saveQuestionAction` (no behavioural change; may pass the already-validated session/attempt through).
- `tests/student/question-data.test.ts`: the fake DB records operations sequentially; assertions about operation count and ordering will need to accommodate joined selects and concurrent execution.
- No changes to the database schema, the imported paper format, the student-facing UI, marking, or submission behaviour.
