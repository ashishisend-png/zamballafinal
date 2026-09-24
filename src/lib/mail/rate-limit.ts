/**
 * A sliding-window limiter for the anonymous booking endpoint.
 *
 * Deliberately in-memory: on Vercel each warm function instance keeps its own
 * counter and a cold start resets it, so this is a **speed bump against a loop
 * hammering the form**, not a guarantee. A real guarantee needs shared state
 * (Vercel KV / Upstash) — worth adding only if the inbox actually gets abused.
 *
 * `maxKeys` bounds memory: a serverless instance that sees thousands of unique
 * IPs must not grow a `Map` without limit, so the oldest key is evicted once the
 * table is full. Pure and clock-injectable — see `mail.test.ts`.
 */
export type RateLimitVerdict = { allowed: boolean; retryAfterMs: number };

export type RateLimiter = {
  check(key: string, now?: number): RateLimitVerdict;
};

export function createRateLimiter(options: {
  /** Requests allowed per key within the window. */
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  const { limit, windowMs, maxKeys = 500 } = options;
  const hits = new Map<string, number[]>();

  return {
    check(key, now = Date.now()) {
      const cutoff = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((at) => at > cutoff);

      if (recent.length >= limit) {
        hits.set(key, recent);
        // Oldest hit in the window is the one that has to expire.
        return { allowed: false, retryAfterMs: Math.max(0, recent[0] + windowMs - now) };
      }

      recent.push(now);
      // Re-insert last so Map iteration order is least-recently-used first.
      hits.delete(key);
      hits.set(key, recent);

      while (hits.size > maxKeys) {
        const oldest = hits.keys().next();
        if (oldest.done) break;
        hits.delete(oldest.value);
      }
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}

/**
 * Best-effort caller identity for rate limiting, from proxy headers.
 *
 * Vercel sets `x-forwarded-for`; the left-most entry is the original client and
 * the rest are proxies. Spoofable in general, which is fine here — this only
 * buckets requests, it authorises nothing. Takes a getter rather than `Headers`
 * so it stays testable without a `Request`.
 */
export function clientIp(get: (name: string) => string | null | undefined): string {
  const forwarded = get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return get("x-real-ip")?.trim() || "unknown";
}
