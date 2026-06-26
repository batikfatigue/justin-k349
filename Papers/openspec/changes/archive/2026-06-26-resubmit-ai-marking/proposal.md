## Why

Tutors currently get a single AI mark when a student submits, so a failed or questionable Gemini result cannot be regenerated from the tutor review workflow. Allowing a tutor to resubmit an existing answer for AI marking gives them a controlled way to recover from transient failures or refresh an AI judgement without changing the student's submitted work.

## What Changes

- Add a tutor-only action on the submission results / attempt detail page to resubmit eligible AI-marked answers to Gemini for marking again.
- Reuse the stored student answer and imported marking schema when remarking, rather than asking the student to resubmit or editing the answer.
- Replace the stored AI marking result for the selected part with the latest score, student-safe feedback, tutor rationale, missing rubric points, status, and marked timestamp.
- Surface success and failure states on the tutor page so the tutor can see whether the latest AI remark succeeded or still needs manual review.
- Preserve existing student access controls and student-safe feedback separation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ai-assisted-marking`: AI-marked rubric answers can be re-sent to Gemini by an authenticated tutor after submission, and the stored mark is updated with the latest AI result.
- `tutor-attempt-review`: Tutor attempt review exposes a controlled remark action for AI-marked submitted answers and refreshes the displayed marking status/result after the action completes.

## Impact

- Affects tutor attempt detail UI under `app/admin/attempts/[attemptId]/page.tsx`.
- Adds or updates tutor-only server action/data code for remarking an existing `part_answers` row.
- Reuses `markPartAnswer` / Gemini marking logic and existing `part_answers` fields; no new dependency is expected.
- Tests should cover tutor access, eligible/ineligible remarking, result replacement, and failed Gemini remark behavior.
