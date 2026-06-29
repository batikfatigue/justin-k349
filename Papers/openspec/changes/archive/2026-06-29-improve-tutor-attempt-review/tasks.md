## 1. Data Model and Persistence

- [x] 1.1 Add `markingSource` / `marking_source` to the part-answer schema with default `auto`.
- [x] 1.2 Add a migration that backfills existing part answers to `auto`.
- [x] 1.3 Ensure automatic marking and AI remarking persist `markingSource = "auto"`.

## 2. Manual Override

- [x] 2.1 Add a server-side manual override helper that validates submitted attempt, part membership, saved answer, and score range.
- [x] 2.2 Add an authenticated admin server action that calls the helper and redirects with outcome state.
- [x] 2.3 Render a manual override form for saved answers on submitted attempts.

## 3. Human-Readable Review UI

- [x] 3.1 Replace generic JSON review blocks with semantic answer, marking schema, missing-rubric, rationale, and audit renderers.
- [x] 3.2 Add wrapping review styles that avoid horizontal scrolling for tutor-facing review content while preserving code formatting where appropriate.
- [x] 3.3 Display the current mark source alongside score and status.

## 4. Tests and Verification

- [x] 4.1 Add admin helper/action tests for manual override success, auth ordering, and rejection cases.
- [x] 4.2 Update component tests for readable review content, manual override controls, mark source, and AI remark controls.
- [x] 4.3 Run OpenSpec validation, typecheck, targeted admin tests, and the full test suite.
