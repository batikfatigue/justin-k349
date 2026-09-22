## Context

Rubric-marked answers currently enter `markRubricAi`, which calls `requestGeminiMark` for every `rubric_ai` part. The shared answer serializer already knows how to turn text-like answers into strings for exact marking, but the AI path does not use it to detect empty submissions before building a Gemini prompt.

The user-facing requirement is simple: if the answer box is empty or contains only whitespace, Gemini should not be called and the stored mark should be zero.

## Goals / Non-Goals

**Goals:**
- Treat empty and whitespace-only rubric answers as blank.
- Store a completed zero-score mark for blank rubric answers.
- Avoid Gemini calls for blank rubric answers during normal submission and any shared marking path that reuses `markPartAnswer`.
- Keep existing Gemini marking unchanged for non-blank rubric answers.

**Non-Goals:**
- Changing deterministic marking rules for exact, code-output table, or error-correction parts.
- Adding client-side validation that blocks blank submissions.
- Changing database schema, imported paper schema, or Gemini prompt structure.

## Decisions

1. **Detect blank answers in the server-side rubric marker**
   - Decision: Add a small helper near the existing answer serialization logic and use it before `requestGeminiMark`.
   - Rationale: The server marker is the authoritative place where both student submission and remarking paths can share the same no-Gemini rule.
   - Alternative considered: Disable the submit button for blank answer boxes. Rejected because it would not cover server-side calls, whitespace-only values, or saved blank answers.

2. **Return a marked zero rather than a failed mark**
   - Decision: Blank rubric answers should return `status: "marked"`, `score: 0`, the configured `maxScore`, broad student feedback, tutor rationale explaining the blank answer, no missing rubric points, and no exact-marking details.
   - Rationale: A blank answer is not an AI failure or pending review; it is a valid submitted answer that earns zero.
   - Alternative considered: Store a failed status to make it visible to tutors. Rejected because this would incorrectly imply Gemini or system failure.

3. **Use trimmed textual content for blank detection**
   - Decision: For text-like answers, trim the serialized answer and consider it blank when the result is empty. For multi-value selections or structured non-text answers, keep existing behavior unless their serialized content is empty.
   - Rationale: The requested answer-box behavior maps to strings and `{ value }` responses, while reusing serialization avoids special-casing each UI component.

## Risks / Trade-offs

- Structured answer shapes could contain nested blank fields that serialize imperfectly -> Keep the helper small and cover the primary text answer shapes in tests; preserve existing behavior for non-text markers.
- Student feedback for a blank answer could reveal too much -> Use broad feedback that says no answer was provided without exposing model answers or rubric details.
- Remarking a previously blank AI answer may no longer contact Gemini -> This is intentional because the same stored blank answer still cannot earn marks.
