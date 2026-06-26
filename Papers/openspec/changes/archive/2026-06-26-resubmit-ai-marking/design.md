## Context

Student submission currently calls `submitStudentAttempt`, which marks every part once and stores each result in `part_answers`. The tutor attempt detail page reads those stored rows and displays score, marking status, student feedback, tutor rationale, missing rubric points, and exact-marking audit data.

The requested workflow is tutor-facing: after a submission exists, the tutor needs a way to send an existing AI-rubric answer back to Gemini and replace the stored AI mark with the latest result. The student answer, attempt identity, and imported paper schema remain the source of truth.

## Goals / Non-Goals

**Goals:**

- Let an authenticated tutor resubmit an existing `rubric_ai` part answer for AI marking from the attempt detail/results page.
- Reuse the same prompt, visible stimuli, marking schema, max score, and stored student answer that initial submission marking uses.
- Replace the stored marking result fields with the new AI result, including failed status when Gemini cannot provide a valid mark.
- Keep student-facing feedback hint-safe and preserve existing tutor-only access controls.

**Non-Goals:**

- No student-triggered remarking.
- No answer editing, manual score override, or marking history in this change.
- No database schema change unless implementation discovers an existing field cannot represent the required state.
- No remarking for exact, code-output-table, or error-correction parts.

## Decisions

### Reuse one server-side marking write path

Extract the common "mark this saved attempt part and persist the result" behavior from `submitStudentAttempt` into a reusable server-side helper. Initial submission can continue to loop through all parts, while tutor remarking calls the helper for one selected part.

Alternative considered: duplicate the marking/update code in a tutor action. That would be faster to write but risks diverging prompts, status handling, and stored fields between initial marking and remarking.

### Make remarking a tutor-only server action

Add a server action, colocated with the admin attempt route or an admin actions module, that calls `requireTutorSession`, validates the attempt and part, performs the remark, and redirects back to the attempt detail page with a compact outcome indicator.

Alternative considered: add a public route handler. A server action fits the existing Next.js form pattern, avoids exposing a new unauthenticated endpoint surface, and keeps the UI simple.

### Restrict eligibility before calling Gemini

Only allow remarking when the attempt exists, the selected part belongs to the attempt's paper version, the marking mode normalizes to `rubric_ai`, and there is a saved answer row to remark. Ineligible requests return/redirect without calling Gemini.

Alternative considered: allow remarking any part by re-running the local marker. The user's need is specifically resubmitting to AI, and broad remarking would expand UI and test scope without solving a current problem.

### Replace the current result rather than store history

The new mark overwrites `score`, `maxScore`, `markingStatus`, `studentFeedback`, `tutorRationale`, `missingRubricPoints`, `exactMarkingDetails`, `markedAt`, and `updatedAt` on the existing `part_answers` row.

Alternative considered: add a remark history table. History is useful for auditing but would require schema, UI, and retention decisions outside the requested "resubmit to AI again" workflow.

## Risks / Trade-offs

- Gemini may fail again or return invalid output -> keep using the existing failed marking result shape so the tutor can see the failure without blocking review.
- A tutor could click remark repeatedly and incur extra AI calls -> limit the action to tutor-authenticated pages and make the button text/state explicit; consider a pending/disabled state in the client component if implementation needs it.
- Overwriting results loses prior AI rationale -> acceptable for this change because no history was requested; future audit history can build on the same helper.
- Remarking stale paper schema could be ambiguous after imports -> use the attempt's stored `paperVersionId` and part rows, matching the version used for the original submission.

## Migration Plan

- No database migration is expected because existing `part_answers` columns already represent marked and failed AI results.
- Deploy code changes with tests.
- Rollback by removing the tutor remark action/control; existing stored marks remain valid.

## Open Questions

- None for the initial implementation.
