import "server-only";

import { headers } from "next/headers";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

// In-memory limiter. Each running instance keeps its own counters, so on
// multi-instance deployments the effective limit is per instance.
const buckets = new Map<string, RateLimitBucket>();
const maxTrackedKeys = 10_000;

export function recordRateLimitAttempt(key: string, windowMs: number, now = Date.now()) {
  const bucket = buckets.get(key);

  if (bucket && bucket.resetAt > now) {
    bucket.count += 1;
    return;
  }

  buckets.delete(key);

  if (buckets.size >= maxTrackedKeys) {
    for (const [bucketKey, existing] of buckets) {
      if (existing.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }
  }

  while (buckets.size >= maxTrackedKeys) {
    const oldestKey = buckets.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    buckets.delete(oldestKey);
  }

  buckets.set(key, { count: 1, resetAt: now + windowMs });
}

export function isRateLimited(key: string, limit: number, now = Date.now()) {
  const bucket = buckets.get(key);
  return Boolean(bucket && bucket.resetAt > now && bucket.count >= limit);
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

// Prefer the proxy-set x-real-ip; otherwise use the last x-forwarded-for hop,
// which is the one appended by the proxy rather than supplied by the client.
export function requestClientKey() {
  const realIp = headers().get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  const forwardedFor = headers().get("x-forwarded-for")?.split(",") ?? [];
  const client = forwardedFor[forwardedFor.length - 1]?.trim();

  return client && client.length > 0 ? client : "unknown";
}
