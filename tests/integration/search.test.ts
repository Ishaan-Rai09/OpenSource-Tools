import { describe, expect, it } from "vitest";
import { dedupeRepos, expandFallback } from "@/lib/github";
import { stubComparison } from "@/lib/llm";
import { MOCK_REPOS } from "@/lib/mock-data";
describe("search pipeline", () => {
  it("dedupes then attaches comparison", () => {
    const merged = dedupeRepos(MOCK_REPOS as never);
    expect(merged).toHaveLength(4);
    const withComparison = merged.map((r) => ({ ...r, comparison: stubComparison(r.full_name) }));
    for (const r of withComparison) expect(r.comparison.features.length).toBeGreaterThan(0);
  });
  it("expands queries deterministically", () => {
    expect(expandFallback("whatsapp api")).toHaveLength(3);
  });
});
