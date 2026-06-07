import { env } from "@/core/types/env";

/**
 * In-memory rate limiter.
 *
 * Suitable for single-instance dev. In production replace with a Redis-backed
 * implementation (Upstash/Redis Cluster). The public API is intentionally
 * provider-agnostic so swapping the backend is trivial.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 50_000;

function evictIfNeeded() {
  if (buckets.size < MAX_KEYS) return;
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
    if (buckets.size < MAX_KEYS * 0.9) return;
  }
}

export interface RateLimitOptions {
  key: string;
  kind?: "default" | "auth" | "ai" | "export";
  max?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

const defaults: Record<NonNullable<RateLimitOptions["kind"]>, { max: number; windowMs: number }> = {
  default: { max: env.RATE_LIMIT_MAX_REQUESTS, windowMs: env.RATE_LIMIT_WINDOW_MS },
  auth: { max: env.RATE_LIMIT_AUTH_MAX_REQUESTS, windowMs: env.RATE_LIMIT_WINDOW_MS },
  ai: { max: 20, windowMs: 60_000 },
  export: { max: 30, windowMs: 60_000 },
};

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  evictIfNeeded();
  const { max, windowMs } = {
    ...defaults[options.kind ?? "default"],
    ...(options.max !== undefined ? { max: options.max } : {}),
    ...(options.windowMs !== undefined ? { windowMs: options.windowMs } : {}),
  };

  const now = Date.now();
  const bucket = buckets.get(options.key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(options.key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  bucket.count += 1;
  const remaining = Math.max(0, max - bucket.count);
  const allowed = bucket.count <= max;

  return {
    allowed,
    remaining,
    retryAfterMs: allowed ? 0 : Math.max(0, bucket.resetAt - now),
  };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

export function clearAllRateLimits(): void {
  buckets.clear();
}
