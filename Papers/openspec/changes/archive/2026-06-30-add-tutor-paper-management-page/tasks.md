## 1. Paper Management Data Helpers

- [x] 1.1 Add an admin paper list helper that returns paper ID, title, syllabus, status, total marks, current version number, latest import/update time, and attempt count.
- [x] 1.2 Add a helper that loads the current `sourceJson` for a selected paper ID and returns null when the paper does not exist.
- [x] 1.3 Add a delete helper that runs in a transaction, rechecks the confirmed attempt count, cleanly deletes the paper with its attempts and attempt answers, and removes access codes that become unreferenced.

## 2. Server Actions and Update Flow

- [x] 2.1 Add an authenticated selected-paper update action that parses submitted JSON, enforces matching `paperId`, reuses `importPaper`, and returns validation errors when needed.
- [x] 2.2 Add an authenticated paper delete action that calls the confirmed clean-delete helper and reports success or stale-count rejection.
- [x] 2.3 Ensure update and delete actions revalidate or redirect back to paper management so tutors see fresh metadata.

## 3. Tutor Admin UI

- [x] 3.1 Add `/admin/papers` with tutor-session protection, an empty state, and a table of imported paper metadata.
- [x] 3.2 Add update controls from the paper list to an edit page or panel prefilled with the selected paper's current source JSON.
- [x] 3.3 Add delete controls that show a warning confirmation with the attempt count before deleting papers with attempts.
- [x] 3.4 Add a Papers link to `AdminNav` alongside Import and Attempts.

## 4. Tests

- [x] 4.1 Add tests for paper list metadata and empty-state behavior.
- [x] 4.2 Add tests for loading current source JSON, missing paper handling, and mismatched `paperId` rejection.
- [x] 4.3 Add tests for zero-attempt deletion, confirmed deletion with attempts, stale attempt-count rejection, unreferenced access-code cleanup, and authentication ordering for delete/update actions.
- [x] 4.4 Update navigation or page component tests to cover the new Papers admin entry point.

## 5. Verification

- [x] 5.1 Run OpenSpec validation for `add-tutor-paper-management-page`.
- [x] 5.2 Run targeted tests for admin paper management and JSON import/update behavior.
- [x] 5.3 Run the project typecheck and relevant full test suite command.
