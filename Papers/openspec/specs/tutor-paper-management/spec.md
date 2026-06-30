# tutor-paper-management Specification

## Purpose
Provide authenticated tutor paper catalog management, including imported-paper visibility, selected-paper JSON updates, and confirmed clean deletion.

## Requirements
### Requirement: Tutor can view imported papers
The system SHALL provide an authenticated tutor page that lists imported papers available for management.

#### Scenario: Tutor opens paper management
- **WHEN** an authenticated tutor opens the paper management page
- **THEN** the system lists each imported paper with its paper ID, title, syllabus, status, total marks, current version number, latest imported or updated time, attempt count, and available management actions

#### Scenario: No imported papers exist
- **WHEN** an authenticated tutor opens the paper management page and no papers have been imported
- **THEN** the system shows an empty state instead of an empty table

#### Scenario: Unauthenticated user opens paper management
- **WHEN** a user without a valid tutor session opens the paper management page
- **THEN** the system blocks access before loading paper metadata

### Requirement: Tutor can start a JSON update for an existing paper
The system SHALL allow an authenticated tutor to start updating an existing paper from the paper management page.

#### Scenario: Tutor opens current paper JSON
- **WHEN** an authenticated tutor chooses to update a paper from the paper management page
- **THEN** the system loads the selected paper's current source JSON into an editable JSON form

#### Scenario: Selected paper is missing
- **WHEN** an authenticated tutor tries to update a paper ID that does not exist
- **THEN** the system shows a not-found result and does not display any source JSON

### Requirement: Tutor can delete imported papers
The system SHALL allow an authenticated tutor to delete an imported paper after confirming the destructive impact.

#### Scenario: Tutor deletes paper with no attempts
- **WHEN** an authenticated tutor confirms deletion for a paper with zero attempts
- **THEN** the system removes the paper, its paper versions, questions, answerable parts, paper access-code mappings, and any access codes that are no longer referenced by another paper, then reloads the paper management page without that paper

#### Scenario: Tutor deletes paper with attempts
- **WHEN** an authenticated tutor starts deleting a paper that has one or more student attempts
- **THEN** the system shows a confirmation warning with the exact attempt count and states that attempts, answers, marks, and feedback will be permanently deleted
- **WHEN** the tutor confirms deletion after seeing that warning
- **THEN** the system removes the paper, its paper versions, questions, answerable parts, paper access-code mappings, attempts, attempt answers, marks, feedback, and any access codes that are no longer referenced by another paper, then reloads the paper management page without that paper

#### Scenario: Attempt count changes before confirmed deletion
- **WHEN** an authenticated tutor confirms deletion using an attempt count that no longer matches the current database count
- **THEN** the system rejects the deletion, preserves the paper and related records, and reports that the tutor must refresh before confirming the current deletion impact

#### Scenario: Unauthenticated user tries to delete paper
- **WHEN** a user without a valid tutor session invokes the delete action
- **THEN** the system blocks the request before checking or changing paper data
