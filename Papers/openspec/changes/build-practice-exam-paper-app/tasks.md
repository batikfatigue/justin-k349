## 1. Project Setup

- [x] 1.1 Scaffold a Next.js App Router TypeScript application in the repository.
- [x] 1.2 Add dependencies for Drizzle ORM, Postgres.js, Zod, Gemini API access, password/session handling, and tests.
- [x] 1.3 Configure environment variable loading for `DATABASE_URL`, `DIRECT_DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `TUTOR_PASSWORD_HASH`, and `SESSION_SECRET`.
- [x] 1.4 Add base app layout, global CSS, and minimal "AI Neutral Design" tokens.

## 2. Database And Domain Model

- [x] 2.1 Define Drizzle schema for papers, access codes, paper access mappings, parent questions, answerable question parts, attempts, and part answers.
- [x] 2.2 Add JSONB fields for question stimuli, part stimuli, response schema, marking schema, answers, exact-marking details, AI rationale, and missing rubric points.
- [x] 2.3 Configure Postgres.js runtime connections for Supabase transaction pooling and migration connections for the direct database URL.
- [x] 2.4 Add migrations and a repeatable local migration command.
- [x] 2.5 Implement server-only data access helpers that never expose accepted answers, expected outputs, corrected-line targets, model answers, rubrics, missing points, or tutor rationale to student routes.

## 3. Tutor Authentication And Paper Import

- [x] 3.1 Implement single-password tutor login, logout, session cookie handling, and admin route protection.
- [x] 3.2 Define the v1 K349 paper JSON Zod schema for paper metadata, access codes, questions, parts, stimuli, flowcharts, response schemas, marking schemas, and variant metadata.
- [x] 3.3 Validate supported part types: `single_choice`, `multiple_choice`, `short_text`, `structured_response`, `code_output_table`, `error_correction`, `flowchart_interpretation`, and `code_writing`.
- [x] 3.4 Validate supported stimulus types: `text`, `code`, `table`, `expected_output`, and structured `flowchart` nodes/edges with optional `sourceImage`.
- [x] 3.5 Validate supported marking modes: `exact`, `code_output_table`, `error_correction`, and `rubric_ai`.
- [x] 3.6 Validate parent/part mark totals, required field paths, unsupported values, and malformed flowchart references with clear admin-facing errors.
- [x] 3.7 Build the `/admin/import` validation and import flow, including summary output for paper title, syllabus, access-code count, question count, part count, and total marks.
- [x] 3.8 Store imported access codes in protected form and map them to imported papers.
- [x] 3.9 Ensure re-importing an existing `paperId` updates future paper definitions without mutating submitted attempts.

## 4. Student Practice Flow

- [x] 4.1 Build the homepage access-code and student-name form.
- [x] 4.2 Implement code-gated paper discovery for published papers only.
- [x] 4.3 Build paper intro and start/reattempt creation behavior with attempt numbering.
- [x] 4.4 Build the one-parent-question-at-a-time UI that renders nested answerable parts.
- [x] 4.5 Render text, code, table, expected-output, and structured flowchart stimuli while preserving indentation, line breaks, rows, columns, and labels.
- [x] 4.6 Build response controls for single choice, multiple choice, short text, structured response, code output tables, error correction, flowchart interpretation, and code writing.
- [x] 4.7 Persist each part answer on navigation and restore saved part answers when students revisit questions.
- [x] 4.8 Implement stopwatch display, heartbeat updates, submission, elapsed-time storage, and abandoned-attempt timeout handling.
- [x] 4.9 Build the submitted results page with total score and broad per-part feedback only.

## 5. Marking

- [x] 5.1 Implement server-side `exact` marking with accepted answers and case-sensitivity settings.
- [x] 5.2 Implement server-side `code_output_table` marking with row-level expected outputs and row-level scoring details.
- [x] 5.3 Implement server-side `error_correction` marking for line number and corrected-line alternatives.
- [x] 5.4 Implement Gemini `rubric_ai` marking with structured output validation for score, max score, student feedback, tutor rationale, and missing rubric points.
- [x] 5.5 Enforce separate student-safe feedback and tutor-only rationale for all marking modes.
- [x] 5.6 Prevent Gemini requests from including student name, access code, attempt identifiers, or unrelated answers.
- [x] 5.7 Store failed or malformed AI marks as failed marking states without blocking submission.

## 6. Tutor Attempt Review

- [x] 6.1 Build `/admin/attempts` with paper, student, attempt number, status, timestamps, and elapsed-time columns.
- [x] 6.2 Build attempt detail pages with parent questions, answerable parts, student answers, scores, marking status, student feedback, tutor rationale, and missing rubric points.
- [x] 6.3 Show exact-marking audit data for accepted answers, expected outputs, row-level output marks, line-number corrections, and corrected-line alternatives.
- [x] 6.4 Show reattempt history clearly by paper, access code, student name, and attempt number.
- [x] 6.5 Include abandoned attempts with last seen time and latest saved part answers.

## 7. Verification And Deployment

- [x] 7.1 Add unit tests proving the K349 parallel paper can be represented losslessly in import JSON.
- [x] 7.2 Add validation tests for missing required fields, invalid mark totals, invalid part types, unsupported stimulus types, malformed flowcharts, and unsupported marking modes.
- [x] 7.3 Add exact-marking tests for `False`, `True`, numeric outputs, string outputs, accepted alternatives, code-output table rows, line-number corrections, and corrected-line alternatives.
- [x] 7.4 Add mocked Gemini tests for structured output, malformed output, failure handling, privacy minimization, and hint-safe student feedback.
- [x] 7.5 Add integration tests for starting attempts, saving nested part answers, submitting, reattempting, results filtering, and abandoned timeout handling.
- [x] 7.6 Add end-to-end coverage for the core student flow and tutor import/review flow using the K349 parallel paper.
- [x] 7.7 Run visual checks on desktop and mobile viewports to verify no overlapping text and no answer/rubric leakage in student UI.
- [x] 7.8 Document Vercel and Supabase setup steps, required environment variables, migration commands, and the v1 K349 JSON import format.
