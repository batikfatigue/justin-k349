## ADDED Requirements

### Requirement: Server-side marking by marking mode
The system SHALL mark submitted answerable parts on the server according to their imported marking mode.

#### Scenario: Exact answer is marked
- **WHEN** a student submits a part configured with `exact` marking
- **THEN** the system compares the answer to the server-stored accepted answers using the configured case-sensitivity rules and stores the awarded score

#### Scenario: Code output table is marked
- **WHEN** a student submits a part configured with `code_output_table` marking
- **THEN** the system marks each row against the server-stored expected output and stores the row scores and total awarded score

#### Scenario: Error correction answer is marked
- **WHEN** a student submits a part configured with `error_correction` marking
- **THEN** the system marks the submitted line number and corrected line against server-stored expected values and accepted alternatives

#### Scenario: Rubric answer is marked
- **WHEN** a student submits a part configured with `rubric_ai` marking
- **THEN** the system requests a Gemini mark using the prompt, visible stimuli, model answer, rubric points, max score, and student answer

### Requirement: Gemini returns structured rubric marks
The system SHALL require Gemini marking responses for `rubric_ai` parts to match a structured schema.

#### Scenario: Gemini returns valid structured output
- **WHEN** Gemini returns score, max score, student feedback, tutor rationale, and missing rubric points in the expected schema
- **THEN** the system validates and stores the mark for both student results and tutor review

#### Scenario: Gemini returns invalid output
- **WHEN** Gemini returns malformed, incomplete, or out-of-range marking output
- **THEN** the system stores the answer with a failed marking status instead of showing untrusted feedback

### Requirement: Student feedback is hint-safe
The system SHALL separate broad student feedback from detailed tutor-only marking rationale for all marking modes.

#### Scenario: Student views marked result
- **WHEN** the student opens the results page for an exact-marked or AI-marked part
- **THEN** the system shows only score and broad feedback that does not include accepted answers, expected outputs, corrected lines, model answers, exact missing rubric points, or strong hints

#### Scenario: Tutor views marked result
- **WHEN** the tutor opens the attempt detail for a marked part
- **THEN** the system shows the detailed exact-marking result or AI rationale, including expected values and missing rubric points when available

### Requirement: Student data is minimized in AI calls
The system SHALL avoid sending unnecessary student identity data to Gemini.

#### Scenario: Rubric answer is sent for marking
- **WHEN** the system calls Gemini for a `rubric_ai` part
- **THEN** the request excludes student name, access code, attempt identifiers, and any unrelated answers

### Requirement: AI marking failures are visible but non-blocking
The system SHALL allow attempt submission to complete when AI marking fails.

#### Scenario: Gemini request fails
- **WHEN** Gemini is unavailable or returns an error during submission
- **THEN** the system records the affected part answer as marking failed and still completes submission for the attempt
