export type GHRepo = { id: number; full_name: string; description: string | null; stargazers_count: number; language: string | null; pushed_at: string; html_url: string; fork?: boolean; archived?: boolean; license?: { spdx_id?: string | null; name?: string | null } | null };
// Live GitHub returns license as an object; UI needs a short string.
export function licenseLabel(r: GHRepo): string {
  return r.license?.spdx_id || r.license?.name || "Unknown";
}
export function dedupeRepos(repos: GHRepo[]): GHRepo[] {
  const seen = new Set<number>(); const out: GHRepo[] = [];
  for (const r of repos) { if (r.fork || r.archived || seen.has(r.id)) continue; seen.add(r.id); out.push(r); }
  return out;
}
export function expandFallback(q: string): string[] {
  const base = q.toLowerCase().replace(/ thing| app| tool/g, "").trim();
  return [`${base} in:name,description`, `${base} self-hosted docker`, `${base} api alternative`];
}
export async function searchGithub(query: string): Promise<GHRepo[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query + " stars:>50")}&sort=stars&order=desc&per_page=10`, { headers });
  if (!res.ok) throw new Error(`github ${res.status}`);
  const j = await res.json(); return (j.items ?? []) as GHRepo[];
}
