import { NextResponse } from "next/server";
import { SearchRequest } from "@/lib/validators";
import { dedupeRepos, searchGithub } from "@/lib/github";
import { expandQueries, buildComparison, stubComparison } from "@/lib/llm";
import { queryHash, getCached, setCached } from "@/lib/cache";
import { MOCK_REPOS } from "@/lib/mock-data";
import { dbConnect } from "@/lib/db";
import { SearchHistory } from "@/models/SearchHistory";
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = SearchRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "query min 2 chars" }, { status: 400 });
  // Fire-and-forget search history (never block response, never log identity)
  dbConnect()
    .then((ok) => { if (ok) SearchHistory.create({ query: parsed.data.query }).catch(() => {}); })
    .catch(() => {});
  const key = `search:${queryHash(parsed.data.query)}`;
  const hit = await getCached(key); if (hit) return NextResponse.json(hit);
  try {
    const queries = await expandQueries(parsed.data.query);
    const batches = await Promise.allSettled(queries.slice(0, 3).map(searchGithub));
    const merged = dedupeRepos(batches.flatMap(b => (b.status === "fulfilled" ? b.value : []))).slice(0, 10);
    const base = merged.length ? merged : MOCK_REPOS;
    const repos = await Promise.all(base.map(async (r) => ({ ...r, comparison: await buildComparison(r.full_name, r.description) })));
    const payload = { query: parsed.data.query, expanded: queries, repos };
    await setCached(key, payload); return NextResponse.json(payload);
  } catch { return NextResponse.json({ query: parsed.data.query, repos: MOCK_REPOS.map(r => ({ ...r, comparison: stubComparison(r.full_name) })), degraded: true }); }
}
