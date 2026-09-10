import { describe, expect, it } from "vitest";
import { dedupeRepos, expandFallback, licenseLabel } from "@/lib/github";
import { stubComparison } from "@/lib/llm";
const rows = [
  { id: 1, full_name: "a/one", license: { spdx_id: "MIT" } },
  { id: 1, full_name: "a/one", license: { spdx_id: "MIT" } },
  { id: 2, full_name: "b/two", fork: true },
];
describe("search pipeline", () => {
  it("dedupes then attaches comparison", () => {
    const merged = dedupeRepos(rows as never);
    expect(merged).toHaveLength(1);
    expect(licenseLabel(merged[0] as never)).toBe("MIT");
    const withComparison = merged.map((r) => ({ ...r, comparison: stubComparison(r.full_name) }));
    for (const r of withComparison) expect(r.comparison.features.length).toBeGreaterThan(0);
  });
  it("expands queries deterministically", () => {
    expect(expandFallback("whatsapp api")).toHaveLength(3);
  });
});
