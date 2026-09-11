import { Redis } from "@upstash/redis";

function client(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Fixed-window rate limit. Without Upstash env, always allows (offline-friendly). */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; count: number }> {
  const c = client();
  if (!c) return { allowed: true, count: 0 };
  try {
    const count = await c.incr(`ratelimit:${key}`);
    if (count === 1) await c.expire(`ratelimit:${key}`, windowSec);
    return { allowed: count <= limit, count };
  } catch {
    return { allowed: true, count: 0 };
  }
}
