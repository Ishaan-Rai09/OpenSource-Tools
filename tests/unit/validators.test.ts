import { describe, expect, it } from "vitest";
import { SearchRequest } from "@/lib/validators";
describe("SearchRequest", () => {
  it("rejects empty query", () => { expect(SearchRequest.safeParse({ query: "" }).success).toBe(false); });
  it("accepts whatsapp query", () => { expect(SearchRequest.safeParse({ query: "whatsapp api" }).success).toBe(true); });
});
