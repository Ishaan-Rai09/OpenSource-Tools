import { describe, expect, it } from "vitest";
import { dedupeRepos } from "@/lib/github";
describe("dedupeRepos", () => {
  it("drops duplicate ids and forks", () => {
    const rows = [{ id: 1, fork: false }, { id: 1, fork: false }, { id: 2, fork: true }];
    expect(dedupeRepos(rows as never)).toEqual([{ id: 1, fork: false }]);
  });
});
