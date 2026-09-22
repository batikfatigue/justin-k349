# auth-access-control Specification

## Purpose
Limits repeated guessing of sign-in credentials at both entry points (tutor password and student access code), slowing brute-force attacks without revealing whether a submitted credential is valid.

## Requirements

### Requirement: Tutor password entry is throttled
The system SHALL reject tutor sign-in attempts after a configured number of consecutive failures from the same client, refusing further attempts for a cooldown period without checking the submitted password.

#### Scenario: Failure below threshold shows invalid result
- **WHEN** a tutor submits a wrong password fewer times than the failure threshold
- **THEN** the system shows the normal invalid-password result and records the failure

#### Scenario: Threshold exceeded triggers cooldown
- **WHEN** consecutive tutor password failures from the same client reach the threshold
- **THEN** the system rejects further sign-in attempts for the cooldown period without verifying the submitted password and shows a generic try-again-later result

#### Scenario: Cooldown does not reveal credential validity
- **WHEN** a client is in cooldown and submits the correct tutor password
- **THEN** the system still refuses the attempt until the cooldown expires

#### Scenario: Successful sign-in clears failures
- **WHEN** a tutor signs in successfully
- **THEN** the recorded failure count for that client is reset

### Requirement: Student access-code entry is throttled
The system SHALL reject student access-code submissions after a configured number of consecutive failures from the same client, refusing further attempts for a cooldown period without checking the submitted code.

#### Scenario: Failure below threshold shows invalid result
- **WHEN** a student submits an invalid or inactive access code fewer times than the failure threshold
- **THEN** the system shows the normal invalid-code result and records the failure

#### Scenario: Threshold exceeded triggers cooldown
- **WHEN** consecutive access-code failures from the same client reach the threshold
- **THEN** the system rejects further submissions for the cooldown period without checking the code and shows a generic try-again-later result

#### Scenario: Cooldown does not reveal code validity
- **WHEN** a client is in cooldown and submits a valid access code
- **THEN** the system still refuses the attempt until the cooldown expires

#### Scenario: Successful entry clears failures
- **WHEN** a student enters a valid access code successfully
- **THEN** the recorded failure count for that client is reset
