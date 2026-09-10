import { dedupeRepos, searchGithub, licenseLabel, type GHRepo } from "./github";
import { expandQueries, buildComparison } from "./llm";
import { queryHash, getCached, setCached } from "./cache";
import { dbConnect } from "./db";
import { SearchHistory } from "@/models/SearchHistory";

export type SearchRepo = GHRepo & { comparison: unknown };
export type SearchPayload = {
  query: string;
  expanded: string[];
  repos: SearchRepo[];
  error?: string;
};

function githubErrorMessage(reasons: unknown[]): string {
  const msgs = reasons.map((r) => (r instanceof Error ? r.message : String(r)));
  if (msgs.some((m) => /github (403|429)/.test(m)))
    return "GitHub rate limit hit — add a GITHUB_TOKEN env var (free, read-only) and try again.";
  if (msgs.some((m) => /github 401/.test(m)))
    return "GitHub rejected the request (401) — set a valid GITHUB_TOKEN env var.";
  return "Live GitHub search failed — check your connection and try again in a minute.";
}

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
    const failures = batches
      .filter((b): b is PromiseRejectedResult => b.status === "rejected")
      .map((b) => b.reason);
    const merged = dedupeRepos(
      batches.flatMap((b) => (b.status === "fulfilled" ? b.value : []))
    ).slice(0, 10);
    // Live-only: never serve mock repos. Empty GitHub result = honest error.
    if (!merged.length) {
      return { query, expanded: queries, repos: [], error: githubErrorMessage(failures) };
    }
    const repos = await Promise.all(
      merged.map(async (r) => ({ ...r, license: licenseLabel(r), comparison: await buildComparison(r.full_name, r.description) }))
    );
    const payload: SearchPayload = { query, expanded: queries, repos: repos as SearchRepo[] };
    await setCached(key, payload);
    return payload;
  } catch (e) {
    return {
      query,
      repos: [],
      expanded: [],
      error: githubErrorMessage([e]),
    };
  }
}
