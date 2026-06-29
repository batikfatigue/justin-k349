## ADDED Requirements

### Requirement: Responsive question navigation
The system SHALL minimize avoidable loading time when students move between questions during an in-progress practice attempt while preserving server-side answer persistence.

#### Scenario: Student moves to another question
- **WHEN** a student clicks previous or next from a question with one or more answerable parts
- **THEN** the system saves the current question's part answers before showing the requested question without performing redundant full-attempt answer loading

#### Scenario: Student sees navigation feedback
- **WHEN** a student submits previous, next, or final submission navigation from a question page
- **THEN** the system provides immediate pending feedback and prevents duplicate navigation submissions while the save is in progress

#### Scenario: Student revisits a saved question after optimized navigation
- **WHEN** a student returns to a question whose answers were saved through optimized navigation
- **THEN** the system shows the previously saved answers for each visible answerable part without exposing accepted answers, expected outputs, corrected-line targets, model answers, rubrics, or marking metadata
