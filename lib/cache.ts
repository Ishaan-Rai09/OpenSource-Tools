import { createHash } from "crypto";
export function queryHash(q: string): string {
  return createHash("sha256").update(q.trim().toLowerCase()).digest("hex");
}
export async function getCached(_k: string) { return null; }
export async function setCached(_k: string, _v: unknown) { return; }
