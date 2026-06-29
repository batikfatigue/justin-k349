## Context

The student question page currently posts a full form to a server action for every previous/next click. The save path rebuilds the current question display model, loads all questions and all saved answers for the attempt, upserts part answers one at a time, updates elapsed time, then redirects to a fresh server-rendered question page. This is durable and simple, but it makes every page turn pay for redundant reads and sequential writes.

The important constraints are unchanged: answers must be saved before navigation or submission, students must not receive accepted answers or marking metadata, and the minimal student interface should remain uncluttered.

## Goals / Non-Goals

**Goals:**

- Make previous/next navigation feel substantially faster for students.
- Preserve the existing durable-save-before-navigation behavior.
- Reduce database round trips in both save and question display paths.
- Give immediate visual feedback after a navigation button is clicked.
- Keep answer keys, rubrics, and marking details server-only.

**Non-Goals:**

- Introducing optimistic navigation that can show the next question before the save completes.
- Changing the database schema or imported paper format.
- Changing submission marking behavior or result display.
- Adding offline mode, autosave beyond the existing heartbeat, or client-side marking.

## Decisions

1. **Keep server-confirmed navigation**
   - Decision: The app will still await a successful server save before redirecting to the next or previous question.
   - Rationale: This preserves the current exam-practice contract and avoids confusing cases where a student sees the next question but the previous answer was not saved.
   - Alternative considered: Optimistic client-side navigation with background save. Rejected for this change because it introduces retry/conflict UX and weakens the existing durability guarantee.

2. **Split save data loading from display data loading**
   - Decision: Add a lean save helper that validates the attempt/session and fetches only the current question and its answerable parts needed to parse the submitted form.
   - Rationale: The current save path uses the full display loader, which also fetches paper display data, all questions, and all saved answers for the attempt.
   - Alternative considered: Reuse `getStudentQuestion` and rely on caching. Rejected because the data needs differ and the redundant queries happen on the critical page-turn path.

3. **Batch answer persistence for the current question**
   - Decision: Build all current-question part-answer rows in memory and persist them with one bulk upsert where supported by Drizzle/Postgres.
   - Rationale: Multi-part questions currently perform one insert/upsert per part, which makes larger questions slower and more sensitive to network latency.
   - Alternative considered: Keep sequential upserts. Rejected because it is the clearest avoidable latency in the save path.

4. **Narrow question display reads**
   - Decision: When rendering a question page, fetch saved answers only for the parts on the current question.
   - Rationale: Returning to a previous question only needs answers for that visible question; loading every saved answer for the attempt grows with paper length.
   - Alternative considered: Continue loading all attempt answers. Rejected because it makes later page turns progressively heavier.

5. **Use a client pending state for feedback, not for persistence**
   - Decision: Add a small client component around navigation buttons that disables controls and shows a saving state while the server action is pending.
   - Rationale: This improves perceived responsiveness without changing save semantics.
   - Alternative considered: Leave native form behavior only. Rejected because users currently get little feedback during the slowest part of the interaction.

## Risks / Trade-offs

- Bulk upsert construction could accidentally omit fields reset by the current per-part upsert -> Mirror the existing insert/update payloads and cover re-answering a question in tests.
- A lean save query could save parts from an unauthorized or submitted attempt if validation is incomplete -> Reuse the same session ownership and in-progress checks expected by the current attempt helpers.
- Pending controls add client-side code to an otherwise server-rendered page -> Keep the component narrow and limited to form submission state.
- Query-count improvements may not fully eliminate latency on a slow hosted database -> The design removes avoidable work first; deeper changes such as prefetching or autosave can be separate follow-ups.
