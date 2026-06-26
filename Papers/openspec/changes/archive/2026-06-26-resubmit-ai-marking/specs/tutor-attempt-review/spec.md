## ADDED Requirements

### Requirement: Tutor can resubmit AI marking from attempt detail
The system SHALL provide a tutor-only control on the attempt detail page for resubmitting eligible AI-marked answers to Gemini.

#### Scenario: Eligible AI-marked answer shows remark control
- **WHEN** an authenticated tutor opens a submitted attempt detail containing a part marked with `rubric_ai`
- **THEN** the page shows a resubmit-to-AI marking control for that part

#### Scenario: Ineligible answer has no remark control
- **WHEN** an authenticated tutor opens an attempt detail for a non-AI-marked part or an attempt that has not been submitted
- **THEN** the page does not offer a resubmit-to-AI marking control for that answer

#### Scenario: Tutor sees latest AI remark result
- **WHEN** an authenticated tutor completes the resubmit-to-AI marking action
- **THEN** the attempt detail page reloads or refreshes with the latest marking status, score, student-safe feedback, tutor rationale, missing rubric points, and marked timestamp for that part

#### Scenario: Unauthenticated user cannot remark
- **WHEN** a user without a valid tutor session attempts to invoke the resubmit-to-AI marking action
- **THEN** the system blocks the request without calling Gemini or exposing attempt, answer, rubric, or model-answer data
