## Why

The tutor attempt detail page currently exposes answers and marking data as raw JSON, which makes review slow and can force horizontal scrolling on long content. Tutors also need a way to correct stored marks when AI or automatic marking is wrong or incomplete.

## What Changes

- Render student answers, marking schemas, rationale, missing points, and audit details as human-readable review content instead of raw JSON blocks.
- Ensure tutor-facing review text wraps naturally without horizontal scrolling, while preserving code formatting for actual code/stimulus content.
- Add a tutor-only manual override action for saved answers on submitted attempts.
- Store whether the current displayed mark is automatic or manually overridden.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tutor-attempt-review`: Tutor attempt detail review becomes human-readable and supports manual mark overrides for submitted saved answers.

## Impact

- Affects the admin attempt detail UI, admin attempt server actions, part-answer persistence, Drizzle schema, database migrations, and admin tests.
