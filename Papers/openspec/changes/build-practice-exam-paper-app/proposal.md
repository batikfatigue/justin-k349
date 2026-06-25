## Why

Students need a simple remote way to complete practice exam papers while tutors retain visibility into attempts, reattempts, timing, and AI-assisted marking. This change establishes the first deployable version of that app with a minimal "AI Neutral Design" and a Vercel-friendly architecture.

## What Changes

- Add a Next.js practice-paper web app deployable on Vercel with Supabase Postgres persistence.
- Add code-gated student access, paper selection, one-question-at-a-time answering, autosave, stopwatch timing, submission, and immediate practice results.
- Add JSON-based paper import for tutors, supporting the K349 paper style: nested parts, code/table stimuli, flowcharts, exact-output marking, error correction, and rubric-marked responses.
- Add server-side hybrid marking: exact local marking for deterministic answers and Gemini-assisted marking for rubric-based explanation/code-writing responses.
- Add tutor-only review surfaces for attempts, reattempts, elapsed time, detailed AI rationale, and abandoned attempts.
- Add minimal black-text, high-whitespace UI styling aligned with the requested "AI Neutral Design".

## Capabilities

### New Capabilities

- `student-practice-attempts`: Code-gated paper discovery, student identification, attempt lifecycle, answer capture, stopwatch timing, reattempts, and immediate results.
- `paper-json-import`: Tutor-authenticated JSON paper validation and import for K349-style nested questions, stimuli, flowcharts, and hybrid marking configuration.
- `ai-assisted-marking`: Local exact marking and Gemini-based rubric marking with separate tutor-visible rationale and student-safe feedback.
- `tutor-attempt-review`: Tutor authentication and review of attempts, reattempts, timing, answers, marking details, and abandoned attempts.

### Modified Capabilities

- None.

## Impact

- Creates a new Next.js App Router application with TypeScript and minimal global CSS.
- Adds Supabase Postgres storage for papers, questions, answerable parts, access codes, attempts, part answers, and marks.
- Adds dependencies for database access/migrations and Gemini API calls.
- Requires deployment configuration for Vercel environment variables and Supabase database connection strings.
