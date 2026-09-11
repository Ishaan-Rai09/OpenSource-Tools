import { Redis } from "@upstash/redis";

function client(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Fixed-window rate limit (window refreshes on each hit). Without Upstash env or on Redis error, always allows (offline-friendly fail-open). */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; count: number }> {
  const c = client();
  if (!c) return { allowed: true, count: 0 };
  try {
    // Atomic MULTI/EXEC via pipeline: INCR + EXPIRE together, so a failed
    // call can never leave a key without TTL (which would block forever).
    const k = `ratelimit:${key}`;
    const p = c.pipeline();
    p.incr(k);
    p.expire(k, windowSec);
    const raw = (await p.exec()) as unknown;
    const first = Array.isArray(raw) ? raw[0] : (raw as { result?: unknown })?.result;
    const count = typeof first === "number" ? first : Number((first as { result?: unknown })?.result ?? NaN);
    if (!Number.isFinite(count)) throw new Error("bad limiter response");
    return { allowed: count <= limit, count };
  } catch {
    return { allowed: true, count: 0 };
  }
}
