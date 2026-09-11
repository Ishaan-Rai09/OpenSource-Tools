import { describe, expect, it } from "vitest";
import { getCached, setCached } from "@/lib/cache";

describe("cache without Upstash env", () => {
  it("getCached returns null (noop)", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    await expect(getCached("search:abc")).resolves.toBeNull();
  });

  it("setCached resolves without throwing (noop)", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    await expect(setCached("search:abc", { hello: 1 })).resolves.toBeUndefined();
  });
});
