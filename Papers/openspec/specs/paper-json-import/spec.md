# paper-json-import Specification

## Purpose
TBD - created by archiving change build-practice-exam-paper-app. Update Purpose after archive.
## Requirements
### Requirement: Paper JSON uses the v1 K349 contract
The system SHALL validate imported papers against an explicit v1 JSON contract for K349 G3 Computing practice papers.

The top-level JSON object MUST include:

```json
{
  "schemaVersion": "1.0",
  "paperId": "k349-g3-computing-practice-1",
  "title": "K349 G3 Computing Practice Paper 1",
  "syllabus": "K349 G3 Computing",
  "mode": "practice",
  "status": "published",
  "totalMarks": 30,
  "accessCodes": [{ "code": "G3K349", "label": "G3 Computing" }],
  "questions": []
}
```

Each question object MUST include `id`, `number`, `title`, `marks`, and `parts`, and MAY include `outcomeId`, `variantGroupId`, `targetAnswerId`, `difficulty`, and `stimulus`.

Each answerable part object MUST include `id`, `label`, `type`, `prompt`, `marks`, and `marking`, and MAY include `stimulus`, `response`, and `studentFeedbackPolicy`.

#### Scenario: Valid v1 paper JSON is checked
- **WHEN** a tutor validates JSON containing all required top-level, question, and answerable part fields
- **THEN** the system reports that the paper can be imported and summarizes the paper title, syllabus, access-code count, question count, part count, and total marks

#### Scenario: Required contract field is missing
- **WHEN** a tutor validates JSON that omits a required top-level, question, or answerable part field
- **THEN** the system rejects it with an admin-facing validation error identifying the missing field path and does not create or update paper data

### Requirement: Paper JSON supports K349 v1 part types
The system SHALL support the K349 v1 part types needed by the observed paper style.

Supported part types MUST be:

- `single_choice`
- `multiple_choice`
- `short_text`
- `structured_response`
- `code_output_table`
- `error_correction`
- `flowchart_interpretation`
- `code_writing`

#### Scenario: Supported part type is imported
- **WHEN** a JSON paper contains answerable parts using only supported v1 part types
- **THEN** the system accepts those part definitions and stores their prompts, response schemas, stimuli, marks, and marking configuration

#### Scenario: Unsupported part type is rejected
- **WHEN** a JSON paper contains a part type outside the supported v1 set
- **THEN** the system rejects the import with an admin-facing validation error identifying the unsupported type and part id

### Requirement: Paper JSON supports structured stimuli
The system SHALL support structured stimuli for text, code, tables, expected output, and flowcharts.

Stimulus entries MUST use one of these types:

- `text`
- `code`
- `table`
- `expected_output`
- `flowchart`

Code stimuli MUST preserve line breaks and indentation. Table stimuli MUST preserve row and column structure. Expected-output stimuli MUST preserve line breaks. Flowchart stimuli MUST define `nodes` and `edges`, and MAY include `sourceImage` for tutor reference.

#### Scenario: Code and table stimuli are imported
- **WHEN** a JSON paper contains code, table, or expected-output stimuli
- **THEN** the system stores the stimuli in a way that preserves indentation, line breaks, rows, and columns for student rendering and tutor review

#### Scenario: Structured flowchart is imported
- **WHEN** a JSON paper contains a flowchart stimulus with valid nodes and edges
- **THEN** the system stores the flowchart structure and optional source image reference for rendering

#### Scenario: Malformed flowchart is rejected
- **WHEN** a JSON paper contains a flowchart with missing node ids, unsupported node kinds, or edges that reference unknown nodes
- **THEN** the system rejects the import with an admin-facing validation error identifying the malformed flowchart

### Requirement: Paper JSON supports hybrid marking modes
The system SHALL support local exact marking and Gemini-assisted rubric marking through explicit marking modes.

Supported marking modes MUST be:

- `exact`: local marking for choices, short answers, Boolean outputs, numeric outputs, and string outputs.
- `code_output_table`: exact local marking for row-by-row program-output tables.
- `error_correction`: local marking for line-number and corrected-line answers, including accepted alternatives.
- `rubric_ai`: Gemini-assisted marking for explanation and code-writing answers using hidden model answers and rubrics.

#### Scenario: Exact marking configuration is imported
- **WHEN** a part uses `exact` marking with accepted answers and case-sensitivity settings
- **THEN** the system stores the accepted answers server-side and uses them for deterministic local marking

#### Scenario: Code output table marking is imported
- **WHEN** a part uses `code_output_table` marking with expected outputs for each row
- **THEN** the system stores the expected outputs server-side and can mark each row independently

#### Scenario: Error correction marking is imported
- **WHEN** a part uses `error_correction` marking with expected line number and corrected code alternatives
- **THEN** the system stores those expected values server-side for deterministic marking

#### Scenario: Rubric AI marking is imported
- **WHEN** a part uses `rubric_ai` marking with model answer, rubric points, and max score
- **THEN** the system stores those marking details server-side for Gemini-assisted marking

### Requirement: Paper JSON supports parallel variants and shared outcomes
The system SHALL allow imported questions and parts to declare shared learning outcomes and parallel variant metadata.

#### Scenario: Variant metadata is imported
- **WHEN** a question or part includes `outcomeId`, `variantGroupId`, `targetAnswerId`, or `difficulty`
- **THEN** the system stores that metadata for tutor review, paper organization, and future parallel-paper generation

### Requirement: Tutor can import or update papers
The system SHALL let a tutor import a valid JSON paper into Supabase Postgres.

#### Scenario: New paper is imported
- **WHEN** a tutor imports valid JSON for a new `paperId`
- **THEN** the system creates the paper, questions, answerable parts, stimuli, marking configuration, and access-code mappings in the database

#### Scenario: Existing paper is updated
- **WHEN** a tutor imports valid JSON for an existing `paperId`
- **THEN** the system updates the paper definition for future attempts without changing already submitted attempt records

#### Scenario: Mark total mismatch is rejected
- **WHEN** the sum of imported question marks or part marks does not match the declared parent marks or paper `totalMarks`
- **THEN** the system rejects the import with an admin-facing validation error identifying the mismatch

### Requirement: Imported answers and marking metadata are protected
The system SHALL store imported access codes, accepted answers, expected outputs, corrected-line targets, model answers, rubrics, and marking metadata in protected server-side data.

#### Scenario: Paper access code is imported
- **WHEN** a tutor imports a paper with one or more access codes
- **THEN** the system stores protected code values and uses them to authorize student paper discovery

#### Scenario: Student-facing paper data is loaded
- **WHEN** the system loads an imported paper for a student
- **THEN** the response excludes accepted answers, expected outputs, corrected-line targets, model answers, rubrics, missing rubric points, and tutor-only marking metadata

