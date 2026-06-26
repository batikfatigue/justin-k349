## Context

The repository currently has no application code, so this change starts the app from a clean slate. The intended deployment target is Vercel, which favors a serverless Next.js application and managed persistent storage rather than a local SQLite file. Supabase Postgres will hold all durable state, while Gemini will be used only from server-side code for rubric-based marking.

The first product mode is practice mode. Students identify with an access code and name, may reattempt papers, see immediate results, and are timed with a stopwatch. Tutors need a simple protected area to import K349 G3 Computing papers and review all attempts.

The photographed K349 paper shows that v1 import must support nested question parts, code snippets, output tables, flowcharts, exact Python-output answers, error-correction answers, and rubric-marked explanations/code-writing tasks.

## Goals / Non-Goals

**Goals:**

- Build a deployable Next.js App Router app with TypeScript.
- Use Supabase Postgres for papers, access codes, parent questions, answerable question parts, attempts, part answers, and marks.
- Support JSON-authored K349 practice papers with nested parts, structured stimuli, flowcharts, exact marking, error correction, and rubric/Gemini marking.
- Keep accepted answers, expected outputs, corrected lines, model answers, rubrics, and detailed AI rationale server-only.
- Present students with broad feedback that avoids strong hints.
- Use a minimal "AI Neutral Design": white background, black text, system font, generous spacing, thin borders only where useful.

**Non-Goals:**

- Full exam mode, enforced countdown timers, lockdown behavior, or anti-cheating controls.
- Student accounts, password reset, class rosters, or multi-tutor accounts.
- Browser-based paper editing beyond JSON import.
- File upload, numeric-entry specialization, diagram drawing, or media-answer question types.
- Tutor manual mark editing in the first implementation.

## Decisions

1. **Next.js + Vercel + Supabase Postgres**
   - Decision: Implement as a Next.js App Router app hosted on Vercel, backed by Supabase Postgres.
   - Rationale: The user prefers Vercel. Vercel serverless functions are not a good fit for an app-owned persistent SQLite file, so Supabase supplies durable relational storage.
   - Alternative considered: Flask + SQLite. This is simpler on a VPS or volume-backed host but mismatched with Vercel's persistence model.

2. **Parent questions with answerable parts**
   - Decision: Store imported paper questions as parent containers and store each answerable subpart separately.
   - Rationale: The K349 paper uses multi-part questions and tables where each row/part can carry its own prompt, answer shape, mark allocation, and marking method.
   - Alternative considered: One database row per visible question only. Rejected because it cannot cleanly autosave, mark, or review nested parts.

3. **Full v1 JSON import contract**
   - Decision: Tutors create papers as JSON using an explicit schema with top-level paper fields, question fields, part fields, structured stimuli, and marking modes.
   - Rationale: The import format must be stable enough to represent real K349 papers losslessly and to support parallel variants with shared outcomes.
   - Alternative considered: Loose JSON blobs. Rejected because validation, rendering, and marking would become guessy.

4. **Hybrid server-only marking**
   - Decision: Put all marking in server actions or route handlers. Use deterministic local marking for `exact`, `code_output_table`, and `error_correction`; use Gemini only for `rubric_ai`.
   - Rationale: Deterministic Python-output and correction questions should not depend on AI, while explanation/code-writing answers benefit from rubric-based AI assistance.
   - Alternative considered: Client-side or AI-first marking. Rejected because client-side marking leaks answers and AI-first marking is less reliable for exact outputs.

5. **Access code + name instead of student accounts**
   - Decision: Students enter an access code and display name before seeing available papers.
   - Rationale: This is enough for practice attribution without account management overhead.
   - Alternative considered: Student accounts. Deferred until identity and class management become necessary.

6. **Heartbeat abandonment instead of relying on close events**
   - Decision: In-progress attempts update `last_seen_at`; stale attempts are shown as abandoned after a timeout.
   - Rationale: Browser close/unload events are unreliable, especially on mobile and across tabs.
   - Alternative considered: End attempts on page close. Rejected as too brittle.

## Data Model

- `papers`: paper id, title, syllabus, mode, status, total marks, timestamps.
- `access_codes`: hashed code, label, active flag, timestamps.
- `paper_access_codes`: paper/access-code mapping.
- `questions`: paper id, number, title, marks, outcome id, variant group id, target answer id, difficulty, stimulus JSONB, position.
- `question_parts`: question id, label, type, prompt, marks, stimulus JSONB, response schema JSONB, marking schema JSONB, student feedback policy, position.
- `attempts`: paper id, access-code id, student name, attempt number, status, started/submitted/last-seen timestamps, elapsed seconds.
- `part_answers`: attempt id, question id, question-part id, answer JSONB, score, max score, marking status, student feedback, tutor rationale, missing points JSONB, marked timestamp.

Use Drizzle ORM with Postgres.js. Vercel runtime traffic should use Supabase's transaction-pooler connection string with prepared statements disabled; migration tooling should use the direct database URL.

## Import Contract

The importer must validate `schemaVersion`, `paperId`, `title`, `syllabus`, `mode`, `status`, `totalMarks`, `accessCodes`, and `questions`. Each question must include `id`, `number`, `title`, `marks`, and `parts`, with optional `outcomeId`, `variantGroupId`, `targetAnswerId`, `difficulty`, and `stimulus`. Each part must include `id`, `label`, `type`, `prompt`, `marks`, and `marking`, with optional `stimulus`, `response`, and `studentFeedbackPolicy`.

Supported part types are `single_choice`, `multiple_choice`, `short_text`, `structured_response`, `code_output_table`, `error_correction`, `flowchart_interpretation`, and `code_writing`.

Supported stimuli are `text`, `code`, `table`, `expected_output`, and `flowchart`. Flowcharts are stored as structured nodes and edges with an optional `sourceImage` reference for tutor context.

Supported marking modes are `exact`, `code_output_table`, `error_correction`, and `rubric_ai`.

## App Flow

- `/`: students enter access code and name, then see only published papers available for that code.
- `/papers/[id]`: paper intro with start or reattempt action.
- `/attempts/[id]/questions/[n]`: one parent question per page, rendering all of its answerable parts and structured stimuli.
- `/attempts/[id]/results`: immediate score and broad per-part review.
- `/admin/login`: single tutor password login.
- `/admin/import`: JSON validation and import.
- `/admin/attempts`: attempt list and detailed review.

## Marking

`exact` parts are marked locally against server-stored accepted answers. `code_output_table` parts are marked locally row by row against server-stored expected outputs. `error_correction` parts are marked locally against server-stored line numbers and accepted corrected-line alternatives. `rubric_ai` parts are sent to Gemini with the visible prompt/stimuli, model answer, rubric points, max score, and student answer.

Gemini prompts must require separate fields for student-safe feedback and tutor-visible rationale. Gemini failures must not block submission. Failed marks are stored with a failed status, the student sees that marking is pending or partial, and the tutor can see the failure in the attempt review.

## Risks / Trade-offs

- AI feedback leaks hints -> Keep student feedback broad and store detailed rationale only for tutors.
- Exact marking is too strict -> Allow accepted alternatives and configurable case sensitivity in import JSON.
- Flowchart rendering becomes inconsistent -> Prefer structured nodes/edges over image-only flowcharts.
- Gemini output is malformed or unavailable -> Validate structured output and store a failed/pending mark state.
- Access codes are shared -> Accept for practice mode; exam mode can add stronger identity later.
- Supabase connection pool exhaustion -> Use transaction pooling for Vercel runtime connections.
- JSON authoring mistakes -> Validate before import and return precise admin-facing errors.

## Migration Plan

1. Create the Next.js app, database schema, and migrations.
2. Configure Supabase and Vercel environment variables.
3. Import the K349 parallel practice paper through the tutor import screen.
4. Run student and tutor smoke tests locally, then on Vercel preview.
5. Roll back by disabling the Vercel deployment or pointing students back to the prior process; no existing app data migration is required.

## Open Questions

- None for v1. Exam mode, stronger identity, and a browser-based paper editor are intentionally deferred.
