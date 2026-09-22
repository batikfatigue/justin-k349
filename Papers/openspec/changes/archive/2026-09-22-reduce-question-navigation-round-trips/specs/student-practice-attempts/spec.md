# Spec Delta

## MODIFIED Requirements

### Requirement: Responsive question navigation
The system SHALL minimize avoidable loading time when students move between questions during an in-progress practice attempt while preserving server-side answer persistence. A single previous/next navigation request SHALL validate the attempt and load the current question's answerable parts in one database read, SHALL issue reads and writes that do not depend on each other concurrently rather than sequentially, and SHALL validate the student's access code at most once.

#### Scenario: Student moves to another question
- **WHEN** a student clicks previous or next from a question with one or more answerable parts
- **THEN** the system saves the current question's part answers before showing the requested question without performing redundant full-attempt answer loading

#### Scenario: Student sees navigation feedback
- **WHEN** a student submits previous, next, or final submission navigation from a question page
- **THEN** the system provides immediate pending feedback and prevents duplicate navigation submissions while the save is in progress

#### Scenario: Student revisits a saved question after optimized navigation
- **WHEN** a student returns to a question whose answers were saved through optimized navigation
- **THEN** the system shows the previously saved answers for each visible answerable part without exposing accepted answers, expected outputs, corrected-line targets, model answers, rubrics, or marking metadata

#### Scenario: Save validates and loads in one read
- **WHEN** a student saves answers for the current question during navigation
- **THEN** the system confirms the attempt belongs to the student's session and is in progress and loads that question's answerable parts using a single database read, and rejects the save with not-found when the attempt is missing, owned by another student, or no longer in progress

#### Scenario: Save writes run concurrently
- **WHEN** the current question's answers are being persisted during navigation
- **THEN** the part-answer upsert and the attempt progress update (elapsed seconds and last-seen time) are issued without waiting on each other, and navigation proceeds only after both have completed

#### Scenario: Question page loads independent data concurrently
- **WHEN** the requested question page is rendered after a save
- **THEN** paper details, the question list, the current question's parts, and the saved answers for those parts are fetched without sequential dependence on one another beyond the single attempt lookup, and the rendered content is identical to the current behaviour

#### Scenario: Access code checked once per navigation
- **WHEN** a single navigation request saves the current question and renders the requested question
- **THEN** the system validates the session's access code against the database at most once, and a deactivated access code still causes the request to be refused
