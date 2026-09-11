import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

function stubUpstash(count: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify([{ result: count }]), { status: 200 }))
  );
}

describe("checkRateLimit without env", () => {
  it("always allows offline", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    await expect(checkRateLimit("k", 1, 60)).resolves.toEqual({ allowed: true, count: 0 });
  });
});

describe("checkRateLimit with Upstash (mocked fetch)", () => {
  it("allows under the limit", async () => {
    stubUpstash(1);
    const r = await checkRateLimit("user1", 20, 60);
    expect(r).toEqual({ allowed: true, count: 1 });
  });

  it("blocks over the limit", async () => {
    stubUpstash(21);
    const r = await checkRateLimit("user1", 20, 60);
    expect(r.allowed).toBe(false);
    expect(r.count).toBe(21);
  });

  it("allows on backend error (fail-open)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 }))
    );
    const r = await checkRateLimit("user1", 1, 60);
    expect(r.allowed).toBe(true);
  });
});
