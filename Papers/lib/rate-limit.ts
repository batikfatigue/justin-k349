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
  if (buckets.size >= maxTrackedKeys) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
}

export function isRateLimited(key: string, limit: number, now = Date.now()) {
  const bucket = buckets.get(key);
  return Boolean(bucket && bucket.resetAt > now && bucket.count >= limit);
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function requestClientKey() {
  const forwardedFor = headers().get("x-forwarded-for");
  const client = forwardedFor?.split(",")[0]?.trim() || headers().get("x-real-ip")?.trim();

  return client && client.length > 0 ? client : "unknown";
}
