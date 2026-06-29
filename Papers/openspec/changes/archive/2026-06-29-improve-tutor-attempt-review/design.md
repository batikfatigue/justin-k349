## Context

The attempt detail page already loads the attempt, paper-version questions, normalized marking schemas, and saved `part_answers`. It currently renders several tutor review fields through a generic JSON block, which exposes implementation shape rather than the answer/rubric meaning and allows long lines to overflow. Tutors can resubmit eligible AI marks, but cannot correct an automatic result themselves.

## Goals / Non-Goals

**Goals:**

- Present saved answers and marking data as readable review content.
- Prevent horizontal overflow for tutor-facing review text.
- Allow authenticated tutors to override any saved answer mark on a submitted attempt.
- Persist whether the latest displayed mark came from automatic marking or a manual override.

**Non-Goals:**

- Editing student-submitted answers.
- Changing imported marking schemas or max score.
- Adding full marking history in this change.

## Decisions

- Store `marking_source` on `part_answers` as `auto` or `manual`. This keeps the displayed status simple and avoids a separate audit table until full mark history is needed.
- Manual overrides update the same mark fields used by automatic marking: score, status, feedback, rationale, marked timestamp, and updated timestamp. This makes student/tutor result reads continue to use the existing stored result contract.
- The override action revalidates attempt, part, answer, and score server-side. The form-provided max score is not trusted.
- The review UI uses semantic renderers for known answer/schema/audit shapes, with a fallback human-readable formatter for unknown values.

## Risks / Trade-offs

- Manual overrides replace the currently displayed automatic diagnostics rather than preserving a detailed previous-result history -> Mitigated by storing `marking_source` so tutors can see that the current mark is manual.
- Broader override scope includes exact/local markers as well as AI -> Mitigated by requiring a submitted attempt and existing saved answer row, and validating score against server-stored max score.
- Existing rows lack source metadata -> Mitigated by a migration backfilling `auto` and a schema default for future automatic marks.
