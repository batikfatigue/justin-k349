# Proposal

## Why

Both credential entry points — the tutor password at `/admin/login` and the student access code on `/` — accept unlimited guesses, and issued sessions cannot be revoked: a deactivated access code keeps working until its cookie expires (up to 6h), and tutor sessions survive password rotation (up to 24h). This change closes the brute-force and revocation gaps in the sign-in system.

## What Changes

- Add throttling to the tutor password action and the student access-code action. After a small number of consecutive failures from the same client, further attempts are rejected for a cooldown period without revealing whether the submitted credential was valid.
- Track credential failures server-side (database-backed, since deployment is serverless) keyed by client identity, reset on success or after the window expires.
- Re-validate the student access code on each authenticated request: when a code is deactivated or deleted, existing student sessions stop working immediately and the user is redirected to the access-code entry page.
- Bind tutor sessions to the configured credential: embed a fingerprint of `TUTOR_PASSWORD_HASH` in the session payload so rotating the password invalidates all outstanding tutor sessions, forcing re-login.

## Capabilities

### New Capabilities

- `auth-access-control`: Throttling of credential entry (tutor password, student access code) and revocation of issued sessions when the underlying credential becomes invalid (deactivated access code, rotated tutor password).

### Modified Capabilities

- `student-practice-attempts`: The access-code entry requirement gains revocation semantics — an issued student session must stop authorizing access once its access code is deactivated.
- `tutor-attempt-review`: The tutor password session requirement gains revocation semantics — a session must stop authorizing access once the configured password credential is rotated.

## Impact

- `lib/auth/session.ts`: session payload gains a credential fingerprint; student session getters become async to re-check `access_codes.active`.
- Call sites of `getStudentSession`/`requireStudentSession` updated for the async signature (student home page, heartbeat API route, attempt pages, `lib/student/actions.ts`).
- `app/admin/login/actions.ts` and `lib/student/actions.ts`: failure counting and cooldown checks before credential verification.
- `lib/security.ts`: reuse `signValue`/`hashAccessCode`-style HMAC helpers for fingerprinting.
- New Drizzle table + migration for tracking credential failures; `lib/db/schema.ts` updated.
- Tests: new coverage for throttling and revocation; existing `requireTutorSession` mocks in admin action tests likely need adjustment.
- No new runtime dependencies expected; uses existing bcrypt/HMAC/Drizzle infrastructure.
