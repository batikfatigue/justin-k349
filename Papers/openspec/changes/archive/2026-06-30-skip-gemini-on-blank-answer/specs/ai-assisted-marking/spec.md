## MODIFIED Requirements

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

#### Scenario: Non-blank rubric answer is marked by Gemini
- **WHEN** a student submits a non-blank part configured with `rubric_ai` marking
- **THEN** the system requests a Gemini mark using the prompt, visible stimuli, model answer, rubric points, max score, and student answer

#### Scenario: Blank rubric answer is marked zero without Gemini
- **WHEN** a student submits a part configured with `rubric_ai` marking and the answer is empty or contains only whitespace
- **THEN** the system MUST NOT call Gemini and MUST store a marked result with score `0` for that part

### Requirement: Tutor can rerun AI marking for submitted answers
The system SHALL allow an authenticated tutor to resubmit an existing submitted `rubric_ai` answer to Gemini for marking without changing the stored student answer.

#### Scenario: AI remark succeeds
- **WHEN** a tutor requests AI remarking for a submitted attempt part whose marking mode is `rubric_ai` and whose stored answer is non-blank
- **THEN** the system sends Gemini the stored student answer, prompt, visible stimuli, marking schema, and max score for that attempt's paper version and replaces the stored marking result with the new score, student feedback, tutor rationale, missing rubric points, marking status, and marked timestamp

#### Scenario: AI remark stores zero for blank answer
- **WHEN** a tutor requests AI remarking for a submitted attempt part whose marking mode is `rubric_ai` and whose stored answer is empty or contains only whitespace
- **THEN** the system MUST NOT call Gemini and MUST replace the stored marking result with a marked zero-score result for that part

#### Scenario: AI remark fails
- **WHEN** Gemini is unavailable or returns invalid marking output during tutor-requested remarking
- **THEN** the system stores a failed marking status and failure rationale for that part while leaving the student's submitted answer and attempt status unchanged

#### Scenario: Non-AI part is not sent to Gemini
- **WHEN** a tutor requests AI remarking for a part whose marking mode is not `rubric_ai`
- **THEN** the system MUST NOT call Gemini and MUST NOT replace the stored mark
