import { describe, expect, it, vi, afterEach } from "vitest";
afterEach(() => { vi.unstubAllGlobals(); delete process.env.NVIDIA_API_KEY; });
import { expandQueries, stubComparison } from "@/lib/llm";
describe("expandQueries", () => {
  it("falls back without key", async () => {
    const q = await expandQueries("whatsapp api thing");
    expect(q.length).toBe(3); expect(q[0]).toContain("whatsapp api");
  });
  it("uses NVIDIA chat completions with key", async () => {
    process.env.NVIDIA_API_KEY = "test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: '["a whatsapp api","b","c"]' } }] }), { status: 200 })));
    const q = await expandQueries("whatsapp api thing");
    expect(q.length).toBe(3);
  });
});
