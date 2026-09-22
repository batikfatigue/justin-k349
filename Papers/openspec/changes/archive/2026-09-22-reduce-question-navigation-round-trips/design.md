# Design

## Context

See proposal.md - Why. Observed request path for one "Save and next" click today:

1. `saveQuestionAction` (`lib/student/actions.ts`) awaits `requireStudentSession()`, which runs a `select` on `access_codes` to confirm the code is still active.
2. `saveQuestionAnswers` (`lib/student/data.ts`) awaits `getStudentQuestionForSave`: `select attempts` → `select questions ... limit 1 offset n-1` → `select question_parts`, then awaits the `part_answers` bulk upsert, then awaits `updateStudentAttemptProgress` (`update attempts`).
3. `redirect()` causes Next.js to render `app/attempts/[attemptId]/questions/[questionIndex]/page.tsx` inside the same POST response. That page awaits `requireStudentSession()` again (another `access_codes` select), then `getStudentQuestion`: `select attempts` → `select papers` → `select questions` (all for the version) → `select question_parts` → `select part_answers`.

Twelve database round trips, all serial. The DB client is `postgres` (postgres-js) with a pool of 5 and `prepare: false`, so concurrent queries from one request can genuinely run in parallel on separate pooled connections. Drizzle joins (`innerJoin`/`leftJoin`) and `Promise.all` are already used in `lib/student/data.ts` and `lib/admin/data.ts`, so no new patterns or dependencies are introduced.

Constraints carried over from the archived `speed-up-student-question-navigation` change: navigation stays server-confirmed, answer keys and marking metadata stay server-only, and the student UI does not change.

## Goals / Non-Goals

**Goals:**

- Cut the serial round trips for one navigation from ~12 to ~4 (access-code check, one save read, one concurrent write pair, one attempt read followed by one concurrent display read batch).
- Keep every existing ownership / `in_progress` / not-found check intact.
- Keep the returned display model byte-for-byte identical so `page.tsx` and its components are untouched.

**Non-Goals:**

- Optimistic or client-side navigation.
- Caching question/paper content across requests (`unstable_cache`, Redis, etc.).
- Trusting client-supplied question or part ids for the save path beyond what is already trusted (`attemptId`, `questionNumber`).
- Changing the `attempts` heartbeat endpoint or the stopwatch.

## Decisions

1. **Single joined read for the save path**
   - Decision: Replace the three sequential selects in `getStudentQuestionForSave` with one query: `attempts` filtered by id + session ownership + `status = 'in_progress'`, `innerJoin questions` on `paper_version_id` restricted to the nth question by position, `leftJoin question_parts` on the question id, ordered by `question_parts.position`. The nth-question restriction is expressed as a correlated subquery (`questions.id = (select id from questions where paper_version_id = attempts.paper_version_id order by position limit 1 offset n-1)`) via Drizzle `sql`.
   - Result shape: zero rows → `notFound()` (covers missing attempt, wrong owner, submitted attempt, and out-of-range question number in one check). One row per part; a `leftJoin` guarantees a question with zero parts still returns one row with null part columns so the attempt-progress update still happens.
   - Alternative considered: pass `questionId` as a hidden form field to avoid the subquery. Rejected - it widens what the client controls and requires a form change; the correlated subquery keeps the contract identical.
   - Alternative considered: two concurrent queries (attempt; question+parts by version). Rejected - the question lookup depends on `paper_version_id` from the attempt, so it cannot be issued independently without trusting the client.

2. **Concurrent writes in `saveQuestionAnswers`**
   - Decision: Issue the `part_answers` upsert and `updateStudentAttemptProgress` together with `Promise.all`. Both only need the validated attempt id and `now`; neither reads the other's result. Skip the upsert (but still run the update) when there are no parts, as today.
   - Alternative considered: wrap both in a single transaction. Rejected - a transaction serialises on one connection and adds BEGIN/COMMIT round trips; the two writes are already idempotent and independently safe, and the current code does not use a transaction either.

3. **Fan-out reads in `getStudentQuestion`**
   - Decision: Keep the initial `attempts` select as the single dependent step (it supplies `paperId` and `paperVersionId` and also drives `notFound()`). Then run in one `Promise.all`: `papers` select, `questions` select for the version (needed for `questionCount` and to resolve the nth question), and `question_parts` select for the version filtered by the nth question. Because the nth question's id is not known until the `questions` select resolves, resolve parts with a correlated subquery on position (same shape as Decision 1) so it does not have to wait. Then run the `part_answers` select for the returned part ids. This is 1 + 1 + 1 = 3 serial steps instead of 5.
   - Alternative considered: single mega-join returning question × parts × answers. Rejected - `allQuestions` is still needed for `questionCount`, and denormalising paper + question + parts + answers into one row set makes the display mapping code (stimulus normalisation, choice normalisation) harder to keep identical.
   - Alternative considered: also fold the `part_answers` select into the parts query with a `leftJoin` filtered by `attempt_id`. This is a reasonable further step (2 serial steps total) and is left as an implementation option if the joined row mapping stays simple; the spec only requires independence, not a specific count.

4. **Take the access-code check off the serial path (revised during implementation)**
   - Original plan: wrap `getStudentSession` in React `cache()` so the action and the redirected page render share one check. Verified empirically against `next dev` with a real browser click: the action phase and the redirected render phase do **not** share a `cache` scope in Next 14.2 - two `access_codes` selects were still issued per click. `React.cache` is also absent from the stable React 18.3 build used by Vitest, so it would have needed a runtime fallback anyway. Dropped.
   - Decision (action side): the save path no longer runs a standalone access-code check. `saveQuestionAction` reads the signed cookie synchronously (`peekStudentSession`) and the single joined save query `innerJoin`s `access_codes` on `id` + `active = true`. If that join returns zero rows, the code falls back to `requireStudentSession()` before `notFound()`, so a deactivated code still redirects to `/` (the reason the plain "fold into the join" alternative was originally rejected) while a missing/foreign/submitted attempt still yields not-found. Zero extra round trips on the happy path.
   - Decision (render side): `page.tsx` reads the cookie synchronously, then runs `requireStudentSession()` and `getStudentQuestion(...)` in one `Promise.all`. The question load's outcome is captured (settled) so the access-code result always wins: a deactivated code redirects even if the data load would have thrown not-found.
   - Net effect: one standalone `access_codes` select per navigation (the render-side one), overlapped with the attempt lookup rather than ahead of it. Measured: a "Save and next" POST now issues 4 serial round trips (joined save read → concurrent upsert + progress update → concurrent access-code check + attempt read → concurrent paper/questions/parts/answers reads) versus ~12 before.

5. **Test strategy stays on the existing fake DB**
   - Decision: Extend the `FakeDb`/`SelectBuilder` in `tests/student/question-data.test.ts` with `innerJoin`/`leftJoin` recording and a way to seed joined row results, rather than introducing a real Postgres test dependency. Assertions move from "operation N is X" to "the set of operations contains exactly these kinds/tables", since concurrent execution makes push order non-deterministic across `Promise.all` members.
   - Alternative considered: integration tests against a real database (there is a `tests/integration` folder). Considered valuable but out of scope for the round-trip reduction; the unit-level fake already covers the payload/field-preservation regressions from the previous change.

## Risks / Trade-offs

- [Correlated subquery for the nth question is less obvious than `limit/offset`] → Keep it in one small helper (`nthQuestionIdForVersion(versionExpr, n)`) shared by save and display paths; unit tests assert `notFound()` for an out-of-range number.
- [`leftJoin` row explosion mis-mapped into parts] → Map rows by `question_parts.id`, skip null part rows, and assert parts order and count in tests for a two-part question.
- [Concurrent writes: progress update succeeds but upsert fails] → Same failure mode exists today in reverse order (upsert succeeds, update fails). The action surfaces the error and the student stays on the page; re-submitting is idempotent because the upsert is keyed on `(attempt_id, question_part_id)`.
- [Pool exhaustion under `max: 5` when several students navigate simultaneously] → Each request now holds at most 3 connections for a few ms instead of 1 for longer; postgres-js queues excess queries rather than failing. Monitor; raise `max` only if wait times appear.
- [`React.cache` scope assumption is wrong] → Covered by the explicit fallback in Decision 4; the task list includes verifying this empirically with a temporary log before choosing.
- [Fake-DB test assertions become order-insensitive and could miss a regression in ordering] → Ordering is not a behavioural requirement anywhere in the spec; field payloads and table targets are, and those assertions remain exact.

## Migration Plan

No schema or data migration. Deploy as a normal application release. Rollback is a code revert; the database contents written by the new path are identical in shape to today's.
