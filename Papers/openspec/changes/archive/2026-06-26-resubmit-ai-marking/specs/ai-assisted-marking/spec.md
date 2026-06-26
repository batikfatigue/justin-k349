## ADDED Requirements

### Requirement: Tutor can rerun AI marking for submitted answers
The system SHALL allow an authenticated tutor to resubmit an existing submitted `rubric_ai` answer to Gemini for marking without changing the stored student answer.

#### Scenario: AI remark succeeds
- **WHEN** a tutor requests AI remarking for a submitted attempt part whose marking mode is `rubric_ai`
- **THEN** the system sends Gemini the stored student answer, prompt, visible stimuli, marking schema, and max score for that attempt's paper version and replaces the stored marking result with the new score, student feedback, tutor rationale, missing rubric points, marking status, and marked timestamp

#### Scenario: AI remark fails
- **WHEN** Gemini is unavailable or returns invalid marking output during tutor-requested remarking
- **THEN** the system stores a failed marking status and failure rationale for that part while leaving the student's submitted answer and attempt status unchanged

#### Scenario: Non-AI part is not sent to Gemini
- **WHEN** a tutor requests AI remarking for a part whose marking mode is not `rubric_ai`
- **THEN** the system MUST NOT call Gemini and MUST NOT replace the stored mark
