# Tasks

## 1. Data model

- [x] 1.1 Add an `auth_attempts` table to `lib/db/schema.ts` (`key` text PK, `failureCount`, `windowStartedAt`, `lockedUntil`, `updatedAt`), run `drizzle-kit generate`, and verify a new migration file appears in `migrations/` matching existing naming conventions

## 2. Throttling module

- [x] 2.1 Create `lib/auth/throttle.ts` with `isThrottled(scope)`, `recordFailure(scope)`, `clearFailures(scope)`, a `getClientKey()` helper that reads `x-forwarded-for` via `headers()` and falls back to `"unknown"`, and policy constants (5 failures → 15-minute cooldown); keys are HMAC-hashed with `SESSION_SECRET`
- [x] 2.2 Add unit tests for the throttle module covering: failure counting, threshold → `lockedUntil`, throttled requests not extending cooldown, expiry resetting state, and `clearFailures` on success — verify with `npx vitest run`

## 3. Tutor login throttling + revocation

- [x] 3.1 In `app/admin/login/actions.ts`, check `isThrottled("tutor")` before `verifyTutorPassword`, record failures on invalid attempts, clear on success, and redirect with `?error=throttled` when locked out; render a generic try-again-later notice for `error=throttled` in `app/admin/login/page.tsx`
- [x] 3.2 Embed `credentialFingerprint` (HMAC of `TUTOR_PASSWORD_HASH`) in the tutor session payload in `setTutorSession`, and reject mismatched fingerprints in `getTutorSession`; verify a session issued under one hash is rejected after the hash changes (unit test)

## 4. Student access-code throttling

- [x] 4.1 In `lib/student/actions.ts` `enterStudentAccessAction`, check `isThrottled("access-code")` before `resolveAccessCode`, record failures on invalid/inactive codes, clear on success, and redirect with `?error=throttled`; render a generic try-again-later notice on `app/page.tsx`
- [x] 4.2 Verify by test that a valid code submitted during cooldown is still refused (no validity leak)

## 5. Student session revocation

- [x] 5.1 Make `getStudentSession`/`requireStudentSession` async and re-check `access_codes.active` for the session's `accessCodeId`; inactive or missing code is treated as no session
- [x] 5.2 Update all call sites to `await`: `app/page.tsx`, `app/papers/[paperId]/page.tsx`, attempt question/results pages, `lib/student/actions.ts`, and the heartbeat route (`app/api/attempts/[attemptId]/heartbeat/route.ts` returns 401 on invalid session); verify `npx tsc --noEmit` passes

## 6. Tests and verification

- [x] 6.1 Add tests covering spec scenarios: deactivated code invalidates an existing session, rotated tutor hash invalidates tutor sessions, cooldown blocks correct credentials, success resets failure count
- [x] 6.2 Update any existing tests broken by the async session getters; run `npx vitest run` and confirm the suite is green
- [x] 6.3 Run `npx openspec validate harden-login-sessions` and confirm the change validates
