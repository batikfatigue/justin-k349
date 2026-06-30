## Context

The app already has tutor-only admin routes for JSON import and attempt review. Imported paper definitions live in `papers`, `paper_versions`, `questions`, `question_parts`, and paper/access-code join rows; updates already create a new `paper_versions` row and move `papers.current_version_id` forward, while existing attempts remain pinned to their original `paper_version_id`.

Tutors need a central page that shows the papers currently known to the system and gives them safe maintenance actions. The current import page can validate and import JSON, but it does not help tutors discover an existing paper, start from the current source JSON, or remove a paper.

## Goals / Non-Goals

**Goals:**

- Add an authenticated `/admin/papers` page that lists imported papers and useful management metadata.
- Let tutors start an update from a selected paper using the current source JSON.
- Reuse the existing v1 JSON validation and import/update logic so updated papers keep version history.
- Let tutors delete papers after an explicit warning confirmation, including when existing attempts will be permanently removed.
- Add focused tests for authorization, listing, update loading, JSON paper-id guardrails, and deletion behavior.

**Non-Goals:**

- Editing individual questions or marking schemas through a custom form.
- Bulk deleting papers.
- Adding a full paper archive/restore workflow.

## Decisions

- Add a new `/admin/papers` route instead of overloading `/admin/import`. The list, delete controls, and selected-paper update entry point are a distinct management workflow, while `/admin/import` remains the general paste-and-import path.
- Introduce admin paper data helpers for listing paper summaries and loading the current source JSON. The list query will include paper metadata, current version number/imported time, and attempt count so the UI can show the destructive-delete warning with the current impact.
- Reuse `parsePaperJsonText` and `importPaper` for updates. This keeps validation, version creation, access-code remapping, and current-version promotion in one path.
- Add a selected-paper update action that requires the submitted JSON `paperId` to match the selected paper. This prevents a tutor from opening one paper from the management page and accidentally creating or updating another paper by pasting mismatched JSON.
- Implement deletion as a server action that requires a tutor session and a confirmation value from the paper management UI. When attempts exist, the UI will warn that the delete will permanently remove the paper, versions, questions, answerable parts, attempts, answers, marks, feedback, and paper/access-code mappings.
- Recheck the attempt count inside the delete transaction. If the count no longer matches the value shown in the confirmation prompt, reject the delete and ask the tutor to refresh so they confirm the current impact.
- Perform a clean delete in dependency order: remove paper attempts first so attempt answers cascade, remove the paper so versions/questions/parts and paper/access-code mappings cascade, and then remove access-code rows that are no longer referenced by any paper. Access codes still referenced by other papers must remain.
- Add a Papers link to `AdminNav` so tutors can move among Papers, Import, and Attempts.

## Risks / Trade-offs

- Destructive deletion with attempts permanently removes student evidence, marks, and feedback -> Mitigated by showing the exact attempt count and requiring explicit confirmation before the server action performs the clean delete.
- Reusing a textarea update flow is less polished than field-level editing -> Mitigated by matching the existing JSON import contract and keeping the change small, predictable, and easy to validate.
- Loading source JSON exposes protected marking metadata to tutors -> Mitigated by requiring tutor authentication before loading any management page or update action.
- Deleting access-code rows too broadly could affect other papers -> Mitigated by deleting only access codes that become unreferenced after the target paper is removed.
