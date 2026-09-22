## Why

Blank rubric-marked answers currently still go through the Gemini marking path, which spends an API call on content that cannot earn marks. Whitespace-only submissions should be treated the same as empty answers and receive an immediate zero.

## What Changes

- Detect blank or whitespace-only student answers before AI marking.
- Return a marked zero-score result for blank `rubric_ai` answers without calling Gemini.
- Preserve existing Gemini behavior for non-blank rubric answers and existing deterministic markers.

## Capabilities

### New Capabilities

### Modified Capabilities
- `ai-assisted-marking`: Rubric AI marking skips Gemini for blank or whitespace-only answers and records an automatic zero.

## Impact

- Affects server-side marking in `lib/marking/mark.ts`.
- Adds regression coverage for blank and whitespace-only rubric answers.
- No schema, dependency, or public API changes.
