import { dedupeRepos, searchGithub, type GHRepo } from "./github";
import { expandQueries, buildComparison, stubComparison } from "./llm";
import { queryHash, getCached, setCached } from "./cache";
import { MOCK_REPOS } from "./mock-data";
import { dbConnect } from "./db";
import { SearchHistory } from "@/models/SearchHistory";

export type SearchRepo = GHRepo & { comparison: unknown };
export type SearchPayload = {
  query: string;
  expanded: string[];
  repos: SearchRepo[];
  degraded?: boolean;
};

export async function runSearch(query: string): Promise<SearchPayload> {
  const key = `search:${queryHash(query)}`;
  const hit = await getCached(key);
  if (hit) return hit as SearchPayload;
  // Fire-and-forget search history (never block response, never log identity).
  // Written only on cache MISS so repeat queries don't spam history.
  dbConnect()
    .then((ok) => {
      if (ok) SearchHistory.create({ query }).catch(() => {});
    })
    .catch(() => {});
  try {
    const queries = await expandQueries(query);
    const batches = await Promise.allSettled(queries.slice(0, 3).map(searchGithub));
    const merged = dedupeRepos(
      batches.flatMap((b) => (b.status === "fulfilled" ? b.value : []))
    ).slice(0, 10);
    const base = merged.length ? merged : MOCK_REPOS;
    const repos = await Promise.all(
      base.map(async (r) => ({ ...r, comparison: await buildComparison(r.full_name, r.description) }))
    );
    const payload: SearchPayload = { query, expanded: queries, repos: repos as SearchRepo[] };
    await setCached(key, payload);
    return payload;
  } catch {
    return {
      query,
      repos: MOCK_REPOS.map((r) => ({ ...r, comparison: stubComparison(r.full_name) })) as SearchRepo[],
      expanded: [],
      degraded: true,
    };
  }
}
