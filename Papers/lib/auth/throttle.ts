import "server-only";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { authAttempts } from "@/lib/db/schema";
import { hmac } from "@/lib/security";

export const MAX_FAILURES = 5;
export const COOLDOWN_MS = 15 * 60 * 1000;

export type ThrottleScope = "tutor" | "access-code";

export function getClientKey(scope: ThrottleScope) {
  const forwardedFor = headers().get("x-forwarded-for");
  const client = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return hmac(`${scope}:${client}`);
}

export async function isThrottled(scope: ThrottleScope, now = new Date()) {
  const key = getClientKey(scope);
  const [row] = await getDb().select().from(authAttempts).where(eq(authAttempts.key, key));

  return Boolean(row?.lockedUntil && row.lockedUntil > now);
}

export async function recordFailure(scope: ThrottleScope, now = new Date()) {
  const key = getClientKey(scope);
  const db = getDb();
  const [row] = await db.select().from(authAttempts).where(eq(authAttempts.key, key));
  const windowActive =
    Boolean(row) && now.getTime() - row.windowStartedAt.getTime() < COOLDOWN_MS;
  const failureCount = windowActive ? row.failureCount + 1 : 1;
  const windowStartedAt = windowActive ? row.windowStartedAt : now;
  const lockedUntil = failureCount >= MAX_FAILURES ? new Date(now.getTime() + COOLDOWN_MS) : null;

  await db
    .insert(authAttempts)
    .values({ key, failureCount, windowStartedAt, lockedUntil, updatedAt: now })
    .onConflictDoUpdate({
      target: authAttempts.key,
      set: { failureCount, windowStartedAt, lockedUntil, updatedAt: now }
    });
}

export async function clearFailures(scope: ThrottleScope) {
  const key = getClientKey(scope);
  await getDb().delete(authAttempts).where(eq(authAttempts.key, key));
}
