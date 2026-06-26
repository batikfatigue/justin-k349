## 1. Shared Remarking Logic

- [x] 1.1 Extract reusable server-side logic that marks a saved attempt part and persists the marking result fields currently written during submission.
- [x] 1.2 Update `submitStudentAttempt` to use the shared helper while preserving existing submission behavior for all marking modes.
- [x] 1.3 Add eligibility handling so tutor-requested remarking only proceeds for submitted attempts, existing saved answers, matching paper-version parts, and normalized `rubric_ai` marking schemas.

## 2. Tutor Remark Action

- [x] 2.1 Add a tutor-only server action for resubmitting one attempt part to AI marking.
- [x] 2.2 Ensure the action calls `requireTutorSession` before loading answer, rubric, model-answer, or attempt details.
- [x] 2.3 Redirect or refresh back to the attempt detail page with a concise success or failure outcome after remarking.

## 3. Attempt Detail UI

- [x] 3.1 Show a resubmit-to-AI marking control only for eligible submitted `rubric_ai` parts on the tutor attempt detail page.
- [x] 3.2 Display the latest marked timestamp alongside the marking status/result when available.
- [x] 3.3 Keep non-AI parts, unsubmitted attempts, and unauthenticated users from seeing or invoking the AI remark control.

## 4. Verification

- [x] 4.1 Add unit or integration coverage for successful tutor-triggered AI remarking replacing score, feedback, rationale, missing rubric points, status, and marked timestamp.
- [x] 4.2 Add coverage for Gemini failure during tutor-triggered remarking storing failed status without changing the student answer or attempt status.
- [x] 4.3 Add coverage that ineligible non-`rubric_ai` parts do not call Gemini or replace stored marks.
- [x] 4.4 Add page/action coverage that the tutor attempt detail shows the control only for eligible AI-marked submitted answers.
- [x] 4.5 Run the relevant test suite and fix regressions.
