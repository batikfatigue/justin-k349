# Spec Delta

## MODIFIED Requirements

### Requirement: Tutor-only access
The system SHALL protect tutor-only pages with a tutor password session bound to the currently configured password credential.

#### Scenario: Tutor logs in successfully
- **WHEN** a tutor submits the configured password
- **THEN** the system creates an authenticated tutor session for admin pages

#### Scenario: Unauthenticated user opens admin page
- **WHEN** a user without a valid tutor session requests an admin page
- **THEN** the system redirects or blocks the request without exposing attempt, answer, accepted-answer, expected-output, rubric, or model-answer data

#### Scenario: Password rotation ends existing sessions
- **WHEN** the configured tutor password credential is replaced after tutor sessions were issued
- **THEN** existing sessions are rejected and affected tutors are returned to the sign-in page

#### Scenario: Unchanged credential keeps session valid
- **WHEN** a tutor holds an unexpired session and the configured credential has not changed
- **THEN** authenticated tutor requests continue to work normally
