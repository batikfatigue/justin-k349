## MODIFIED Requirements

### Requirement: Tutor can import or update papers
The system SHALL let a tutor import a valid JSON paper into Supabase Postgres and update selected existing papers from the tutor paper management flow.

#### Scenario: New paper is imported
- **WHEN** a tutor imports valid JSON for a new `paperId`
- **THEN** the system creates the paper, questions, answerable parts, stimuli, marking configuration, and access-code mappings in the database

#### Scenario: Existing paper is updated
- **WHEN** a tutor imports valid JSON for an existing `paperId`
- **THEN** the system updates the paper definition for future attempts without changing already submitted attempt records

#### Scenario: Existing paper is updated from paper management
- **WHEN** a tutor submits valid replacement JSON from the update flow for the selected paper
- **THEN** the system creates a new current paper version for that paper and returns the tutor to paper management with the updated paper metadata visible

#### Scenario: Selected paper update uses mismatched paper ID
- **WHEN** a tutor submits replacement JSON whose `paperId` does not match the paper selected from paper management
- **THEN** the system rejects the update with a tutor-facing validation error and does not create or update paper data

#### Scenario: Mark total mismatch is rejected
- **WHEN** the sum of imported question marks or part marks does not match the declared parent marks or paper `totalMarks`
- **THEN** the system rejects the import with an admin-facing validation error identifying the mismatch
