# Design

## Context

See proposal.md for motivation. Current state:

- Sessions are stateless HMAC-signed cookies (`lib/auth/session.ts`) verified by signature + `expiresAt` only — nothing server-side is consulted after issuance.
- Tutor login is a server action (`app/admin/login/actions.ts`) comparing against `TUTOR_PASSWORD_HASH` via bcrypt. Student entry (`lib/student/actions.ts` → `resolveAccessCode`) looks up `HMAC(code)` in `access_codes`.
- `requireStudentSession`/`getStudentSession` are **synchronous** and called synchronously from server components, server actions, and the heartbeat API route.
- Deployment is Vercel (serverless) — in-memory counters would not persist or coordinate across invocations. Postgres via Drizzle is already available.
- `lib/security.ts` already exposes `hmac`-style signing helpers keyed by `SESSION_SECRET`; reuse them for subject hashing and credential fingerprinting.

## Goals / Non-Goals

**Goals:**
- Server-side throttling of tutor password and student access-code submissions, keyed by client identity, with a fixed threshold + cooldown policy.
- Student sessions stop authorizing access as soon as their access code is deactivated or deleted.
- Tutor sessions stop authorizing access as soon as `TUTOR_PASSWORD_HASH` changes.
- Uniform throttled responses that do not reveal credential validity.

**Non-Goals:**
- Per-tutor accounts, audit trails, or any change to the single shared password model.
- Binding student identity to a roster (impersonation via free-text name remains possible).
- Reworking the `?error=` redirect UX (e.g. `useActionState`) or session TTLs.
- Per-access-code throttling (keying is per client, not per code).

## Decisions

### 1. Track failures in a new `auth_attempts` table, not in memory

Serverless deployment makes in-memory counters unreliable. New Drizzle table:

- `key` (text, PK) — `HMAC(scope + ":" + clientIp)`; storing a hash avoids keeping raw IPs.
- `failureCount` (integer), `windowStartedAt` (timestamp), `lockedUntil` (timestamp, nullable), `updatedAt`.

Helpers in a new `lib/auth/throttle.ts`: `isThrottled(scope)` → checks `lockedUntil`; `recordFailure(scope)` → upserts/increments, sets `lockedUntil` when threshold hit; `clearFailures(scope)` → deletes the row on success.

Policy constants: **5 consecutive failures → 15-minute cooldown**; the failure window resets when `lockedUntil` passes or after 15 minutes of no failures. These are module constants, not env config — the spec only requires "a configured number".

**Alternative considered:** middleware-level rate limiting (e.g. Upstash Ratelimit). Rejected — adds an external dependency/service for two low-traffic endpoints when Postgres is already present.

### 2. Client identity = IP from `headers()`, applied in the server actions

`headers()` from `next/headers` is available inside server actions; read `x-forwarded-for` (first hop) with a fallback of `"unknown"` so missing headers land in a shared bucket rather than bypassing the limit. Both actions check `isThrottled` **before** verifying the credential, and `recordFailure` only on a genuine credential failure — a throttled request must not extend its own cooldown.

Throttled outcome surfaces through the existing `?error=` redirect with a new generic value (e.g. `error=throttled` → "Too many attempts. Try again later.") — same for both surfaces.

**Risk accepted:** students behind school NAT share an IP, so one user's failures can throttle classmates. The 5/15-min numbers keep this bounded; per-code keying was rejected because it does not stop an attacker enumerating many codes.

### 3. Student revocation: async re-check of `access_codes.active`

`getStudentSession`/`requireStudentSession` become `async` and, after the existing signature/expiry check, run a lightweight `SELECT id FROM access_codes WHERE id = ? AND active` lookup. Missing/inactive → treated as no session → redirect to `/`. All call sites are already in async server contexts, so the change is `await` + `async` signatures at:

- `app/page.tsx`, `app/papers/[paperId]/page.tsx`, attempt question + results pages, `app/api/attempts/[attemptId]/heartbeat/route.ts` (return 401 instead of silent no-op), `lib/student/actions.ts`.

**Alternative considered:** checking `active` inside each data query (`getPublishedPapersForStudent` etc.). Rejected — it would silently show empty states instead of ending the session, and would not cover pages that don't query papers.

### 4. Tutor revocation: credential fingerprint in the session payload — no DB

`setTutorSession` embeds `credentialFingerprint = HMAC(TUTOR_PASSWORD_HASH)` in the payload. `getTutorSession` rejects sessions whose fingerprint doesn't match the current env hash, keeping the check synchronous and stateless. Rotating the password (the only meaningful "credential change" in a shared-password model) invalidates all outstanding sessions.

**Alternative considered:** a server-side tutor session store. Rejected — no DB row exists per tutor today, and a fingerprint delivers the required revocation semantics for free.

### 5. Graceful edge cases

- `TUTOR_PASSWORD_HASH` unset: fingerprint derivation must not throw at login-guard time — sessions simply can't be issued while misconfigured (existing `misconfigured` path already covers this).
- Throttle check happens before the `misconfigured` check on tutor login? No — check `isThrottled` first anyway so a misconfigured deployment still can't be hammered; the error shown stays `misconfigured` once not throttled. Actually simpler: throttle check first, then existing logic unchanged.

## Risks / Trade-offs

- Shared-IP lockouts in a classroom → moderate threshold (5) and short cooldown (15 min); failures reset on success.
- `x-forwarded-for` is client-spoofable → acceptable here (goal is slowing bulk guessing, not per-user fairness); first-hop extraction on Vercel reflects the real client.
- Async session getters touch many call sites → mechanical change; tests mocking `requireTutorSession` are unaffected since tutor guard stays sync, but student-side tests may need async mocks.
- One extra indexed PK lookup per authenticated student request → negligible at this scale.

## Migration Plan

1. `drizzle-kit generate` for the `auth_attempts` table; apply migration.
2. Deploy code + migration together — no data migration, no ordering constraints.
3. Rollback: revert deploy; optionally drop `auth_attempts`. Existing sessions remain valid under old code.

## Open Questions

- Exact threshold/cooldown numbers are set as module constants (5 / 15 min); tune later without spec change.
