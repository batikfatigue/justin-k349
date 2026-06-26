# student-practice-attempts Specification

## Purpose
TBD - created by archiving change build-practice-exam-paper-app. Update Purpose after archive.
## Requirements
### Requirement: Code-gated paper discovery
The system SHALL require a valid access code and student name before showing practice papers.

#### Scenario: Student sees available papers
- **WHEN** a student submits a valid active access code and a non-empty name
- **THEN** the system shows only published papers associated with that access code

#### Scenario: Student enters invalid access code
- **WHEN** a student submits an invalid or inactive access code
- **THEN** the system refuses access and does not reveal paper titles for other codes

### Requirement: Practice attempt lifecycle
The system SHALL allow students to start and submit practice attempts, including repeat attempts for the same paper.

#### Scenario: Student starts a paper
- **WHEN** a student starts an available paper
- **THEN** the system creates an in-progress attempt with started time, attempt number, paper id, access-code id, and student name

#### Scenario: Student reattempts a paper
- **WHEN** a student starts the same paper again with the same access code and name
- **THEN** the system creates a new attempt linked to the same student identity and increments the attempt number

### Requirement: One-question multi-part answering flow
The system SHALL present one parent question at a time and persist each answerable part before navigation or submission.

#### Scenario: Student answers a multi-part question
- **WHEN** a student enters answers for one or more parts within the current question and moves to another question
- **THEN** the system saves each part answer separately and shows the requested question without exposing accepted answers, expected outputs, corrected-line targets, model answers, rubrics, or marking metadata

#### Scenario: Student returns to a previous question
- **WHEN** a student revisits an answered question in an in-progress attempt
- **THEN** the system shows the student's saved answers for each answerable part for further editing

#### Scenario: Student views imported stimuli
- **WHEN** a question contains text, code, table, expected-output, or structured flowchart stimuli
- **THEN** the system renders those stimuli while preserving code indentation, line breaks, table structure, and flowchart labels

### Requirement: Stopwatch and abandonment tracking
The system SHALL track elapsed practice time with a stopwatch and mark stale in-progress attempts as abandoned.

#### Scenario: Student submits attempt
- **WHEN** a student submits an attempt
- **THEN** the system stores submitted time, elapsed seconds, and submitted status

#### Scenario: Student leaves without submitting
- **WHEN** an in-progress attempt has no heartbeat activity past the configured timeout
- **THEN** the system treats the attempt as abandoned for tutor review

### Requirement: Immediate practice results
The system SHALL show results immediately after submission using total score and broad non-revealing feedback.

#### Scenario: Student views submitted results
- **WHEN** marking is complete after submission
- **THEN** the system shows the total score and broad per-part feedback without revealing accepted answers, expected outputs, corrected lines, model answers, rubrics, missing rubric points, or detailed rationale

#### Scenario: Marking is incomplete
- **WHEN** one or more rubric-marked part answers cannot be marked immediately
- **THEN** the system shows available exact-marked scores and a pending or partial marking state for the affected parts

### Requirement: AI Neutral student interface
The system SHALL use a minimal student interface with black text, whitespace, system fonts, and restrained controls.

#### Scenario: Student completes a paper on mobile or desktop
- **WHEN** the student uses the homepage, question view, or results view
- **THEN** the UI remains readable, uncluttered, and free of decorative color, oversized marketing sections, or overlapping text

