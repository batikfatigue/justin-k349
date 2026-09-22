# Tasks

## 1. Test Harness Preparation

- [x] 1.1 Extend `FakeDb`/`SelectBuilder` in `tests/student/question-data.test.ts` to record `innerJoin`/`leftJoin` calls and to return seeded joined rows per select, and verify the existing two tests still pass with `npx vitest run tests/student/question-data.test.ts`.
- [x] 1.2 Rewrite the existing operation assertions to be order-insensitive (match on operation kind/table/payload sets rather than array index) so they remain valid once reads/writes run concurrently, and verify the suite is green before touching `lib/`.

## 2. Save Path

- [x] 2.1 Add a shared `sql` helper that resolves the nth question id for a paper version by position (correlated subquery) in `lib/student/data.ts`, with a unit test asserting a missing nth question yields no rows and triggers `notFound()`.
- [x] 2.2 Replace the three sequential selects in `getStudentQuestionForSave` with one `attempts` ⨝ `questions` ⟕ `question_parts` query using the helper, mapping rows to `{ attempt, question, parts }`, and verify via the fake DB that exactly one select is issued and that wrong-owner, non-`in_progress`, and out-of-range cases all throw not-found.
- [x] 2.3 Verify a question with zero answerable parts still returns the attempt/question (one row with null part columns) and that `saveQuestionAnswers` skips the upsert but still updates attempt progress.
- [x] 2.4 Run the `part_answers` bulk upsert and `updateStudentAttemptProgress` concurrently with `Promise.all` in `saveQuestionAnswers`, and verify the existing "saves every visible part answer with one bulk upsert" test still asserts the identical upsert payload, conflict target, and `set` fields plus the progress `set` payload.

## 3. Display Path

- [x] 3.1 Restructure `getStudentQuestion` so that after the single `attempts` select, the `papers`, `questions`, and `question_parts` (via the nth-question helper) selects run in one `Promise.all`, followed by the `part_answers` select for the returned part ids; verify with the fake DB that no more than three sequential await points occur and the operation set is unchanged in kind/table.
- [x] 3.2 Verify the returned display model is unchanged by running the existing "restores saved visible answers without exposing marking metadata" test unmodified (apart from harness changes) and adding an assertion on `questionCount` and `question.number` for a two-question version.

## 4. Session Check Deduplication

- [x] 4.1 Wrap `getStudentSession` in React `cache()` in `lib/auth/session.ts` and verify with a temporary server-side log (removed before finishing) that one "Save and next" click against `npm run dev` performs a single `access_codes` select across the action and the redirected page render.
- [x] 4.2 If 4.1 shows two selects, implement the design's fallback: decode the cookie synchronously and run the access-code check concurrently with `getStudentQuestion` in `app/attempts/[attemptId]/questions/[questionIndex]/page.tsx`, honouring the check result before returning; verify with the same log that the check no longer adds a serial round trip.
- [x] 4.3 Verify a deactivated access code still redirects the student to `/` on the next navigation (manual check against a local DB, or an existing `tests/auth` test if one covers `requireStudentSession`).

## 5. Verification

- [x] 5.1 Run `npm run typecheck`, `npm run lint`, and `npm test`; all pass.
- [x] 5.2 Manually navigate a multi-part question forward and back against `npm run dev` with a hosted `DATABASE_URL`, confirm saved answers reappear, and confirm via query logging (e.g. `postgres` `debug` option or a temporary counter) that a single "Save and next" issues no more than ~5 serial round trips compared with ~12 before.
