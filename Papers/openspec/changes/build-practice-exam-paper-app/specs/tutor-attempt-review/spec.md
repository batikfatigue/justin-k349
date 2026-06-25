## ADDED Requirements

### Requirement: Tutor-only access
The system SHALL protect tutor-only pages with a single tutor password session.

#### Scenario: Tutor logs in successfully
- **WHEN** a tutor submits the configured password
- **THEN** the system creates an authenticated tutor session for admin pages

#### Scenario: Unauthenticated user opens admin page
- **WHEN** a user without a valid tutor session requests an admin page
- **THEN** the system redirects or blocks the request without exposing attempt, answer, accepted-answer, expected-output, rubric, or model-answer data

### Requirement: Tutor can review attempts
The system SHALL provide a tutor view of student attempts for imported papers.

#### Scenario: Tutor opens attempt list
- **WHEN** the tutor opens the attempts view
- **THEN** the system lists attempts with paper title, student name, attempt number, status, started time, submitted time, and elapsed seconds when available

#### Scenario: Tutor opens attempt detail
- **WHEN** the tutor selects an attempt
- **THEN** the system shows each question, each answerable part, the student answer for each part, marking status, awarded score, student-safe feedback, and tutor-only rationale when available

#### Scenario: Tutor reviews exact-marked parts
- **WHEN** the tutor opens an attempt detail containing exact, code-output-table, or error-correction marks
- **THEN** the system shows the relevant expected values, accepted alternatives, row-level results, or corrected-line targets needed to audit the mark

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
