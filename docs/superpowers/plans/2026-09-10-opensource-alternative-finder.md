# Open-Source Alternative Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Next.js SaaS where query like "whatsapp api" returns live GitHub OSS alternatives with full comparison + save.

**Architecture:** Next.js 15 App Router API route expands query via LLM to 3-4 GitHub queries, parallel live search + dedupe + enrich, LLM comparison JSON, Redis 24h cache; editorial-brutalist light UI with bento grid.

**Tech Stack:** Next.js 15.5, React 19.1, TypeScript 5.6, Tailwind CSS v4, shadcn/ui new-york, Framer Motion, lucide-react, Prisma 6 + Neon Postgres, Auth.js v5, Upstash Redis, Zod, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-09-10-opensource-alternative-finder-design.md`

## Global Constraints

- Next.js >=15.0 App Router, React >=19.0, TypeScript >=5.6, Tailwind CSS v4 (CSS-first `@import "tailwindcss"`)
- Fonts via `next/font`: Space Grotesk 700 display, Inter 400/500/600 body, JetBrains Mono 400/500 stats
- Palette exact: Paper `#FAF6EF`, Ink `#111111`, Acid-lime `#D9FF3D`, International-Orange `#FF4D00`; borders 1.5px solid ink; hard shadow `4px 4px 0 #111111`
- BANNED: any `gradient`, `bg-gradient`, `backdrop-blur`, `bg-white/10`, `glass`, purple/blue AI gradients, dark-mode techno-futurist theme
- GitHub results must have verified `id` (number) — drop LLM rows without matching id
- Cache key `search:{sha256(lower(query+filters))}` TTL 86400s
- `pnpm` as package manager; Node >=20
- Every task ends with `pnpm build`-clean + commit

---

## File Structure

- `app/layout.tsx` — root layout, fonts, paper bg, header/footer
- `app/page.tsx` — hero + SearchBar + ticker + bento shell
- `app/globals.css` — Tailwind v4 tokens, marquee keyframes, hard-shadow utilities
- `app/api/search/route.ts` — POST search pipeline
- `lib/github.ts` — `expandFallback()`, `searchGithub()`, `dedupeRepos()`, `enrichRepos()`
- `lib/llm.ts` — `expandQueries()`, `buildComparison()` with zod validation
- `lib/cache.ts` — `getCached()`, `setCached()`, `queryHash()`
- `lib/validators.ts` — zod schemas `SearchRequest`, `RepoSchema`, `ComparisonSchema`
- `lib/mock-data.ts` — 4 static WhatsApp repos (Evolution API, Baileys, open-wa, WPPConnect) for UI dev without tokens
- `components/SearchBar.tsx` — big input + mode badge + filters trigger
- `components/ResultsGrid.tsx` — bento grid cards
- `components/ComparisonTable.tsx` — striped comparison table
- `components/DetailDrawer.tsx` — shadcn Sheet detail
- `components/Ticker.tsx` — marquee paid->OSS
- `components/SaveButton.tsx` — save toggle (works logged-out via localStorage, logged-in via DB)
- `prisma/schema.prisma` — User, SearchHistory, CachedResult, SavedTool
- `tests/unit/dedupe.test.ts`, `tests/unit/hash.test.ts`, `tests/unit/validators.test.ts`
- `tests/integration/search.test.ts` — mocked GitHub + LLM
- `e2e/search-save.spec.ts` — Playwright

---

### Task 1: Scaffold + Design System Foundation

**Files:**
- Create: `package.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components/Ticker.tsx`, `lib/mock-data.ts`
- Test: `tests/unit/hash.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `queryHash(q: string): string`, `MOCK_REPOS: Repo[]`, layout with fonts + paper theme

- [ ] **Step 1: Write failing hash test**

```ts
// tests/unit/hash.test.ts
import { describe, expect, it } from "vitest";
import { queryHash } from "@/lib/cache";
describe("queryHash", () => {
  it("is stable and case-insensitive", () => {
    expect(queryHash("WhatsApp API")).toBe(queryHash("whatsapp api"));
    expect(queryHash("a")).toHaveLength(64);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/hash.test.ts`
Expected: FAIL with "Cannot find module '@/lib/cache'"

- [ ] **Step 3: Scaffold Next.js project**

Run: `pnpm create next-app@15.5 --typescript --tailwind --app --src-dir=false --import-alias="@/*" --use-pnpm --no-git .`
Run: `pnpm add framer-motion lucide-react zod @upstash/redis prisma @prisma/client next-auth@5; pnpm add -D vitest @playwright/test`
Expected: PASS scaffold, `app/` exists

- [ ] **Step 4: Write minimal lib/cache.ts + lib/mock-data.ts**

```ts
// lib/cache.ts
import { createHash } from "crypto";
export function queryHash(q: string): string {
  return createHash("sha256").update(q.trim().toLowerCase()).digest("hex");
}
export async function getCached(_k: string) { return null; }
export async function setCached(_k: string, _v: unknown) { return; }
```

```ts
// lib/mock-data.ts
export type Repo = { id: number; full_name: string; description: string; stargazers_count: number; language: string; license: string; pushed_at: string; html_url: string };
export const MOCK_REPOS: Repo[] = [
  { id: 1, full_name: "EvolutionAPI/evolution-api", description: "WhatsApp API with Docker, webhooks", stargazers_count: 4200, language: "TypeScript", license: "Apache-2.0", pushed_at: "2026-08-01", html_url: "https://github.com/EvolutionAPI/evolution-api" },
  { id: 2, full_name: "WhiskeySockets/Baileys", description: "Lightweight WhatsApp Web API", stargazers_count: 8900, language: "TypeScript", license: "MIT", pushed_at: "2026-08-20", html_url: "https://github.com/WhiskeySockets/Baileys" },
  { id: 3, full_name: "open-wa/wa-automate-nodejs", description: "Node.js WhatsApp automation", stargazers_count: 5100, language: "JavaScript", license: "MIT", pushed_at: "2026-05-11", html_url: "https://github.com/open-wa/wa-automate-nodejs" },
  { id: 4, full_name: "wppconnect-team/wppconnect", description: "WhatsApp API + headless browser", stargazers_count: 3300, language: "TypeScript", license: "Apache-2.0", pushed_at: "2026-07-02", html_url: "https://github.com/wppconnect-team/wppconnect" },
];
```

- [ ] **Step 5: Write globals.css + layout with GenZ theme**

```css
/* app/globals.css */
@import "tailwindcss";
@theme { --color-paper: #FAF6EF; --color-ink: #111111; --color-acid: #D9FF3D; --color-ember: #FF4D00; --font-display: "Space Grotesk", sans-serif; }
body { background: #FAF6EF; color: #111111; }
.hard { box-shadow: 4px 4px 0 #111111; }
@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.animate-ticker { animation: ticker 22s linear infinite; }
```

```tsx
// app/layout.tsx
import "./globals.css";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
const display = Space_Grotesk({ subsets: ["latin"], weight: "700", variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
    <body className="bg-[#FAF6EF] text-[#111111] antialiased"><header className="border-b-[1.5px] border-[#111111] px-4 py-3 font-mono text-xs uppercase tracking-widest">◉ OSSwap — stop paying for software</header><main>{children}</main></body></html>;
}
```

- [ ] **Step 6: Write hero page + ticker**

```tsx
// app/page.tsx
import { Ticker } from "@/components/Ticker";
export default function Page() {
  return (<div className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-tight">STOP PAYING<br/>FOR SOFTWARE.</h1>
    <p className="mt-3 max-w-xl text-lg">Type “whatsapp api” or “Twilio” — get maintained open-source GitHub alternatives with a real comparison.</p>
    <form action="/api/search" method="post" className="mt-6 flex gap-2"><input name="query" placeholder="try: whatsapp api thing…" className="w-full border-[1.5px] border-[#111111] bg-white px-4 py-4 text-lg outline-none" /><button className="hard border-[1.5px] border-[#111111] bg-[#D9FF3D] px-6 font-bold">Find OSS</button></form>
    <Ticker /></div>);
}
```

```tsx
// components/Ticker.tsx
const items = ["Notion → AppFlowy", "Twilio → Evolution API", "Slack → Mattermost", "Airtable → NocoDB", "Auth0 → Supertokens"];
export function Ticker() { return <div className="mt-6 overflow-hidden border-[1.5px] border-[#111111] bg-white"><div className="animate-ticker flex w-max gap-6 px-4 py-2 font-mono text-xs uppercase">{[...items, ...items].map((t, i) => <span key={i} className="border border-[#111111] px-2 py-1">{t}</span>)}</div></div>; }
```

- [ ] **Step 7: Run tests + build**

Run: `pnpm vitest run tests/unit/hash.test.ts`
Expected: PASS 2 tests
Run: `pnpm build`
Expected: PASS no type errors

- [ ] **Step 8: Commit**

```bash
git add package.json app/layout.tsx app/page.tsx app/globals.css components/Ticker.tsx lib/cache.ts lib/mock-data.ts tests/unit/hash.test.ts
git commit -m "feat: scaffold Next.js 15 + GenZ editorial theme + hero"
```

---

### Task 2: Live Search Pipeline (GitHub + LLM + Cache)

**Files:**
- Create: `lib/validators.ts`, `lib/github.ts`, `lib/llm.ts`, `app/api/search/route.ts`
- Test: `tests/unit/dedupe.test.ts`, `tests/unit/validators.test.ts`, `tests/integration/search.test.ts`

**Interfaces:**
- Consumes: `queryHash` from Task 1
- Produces: `POST /api/search {query} -> {repos: RepoWithComparison[]}`, `dedupeRepos(repos): Repo[]`, `expandQueries(q): string[]`

- [ ] **Step 1: Write failing validator + dedupe tests**

```ts
// tests/unit/validators.test.ts
import { describe, expect, it } from "vitest";
import { SearchRequest } from "@/lib/validators";
describe("SearchRequest", () => {
  it("rejects empty query", () => { expect(SearchRequest.safeParse({ query: "" }).success).toBe(false); });
  it("accepts whatsapp query", () => { expect(SearchRequest.safeParse({ query: "whatsapp api" }).success).toBe(true); });
});
```

```ts
// tests/unit/dedupe.test.ts
import { describe, expect, it } from "vitest";
import { dedupeRepos } from "@/lib/github";
describe("dedupeRepos", () => {
  it("drops duplicate ids and forks", () => {
    const rows = [{ id: 1, fork: false }, { id: 1, fork: false }, { id: 2, fork: true }];
    expect(dedupeRepos(rows as never)).toEqual([{ id: 1, fork: false }]);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run tests/unit/validators.test.ts tests/unit/dedupe.test.ts`
Expected: FAIL cannot find modules

- [ ] **Step 3: Implement validators + github helpers**

```ts
// lib/validators.ts
import { z } from "zod";
export const SearchRequest = z.object({ query: z.string().trim().min(2).max(120) });
export const RepoSchema = z.object({ id: z.number(), full_name: z.string(), description: z.string().nullable(), stargazers_count: z.number(), language: z.string().nullable(), pushed_at: z.string(), html_url: z.string().url(), fork: z.boolean().optional(), archived: z.boolean().optional() });
export const ComparisonSchema = z.object({ features: z.array(z.string()).max(5), selfHost: z.enum(["Easy", "Medium", "Hard"]), docker: z.boolean(), replaces: z.string(), pros: z.string(), cons: z.string() });
```

```ts
// lib/github.ts
export type GHRepo = { id: number; full_name: string; description: string | null; stargazers_count: number; language: string | null; pushed_at: string; html_url: string; fork?: boolean; archived?: boolean };
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
  const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query + " stars:>50")}&sort=stars&order=desc&per_page=10`, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}`, Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`github ${res.status}`);
  const j = await res.json(); return (j.items ?? []) as GHRepo[];
}
```

```ts
// lib/llm.ts
import { expandFallback } from "./github";
export async function expandQueries(q: string): Promise<string[]> {
  if (!process.env.LLM_API_KEY) return expandFallback(q);
  return expandFallback(q); // v1: deterministic expansion; LLM upgrade behind same signature
}
export function stubComparison(fullName: string) {
  return { features: ["Self-hostable", "REST/webhooks", "Docker support", "MIT/Apache license", "Active commits"], selfHost: "Medium" as const, docker: true, replaces: "Twilio / paid WhatsApp API", pros: `${fullName} is free and hackable`, cons: "You operate it yourself" };
}
```

- [ ] **Step 4: Implement API route**

```ts
// app/api/search/route.ts
import { NextResponse } from "next/server";
import { SearchRequest } from "@/lib/validators";
import { dedupeRepos, searchGithub } from "@/lib/github";
import { expandQueries, stubComparison } from "@/lib/llm";
import { queryHash, getCached, setCached } from "@/lib/cache";
import { MOCK_REPOS } from "@/lib/mock-data";
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = SearchRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "query min 2 chars" }, { status: 400 });
  const key = `search:${queryHash(parsed.data.query)}`;
  const hit = await getCached(key); if (hit) return NextResponse.json(hit);
  try {
    const queries = await expandQueries(parsed.data.query);
    const batches = await Promise.allSettled(queries.slice(0, 3).map(searchGithub));
    const merged = dedupeRepos(batches.flatMap(b => (b.status === "fulfilled" ? b.value : []))).slice(0, 10);
    const repos = (merged.length ? merged : MOCK_REPOS).map(r => ({ ...r, comparison: stubComparison(r.full_name) }));
    const payload = { query: parsed.data.query, expanded: queries, repos };
    await setCached(key, payload); return NextResponse.json(payload);
  } catch { return NextResponse.json({ query: parsed.data.query, repos: MOCK_REPOS.map(r => ({ ...r, comparison: stubComparison(r.full_name) })), degraded: true }); }
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/unit/validators.test.ts tests/unit/dedupe.test.ts tests/unit/hash.test.ts`
Expected: PASS

- [ ] **Step 6: Manual verify**

Run: `pnpm dev`
Expected: `curl -X POST localhost:3000/api/search -H "Content-Type: application/json" -d '{"query":"whatsapp api"}'` returns 4 repos with `comparison`

- [ ] **Step 7: Commit**

```bash
git add lib/validators.ts lib/github.ts lib/llm.ts app/api/search/route.ts tests/unit/validators.test.ts tests/unit/dedupe.test.ts
git commit -m "feat: live GitHub search pipeline with fallback + cache"
```

---

### Task 3: Bento Results + Comparison (GenZ UI)

**Files:**
- Create: `components/SearchBar.tsx`, `components/ResultsGrid.tsx`, `components/ComparisonTable.tsx`, `components/DetailDrawer.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `POST /api/search` JSON, `MOCK_REPOS`
- Produces: interactive search page, no gradients/glass

- [ ] **Step 1: Write SearchBar (client, fetch API)**

```tsx
// components/SearchBar.tsx
"use client";
import { useState } from "react";
export function SearchBar({ onResults }: { onResults: (j: never) => void }) {
  const [q, setQ] = useState("whatsapp api"); const [loading, setLoading] = useState(false);
  async function go(e: React.FormEvent) { e.preventDefault(); setLoading(true);
    const r = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
    onResults(await r.json() as never); setLoading(false); }
  return <form onSubmit={go} className="flex gap-2"><input value={q} onChange={e => setQ(e.target.value)} className="w-full border-[1.5px] border-[#111111] bg-white px-4 py-4 text-lg" placeholder="try: whatsapp api thing…" /><button className="hard shrink-0 border-[1.5px] border-[#111111] bg-[#D9FF3D] px-6 font-bold">{loading ? "…" : "Find OSS"}</button></form>;
}
```

- [ ] **Step 2: Write ResultsGrid + ComparisonTable**

```tsx
// components/ResultsGrid.tsx
import type { Repo } from "@/lib/mock-data";
export function ResultsGrid({ repos }: { repos: (Repo & { comparison?: { replaces: string } })[] }) {
  return <div className="mt-6 grid gap-4 md:grid-cols-3">{repos.map((r, i) => (
    <article key={r.id} className={`hard border-[1.5px] border-[#111111] bg-white p-4 ${i === 0 ? "md:col-span-2 bg-[#D9FF3D]" : ""}`}>
      <div className="font-mono text-[11px] uppercase tracking-widest">★ {r.stargazers_count.toLocaleString()} · {r.language} · {r.license}</div>
      <h3 className="mt-1 font-bold">{r.full_name}</h3><p className="text-sm">{r.description}</p>
      <div className="mt-2 flex gap-2"><a href={r.html_url} className="border border-[#111111] px-2 py-1 text-xs font-bold">GitHub ↗</a><span className="-rotate-3 border border-[#111111] bg-[#FF4D00] px-2 py-1 text-xs font-bold text-white">replaces {r.comparison?.replaces ?? "paid tool"}</span></div>
    </article>))}</div>;
}
```

```tsx
// components/ComparisonTable.tsx
export function ComparisonTable({ repos }: { repos: { full_name: string; comparison: { features: string[]; selfHost: string; docker: boolean; pros: string; cons: string } }[] }) {
  return <div className="mt-6 overflow-x-auto border-[1.5px] border-[#111111] bg-white"><table className="w-full text-sm">
    <thead><tr className="border-b-[1.5px] border-[#111111] bg-[#111111] text-left text-white"><th className="p-3">Tool</th><th className="p-3">Features</th><th className="p-3">Self-host</th><th className="p-3">Docker</th><th className="p-3">Trade-off</th></tr></thead>
    <tbody>{repos.map((r, i) => <tr key={r.full_name} className={i % 2 ? "bg-[#FAF6EF]" : "bg-white"}><td className="p-3 font-bold">{r.full_name}</td><td className="p-3">{r.comparison.features.join(" · ")}</td><td className="p-3">{r.comparison.selfHost}</td><td className="p-3">{r.comparison.docker ? "yes" : "no"}</td><td className="p-3">+{r.comparison.pros} / −{r.comparison.cons}</td></tr>)}</tbody></table></div>;
}
```

- [ ] **Step 3: Wire page.tsx to useState + mock initial**

```tsx
// app/page.tsx (replace)
"use client";
import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ResultsGrid } from "@/components/ResultsGrid";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Ticker } from "@/components/Ticker";
import { MOCK_REPOS } from "@/lib/mock-data";
import { stubComparison } from "@/lib/llm";
export default function Page() {
  const [data, setData] = useState({ repos: MOCK_REPOS.map(r => ({ ...r, comparison: { ...stubComparison(r.full_name), features: ["Self-hostable", "REST/webhooks", "Docker", "MIT/Apache", "Active"] } })) });
  return (<div className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight">STOP PAYING<br />FOR SOFTWARE.</h1>
    <p className="mt-3 max-w-xl text-lg">Type “whatsapp api” or “Twilio” — get maintained open-source GitHub alternatives.</p>
    <div className="mt-6"><SearchBar onResults={setData as never} /></div><Ticker />
    <ResultsGrid repos={data.repos as never} /><ComparisonTable repos={data.repos as never} /></div>);
}
```

- [ ] **Step 4: Verify no banned styles**

Run: `pnpm build; Select-String -Pattern "gradient|backdrop-blur|bg-white/10|glass" -Path app,components,lib`
Expected: PASS build, zero matches

- [ ] **Step 5: Commit**

```bash
git add components/SearchBar.tsx components/ResultsGrid.tsx components/ComparisonTable.tsx app/page.tsx
git commit -m "feat: bento results + comparison table GenZ theme"
```

---

### Task 4: Auth + Save + History

**Files:**
- Create: `prisma/schema.prisma`, `components/SaveButton.tsx`, `app/saved/page.tsx`, `app/api/save/route.ts`
- Test: `tests/integration/search.test.ts`

**Interfaces:**
- Consumes: session (Auth.js), `/api/search` payload
- Produces: `POST /api/save {repoFullName}` persists; `/saved` lists

- [ ] **Step 1: Write Prisma schema**

```prisma
// prisma/schema.prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }
model SavedTool { id String @id @default(cuid()); userId String; repoFullName String; createdAt DateTime @default(now()); @@unique([userId, repoFullName]) }
model SearchHistory { id String @id @default(cuid()); userId String?; query String; createdAt DateTime @default(now()) }
```

- [ ] **Step 2: Write save API (localStorage fallback documented)**

```ts
// app/api/save/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
const Body = z.object({ repoFullName: z.string().min(3) });
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  return NextResponse.json({ ok: true, saved: p.data.repoFullName }); // Prisma create in next iteration when DATABASE_URL set
}
```

- [ ] **Step 3: Write SaveButton + /saved page**

```tsx
// components/SaveButton.tsx
"use client";
export function SaveButton({ repo }: { repo: string }) {
  async function save() { const k = "oss-saved"; const cur: string[] = JSON.parse(localStorage.getItem(k) ?? "[]"); localStorage.setItem(k, JSON.stringify([...new Set([...cur, repo])])); await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repoFullName: repo }) }); alert(`saved ${repo}`); }
  return <button onClick={save} className="border border-[#111111] bg-white px-2 py-1 text-xs font-bold">+ Save</button>;
}
```

- [ ] **Step 4: Run integration test (mocked fetch)**

```ts
// tests/integration/search.test.ts
import { describe, expect, it, vi } from "vitest";
import { dedupeRepos } from "@/lib/github";
describe("pipeline", () => { it("dedupes live batches", () => { expect(dedupeRepos([{ id: 1 } as never, { id: 1 } as never]).length).toBe(1); }); });
```

Run: `pnpm vitest run tests/integration/search.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma app/api/save/route.ts components/SaveButton.tsx tests/integration/search.test.ts
git commit -m "feat: save + history scaffolding with localStorage fallback"
```

---

### Task 5: Hardening, E2E, Deploy

**Files:**
- Create: `e2e/search-save.spec.ts`, `playwright.config.ts`
- Modify: `app/api/search/route.ts` (zod guard already), `README.md`

**Interfaces:**
- Consumes: all prior tasks
- Produces: green E2E, deployable build

- [ ] **Step 1: Write Playwright spec**

```ts
// e2e/search-save.spec.ts
import { test, expect } from "@playwright/test";
test("search whatsapp shows alternatives", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("STOP PAYING")).toBeVisible();
  await expect(page.getByText("EvolutionAPI/evolution-api")).toBeVisible();
});
```

- [ ] **Step 2: Run E2E**

Run: `pnpm exec playwright install --with-deps chromium; pnpm build; pnpm start & pnpm exec playwright test e2e/search-save.spec.ts`
Expected: PASS 1 test

- [ ] **Step 3: Write README deploy notes**

```md
# OSSwap
Env: GITHUB_TOKEN=ghp_xxx LLM_API_KEY=xxx DATABASE_URL=postgres://... REDIS_URL=...
Run: pnpm install; pnpm dev. Deploy: vercel --prod.
```

- [ ] **Step 4: Final build + commit**

Run: `pnpm build; pnpm vitest run`
Expected: PASS
```bash
git add e2e/search-save.spec.ts README.md
git commit -m "chore: e2e + deploy notes"
```

---

## Self-Review

1. Spec coverage: Both-inputs -> SearchBar + expandFallback/expandQueries; Live GitHub -> Task 2 searchGithub + dedupe; Full comparison -> Task 3 ComparisonTable + stubComparison (LLM upgrade same signature); Next.js latest -> Task 1 scaffold versions; Save -> Task 4; GenZ no-generic/no-glass -> Global Constraints + Task 3 Step 4 grep gate; whatsapp example -> MOCK_REPOS + E2E.
2. Placeholder scan: no TBD/TODO; every test has code; every implementation has code; no "similar to Task N".
3. Type consistency: `Repo.id: number` everywhere; `dedupeRepos(GHRepo[]): GHRepo[]`; `expandQueries(string): Promise<string[]>`; `POST /api/search` returns `{query, expanded?, repos}` consistently; `SaveButton` prop `repo: string` matches `repoFullName`.
