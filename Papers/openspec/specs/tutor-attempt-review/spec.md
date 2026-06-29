# tutor-attempt-review Specification

## Purpose
TBD - created by archiving change build-practice-exam-paper-app. Update Purpose after archive.
## Requirements
### Requirement: Tutor-only access
The system SHALL protect tutor-only pages with a single tutor password session.

#### Scenario: Tutor logs in successfully
- **WHEN** a tutor submits the configured password
- **THEN** the system creates an authenticated tutor session for admin pages

#### Scenario: Unauthenticated user opens admin page
- **WHEN** a user without a valid tutor session requests an admin page
- **THEN** the system redirects or blocks the request without exposing attempt, answer, accepted-answer, expected-output, rubric, or model-answer data

### Requirement: Tutor can review attempts
The system SHALL provide a tutor view of student attempts for imported papers using human-readable answer and marking details.

#### Scenario: Tutor opens attempt list
- **WHEN** the tutor opens the attempts view
- **THEN** the system lists attempts with paper title, student name, attempt number, status, started time, submitted time, and elapsed seconds when available

#### Scenario: Tutor opens attempt detail
- **WHEN** the tutor selects an attempt
- **THEN** the system shows each question, each answerable part, the student answer for each part, marking status, awarded score, mark source, student-safe feedback, and tutor-only rationale when available in a readable wrapped layout without raw JSON review blocks

#### Scenario: Tutor reviews exact-marked parts
- **WHEN** the tutor opens an attempt detail containing exact, code-output-table, or error-correction marks
- **THEN** the system shows the relevant expected values, accepted alternatives, row-level results, or corrected-line targets needed to audit the mark

### Requirement: Tutor can manually override stored marks
The system SHALL allow an authenticated tutor to manually override the stored mark for any saved answer on a submitted attempt.

#### Scenario: Tutor opens submitted saved answer
- **WHEN** an authenticated tutor opens a submitted attempt detail containing a saved answer row
- **THEN** the page shows a manual override control for that answer

#### Scenario: Tutor saves valid manual override
- **WHEN** an authenticated tutor submits an integer score within the server-stored max score range plus replacement student feedback and optional tutor rationale
- **THEN** the system updates the stored answer mark, marks the source as manual, and reloads the attempt detail with the manual result visible

#### Scenario: Invalid override is rejected
- **WHEN** a manual override request references a missing attempt, non-submitted attempt, missing part, missing answer, or score outside the server-stored range
- **THEN** the system rejects the update without changing the stored answer mark

#### Scenario: Unauthenticated user cannot override
- **WHEN** a user without a valid tutor session attempts to invoke the manual override action
- **THEN** the system blocks the request before loading attempt, answer, rubric, or model-answer data

### Requirement: Tutor can see reattempt history
The system SHALL group or identify repeat attempts by student name, access code, and paper.

#### Scenario: Student has multiple attempts
- **WHEN** the tutor reviews attempts for a paper
- **THEN** the system makes each attempt number visible so the tutor can compare reattempts

### Requirement: Tutor can see abandoned attempts
The system SHALL include stale in-progress attempts in tutor review as abandoned attempts.

#### Scenario: Attempt times out without submission
- **WHEN** an attempt exceeds the heartbeat inactivity timeout
- **THEN** the tutor view identifies the attempt as abandoned and shows the latest saved part answers and last seen time

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
