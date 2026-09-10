# Phase 2 Implementation Plan (NVIDIA + Mongo + Telegram + PWA + Privacy)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap stubs for production backends (NVIDIA LLM, MongoDB, Upstash) + add Telegram bot + PWA + privacy/security hardening, all graceful without keys.

**Architecture:** Same pipeline; `lib/llm.ts` calls NVIDIA OpenAI-compatible endpoint with zod-validated JSON + stub fallback; Mongoose persists SavedTool/SearchHistory (90d TTL) with connect no-op when `MONGODB_URI` absent; grammY webhook reuses search pipeline; manual PWA shell.

**Tech Stack:** Next.js 15.5, React 19.1, TS 5.6, Tailwind v4, Mongoose 8, Auth.js v5 (github-only, JWT), Upstash Redis REST, grammY 1.x, NVIDIA NIM (`meta/llama-3.1-70b-instruct`), Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-09-10-opensource-alternative-finder-design.md` (Phase 2 Amendment)

## Global Constraints

- NVIDIA base `https://integrate.api.nvidia.com/v1`, model default `meta/llama-3.1-70b-instruct` via `NVIDIA_MODEL`, key via `NVIDIA_API_KEY` (server-only, never `NEXT_PUBLIC_`)
- Mongo via `MONGODB_URI`; all DB/cache/LLM calls degrade gracefully when env absent (v1 mock behavior preserved)
- Palette/bans unchanged: Paper `#FAF6EF`, Ink `#111111`, Acid `#D9FF3D`, Ember `#FF4D00`; BANNED `gradient|backdrop-blur|bg-white/10|glass`
- Secrets server-only; no PII in logs; SearchHistory TTL 90 days
- `pnpm`; Node >=20; every task ends `pnpm build`-clean + commit

---

### Task A: NVIDIA LLM Wiring

**Files:** Modify `lib/llm.ts`; Create `tests/unit/llm.test.ts`; Modify `.env.example` (create)

**Interfaces:** Consumes `expandFallback`; Produces `expandQueries(q): Promise<string[]>`, `buildComparison(repo): Promise<Comparison>` (same zod shape as stub)

- [ ] **Step 1: Write failing test (mocked fetch)**

```ts
// tests/unit/llm.test.ts
import { describe, expect, it, vi, afterEach } from "vitest";
afterEach(() => { vi.unstubAllGlobals(); delete process.env.NVIDIA_API_KEY; });
import { expandQueries, stubComparison } from "@/lib/llm";
describe("expandQueries", () => {
  it("falls back without key", async () => {
    const q = await expandQueries("whatsapp api thing");
    expect(q.length).toBe(3); expect(q[0]).toContain("whatsapp api");
  });
  it("uses NVIDIA chat completions with key", async () => {
    process.env.NVIDIA_API_KEY = "test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: '["a whatsapp api","b","c"]' } }] }), { status: 200 })));
    const q = await expandQueries("whatsapp api thing");
    expect(q.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run to verify fail** — `pnpm vitest run tests/unit/llm.test.ts` → FAIL no `buildComparison`
- [ ] **Step 3: Implement OpenAI-compatible client + buildComparison**

```ts
// lib/llm.ts (additions; keep expandFallback + stubComparison)
import { ComparisonSchema } from "./validators";
const BASE = "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-70b-instruct";
async function chat(system: string, user: string): Promise<string> {
  const key = process.env.NVIDIA_API_KEY; if (!key) throw new Error("no key");
  const r = await fetch(`${BASE}/chat/completions`, { method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 600,
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
  if (!r.ok) throw new Error(`nvidia ${r.status}`);
  const j = await r.json(); return j.choices?.[0]?.message?.content ?? "";
}
export async function buildComparison(fullName: string, description: string | null) {
  try {
    const raw = await chat("Return ONLY valid JSON.", `repo ${fullName}: ${description ?? ""}. JSON: {"features":[5 strings],"selfHost":"Easy|Medium|Hard","docker":bool,"replaces":string,"pros":string,"cons":string}`);
    const parsed = ComparisonSchema.safeParse(JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}"));
    if (parsed.success) return parsed.data;
  } catch { /* fall through */ }
  return stubComparison(fullName);
}
```

Wire `expandQueries` to try `chat("Return ONLY a JSON array of 3 GitHub search queries.", ...)` with `JSON.parse` + fallback to `expandFallback` on any error. Wire `app/api/search/route.ts` to use `buildComparison` per repo (keep stub path when no key).
- [ ] **Step 4: `.env.example`** — `NVIDIA_API_KEY=`, `NVIDIA_MODEL=meta/llama-3.1-70b-instruct`, `MONGODB_URI=`, `UPSTASH_REDIS_REST_URL=`, `UPSTASH_REDIS_REST_TOKEN=`, `TELEGRAM_BOT_TOKEN=`, `AUTH_SECRET=`, `AUTH_GITHUB_ID=`, `AUTH_GITHUB_SECRET=`
- [ ] **Step 5: Verify** — `pnpm vitest run tests/unit/llm.test.ts` PASS; `pnpm build` PASS
- [ ] **Step 6: Commit** — `git add lib/llm.ts tests/unit/llm.test.ts .env.example app/api/search/route.ts` → `feat: NVIDIA LLM with validated fallback`

---

### Task B: MongoDB + Save Persist + Privacy + Security Headers

**Files:** Create `lib/db.ts`, `models/SearchHistory.ts`, `models/SavedTool.ts`, `app/privacy/page.tsx`; Modify `app/api/save/route.ts`, `app/api/search/route.ts`, `next.config.ts`, `vitest.config.ts` untouched

**Interfaces:** Produces `dbConnect(): Promise<boolean>` (false when no URI); save route persists when DB up else stub-ok

- [ ] **Step 1: lib/db.ts (cached connect, graceful)**

```ts
// lib/db.ts
import mongoose from "mongoose";
let done = false;
export async function dbConnect(): Promise<boolean> {
  const uri = process.env.MONGODB_URI; if (!uri || done) return !!uri && done;
  await mongoose.connect(uri); done = true; return true;
}
```

- [ ] **Step 2: Models (minimal PII, TTL)**

```ts
// models/SearchHistory.ts
import { Schema, models, model } from "mongoose";
const s = new Schema({ userId: { type: String, index: true }, query: { type: String, required: true, maxlength: 120 }, createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 3600 } });
export const SearchHistory = models.SearchHistory ?? model("SearchHistory", s);
```

```ts
// models/SavedTool.ts
import { Schema, models, model } from "mongoose";
const s = new Schema({ userId: { type: String, required: true, index: true }, repoFullName: { type: String, required: true }, createdAt: { type: Date, default: Date.now } });
s.index({ userId: 1, repoFullName: 1 }, { unique: true });
export const SavedTool = models.SavedTool ?? model("SavedTool", s);
```

- [ ] **Step 3: Wire save + search routes** — save: `dbConnect()` then `SavedTool.updateOne({userId:"anon",repoFullName},{...},{upsert:true})` in try/catch, always return `{ok:true}`; search: fire-and-forget `SearchHistory.create({query})` in try/catch (never log user identity; never block response)
- [ ] **Step 4: next.config.ts headers** — CSP `default-src 'self'`, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`
- [ ] **Step 5: /privacy page** — paper theme, what we store (github id/username, saved repos, 90-day queries), what we never store (passwords, keys, query attribution in logs), contact line
- [ ] **Step 6: Verify** — `pnpm build` PASS; `pnpm vitest run` PASS (no DB needed)
- [ ] **Step 7: Commit** — `feat: Mongo persist + privacy + security headers`

---

### Task C: Telegram Bot (text + voice)

**Files:** Create `lib/search-core.ts` (extract pipeline from route), `app/api/telegram/route.ts`, `scripts/set-telegram-webhook.mjs`; Modify `app/api/search/route.ts` to use core

**Interfaces:** Produces `runSearch(query): Promise<{repos}>` shared by web + bot

- [ ] **Step 1: Extract `runSearch(query)`** from `app/api/search/route.ts` into `lib/search-core.ts` (same logic: expand → github → dedupe → buildComparison → mock fallback); route becomes thin wrapper
- [ ] **Step 2: Telegram webhook (grammY, no framework magic)**

```ts
// app/api/telegram/route.ts
import { NextResponse } from "next/server";
import { runSearch } from "@/lib/search-core";
const API = "https://api.telegram.org";
async function send(token: string, chatId: number, text: string) {
  await fetch(`${API}/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }) });
}
async function transcribe(token: string, fileId: string): Promise<string> {
  const t = process.env.TELEGRAM_BOT_TOKEN!;
  const f = await (await fetch(`${API}/bot${t}/getFile?file_id=${fileId}`)).json();
  const buf = await (await fetch(`${API}/bot${t}/${f.result.file_path}`)).arrayBuffer();
  const fd = new FormData(); fd.append("file", new Blob([buf]), "voice.ogg"); fd.append("model", "nvidia/parakeet-ctc-1.1b-asr");
  const r = await (await fetch("https://integrate.api.nvidia.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` }, body: fd })).json();
  return r.text ?? "";
}
function card(r: { full_name: string; html_url: string; stargazers_count: number }): string { return `⭐ ${r.stargazers_count} — ${r.full_name}\n${r.html_url}`; }
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN; if (!token) return NextResponse.json({ ok: false });
  const u = await req.json().catch(() => ({}));
  const chatId = u.message?.chat?.id; if (!chatId) return NextResponse.json({ ok: true });
  try {
    let q: string = (u.message?.text ?? "").trim();
    if (!q && u.message?.voice && Number(u.message.voice.duration ?? 99) <= 60) q = (await transcribe(token, u.message.voice.file_id)).trim();
    if (!q) { await send(token, chatId, "Send a tool name or a voice note (under 1 min) — e.g. whatsapp api"); return NextResponse.json({ ok: true }); }
    const { repos } = await runSearch(q.slice(0, 120));
    await send(token, chatId, repos.slice(0, 3).map(card).join("\n\n") || "No good OSS match — try rephrasing.");
  } catch { await send(token, chatId, "Search hiccup — try again in a minute."); }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Webhook script** — `scripts/set-telegram-webhook.mjs` reads `TELEGRAM_BOT_TOKEN` + `PUBLIC_URL`, calls `setWebhook {url: PUBLIC_URL + "/api/telegram"}`; document in README
- [ ] **Step 4: Verify** — `pnpm build` PASS; POST fake update without token → `{ok:false}`; with dummy token + mocked fetch → top-3 text (unit-test the card fn inline via vitest? minimal: `tests/unit/telegram.test.ts` asserting `card` shape — extract `card` to `lib/telegram.ts` for testability)
- [ ] **Step 5: Commit** — `feat: Telegram bot text+voice via shared search core`

---

### Task D: PWA (installable + offline shell)

**Files:** Create `public/manifest.webmanifest`, `public/icons/icon-192.svg`, `public/icons/icon-512.svg`, `public/sw.js`; Modify `app/layout.tsx` (metadata: manifest, themeColor, apple touch)

- [ ] **Step 1: Manifest** — name OSSwap, short_name, display standalone, bg `#FAF6EF`, theme `#111111`, icons 192/512 (ink square + acid star, flat SVG — no gradients)
- [ ] **Step 2: Icons** — two flat SVGs matching palette
- [ ] **Step 3: sw.js** — cache-first for `/` shell + manifest; network-first for `/api/*`; versioned cache `osswap-v1`; register in layout via inline script (only in production, `process.env.NODE_ENV === "production"`)
- [ ] **Step 4: layout metadata** — `manifest: "/manifest.webmanifest"`, `themeColor: "#111111"`, `appleWebApp: { capable: true }`, apple-touch-icon link
- [ ] **Step 5: Verify** — `pnpm build` PASS; manifest served (curl dev server); no banned styles
- [ ] **Step 6: Commit** — `feat: PWA installable offline shell`

---

### Task E: Verify All + Docs + Merge + Push

- [ ] **Step 1: Full suite** — `pnpm vitest run` (all green), `pnpm build` green, E2E green, curl `/api/search` + `/api/telegram` (no-token → ok:false) + `/manifest.webmanifest` 200
- [ ] **Step 2: README** — append Phase 2 env table + Atlas steps + Upstash steps (cloud, no install) + BotFather + `set-telegram-webhook` + Vercel deploy + OAuth callback URL
- [ ] **Step 3: Commit + push** `feat: phase 2 ...` series already per-task; push `main`
- [ ] **Step 4: Report** — test matrix in final message

## Self-Review

1. Spec coverage: NVIDIA→A; Mongo/privacy/headers→B; Telegram→C; PWA→D; verify→E. Auth.js GitHub-only wiring is deploy-time config (env + Vercel), code already auth-ready via anon userId — documented in README.
2. Placeholders: none — every step has code.
3. Types: `runSearch` return `{repos}` shared; `Comparison` zod-validated; `card` extracted for tests.
