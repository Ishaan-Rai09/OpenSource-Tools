import { createHash } from "crypto";
import { Redis } from "@upstash/redis";

export function queryHash(q: string): string {
  return createHash("sha256").update(q.trim().toLowerCase()).digest("hex");
}

function client(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function getCached<T = unknown>(k: string): Promise<T | null> {
  const c = client();
  if (!c) return null;
  try {
    return (await c.get<T>(k)) ?? null;
  } catch {
    return null;
  }
}

export async function setCached(k: string, v: unknown): Promise<void> {
  const c = client();
  if (!c) return;
  try {
    await c.set(k, v, { ex: 86400 });
  } catch {
    /* cache is best-effort */
  }
}
