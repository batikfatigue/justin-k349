## Why

Tutors currently have to know about the import page and paper IDs manually, with no admin view that shows what papers already exist. A tutor-facing management page will make the available papers visible and provide clear actions for updating a paper from JSON or removing papers that should no longer be offered.

## What Changes

- Add an authenticated tutor page that lists all imported papers with key metadata such as paper ID, title, syllabus, status, marks, current version, and usage indicators.
- Add tutor controls from that list to update an existing paper by editing or replacing its source JSON.
- Add a tutor delete action for papers, with a warning confirmation when attempts exist and a clean destructive delete that removes paper-owned attempts and related data.
- Add admin navigation so tutors can reach paper management alongside import and attempt review.

## Capabilities

### New Capabilities

- `tutor-paper-management`: Tutor-facing paper catalog management, including listing, update entry points, and confirmed clean deletion.

### Modified Capabilities

- `paper-json-import`: Existing paper JSON update behavior becomes accessible from a tutor-selected paper management flow.

## Impact

- Affects admin paper UI routes, admin navigation, authenticated server actions, paper query helpers, paper import/update reuse, destructive delete behavior, and tests for tutor authorization and clean data removal.
