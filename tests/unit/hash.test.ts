import { describe, expect, it } from "vitest";
import { queryHash } from "@/lib/cache";
describe("queryHash", () => {
  it("is stable and case-insensitive", () => {
    expect(queryHash("WhatsApp API")).toBe(queryHash("whatsapp api"));
    expect(queryHash("a")).toHaveLength(64);
  });
});
