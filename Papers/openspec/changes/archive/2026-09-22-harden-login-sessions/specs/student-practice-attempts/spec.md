# Spec Delta

## MODIFIED Requirements

### Requirement: Code-gated paper discovery
The system SHALL require a valid access code and student name before showing practice papers, and SHALL stop honoring an issued student session once its access code is deactivated or removed.

#### Scenario: Student sees available papers
- **WHEN** a student submits a valid active access code and a non-empty name
- **THEN** the system shows only published papers associated with that access code

#### Scenario: Student enters invalid access code
- **WHEN** a student submits an invalid or inactive access code
- **THEN** the system refuses access and does not reveal paper titles for other codes

#### Scenario: Deactivated code ends an existing session
- **WHEN** a student holds an active session for an access code that is later deactivated or deleted
- **THEN** the next authenticated student request is refused and the student is returned to the access-code entry flow without access to papers, attempts, or results

#### Scenario: Active code keeps session valid
- **WHEN** a student holds an unexpired session for an access code that remains active
- **THEN** authenticated student requests continue to work normally
