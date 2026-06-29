## ADDED Requirements

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

## MODIFIED Requirements

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
