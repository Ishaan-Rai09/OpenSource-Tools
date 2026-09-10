# Open-Source Alternative Finder — Design Spec
Date: 2026-09-10
Status: Approved + UI amendment 2026-09-10 (GenZ editorial-brutalist, no AI gradients, no glass)

## 1. Idea Summary
SaaS tool where user enters a query like "I want a WhatsApp API thing" or "Twilio alternative" and gets ranked open-source GitHub alternatives (e.g. open-wa, Evolution API, Baileys) with full comparison. Solves discovery pain: efficient OSS tools exist but are hard to find on GitHub.

User decisions:
- Input: Both (paid tool name + natural use-case description, auto-detect)
- Data source: Live GitHub search (Approach A)
- Result richness: Full comparison
- Stack: Next.js (Recommended)
- MVP: Search + save (auth, bookmarks, history, no payments yet)

## 2. Approach Chosen: A — Live + AI (Recommended)
- LLM query expansion -> live GitHub Search API -> LLM rerank + comparison, cached 24h.
- Rejected B (Hybrid curated): higher quality for top queries but requires manual curation, slower to launch.
- Rejected C (AI recall + verify): best for vague queries but hallucination risk; merged its strength into A via expansion step.

Why A: Always fresh, zero curation to launch, handles both "Notion" and "whatsapp api thing" via expansion, fits user's live-search requirement.

## 3. Architecture
- Frontend + API: Next.js 15 App Router (React 19, TypeScript 5.6+) on Vercel, Tailwind CSS v4 + shadcn/ui (new-york style) + Framer Motion + lucide-react
- Fonts: Space Grotesk (display, 700) + Inter (body) + JetBrains Mono (code/stats) via next/font, fluid clamp() scale 48-96px hero
- DB: Postgres (Neon/Supabase) via Prisma ORM
- Auth: Auth.js v5 (Google + GitHub OAuth)
- Cache/Queue: Upstash Redis (24h result cache, rate-limit bucket)
- External: GitHub REST Search API (`/search/repositories`), Contents/README API; LLM provider (OpenAI GPT-4o-mini or Anthropic Haiku for cost) for expansion + comparison JSON
- Hosting: Vercel, env: `GITHUB_TOKEN`, `LLM_API_KEY`, `DATABASE_URL`, `REDIS_URL`

## 3a. UI Design Direction (GenZ, researched Sep 2026)
Research: 2026 SaaS splits into techno-futurist (dark+neon+bento) vs editorial (cream+serif+whitespace). AI-generic = purple/blue gradients + glassmorphism — explicitly banned per user. Pick: Editorial-brutalist light theme, human-made, confident.
- Palette (flat, no gradients): Paper #FAF6EF bg, Ink #111111 text, Accent acid-lime #D9FF3D for CTAs/highlights + International Orange #FF4D00 sparingly for badges/stickers. Borders 1.5px solid ink. Hard shadow 4px 4px 0 ink. No `backdrop-blur`, no `bg-white/10`, no gradient utilities.
- Typography: oversized hero "STOP PAYING FOR SOFTWARE." with kinetic weight on scroll, marquee ticker of paid->OSS pairs (Notion->AppFlowy, Twilio->Evolution API), mono labels uppercase tracking-widest for stars/license.
- Layout: bento results grid (featured card 2x + compact cards), sticker badges (rotated -3deg, border-ink), command-K style search hero with big input + mode badge, comparison table as striped rows not glass cards.
- Motion with purpose only: card lift hover:-translate-y-1, scroll reveal, ticker marquee. No floating orbs.
- References: Linear issue-list density for dashboard, Attio monochrome discipline, retro-brutalist field guide (raw borders, pixel details) + 2026 clarity-led minimalism.

## 4. Components
1. `SearchBar` — input + mode badge (paid-name vs use-case), recent searches
2. `Search API Route (/api/search)` — expand, GitHub parallel search, dedupe, enrich, LLM compare, cache
3. `ResultsGrid` — cards: name, description, stars, forks, license, language, last push, topics, deploy signal (Dockerfile/docker-compose detect)
4. `ComparisonTable` — columns: features, self-host difficulty (Easy/Medium/Hard), Docker support, replaces-what paid tool, pros/cons
5. `DetailDrawer` — README excerpt, install commands, links (repo, demo, docs), save button
6. `Filters` — language, license (MIT/Apache-2.0/GPL), min stars, updated-within
7. `Dashboard (/saved)` — saved tools + search history, notes, delete
8. Data model:
   - User(id, email, image)
   - SearchHistory(id, userId?, query, expandedQueries, createdAt)
   - CachedResult(queryHash, payloadJson, createdAt)
   - SavedTool(id, userId, repoFullName, repoId, notes, createdAt)

## 5. Data Flow
1. User submits query -> POST /api/search {query, filters}
2. Check Redis `search:{hash}` -> hit? return + log history
3. LLM expansion -> 3-4 GitHub queries e.g. `whatsapp api in:name,description stars:>50`, `whatsapp-web evolution baileys`
4. Parallel GitHub search (auth token, 30 req/min), filter archived/forks/disabled, dedupe by `id`, take top 20 by stars + updated
5. Enrich top 10: license, language, pushed_at, topics, Dockerfile presence via contents check (cached)
6. LLM rerank -> strict JSON: {replaces, features[5], selfHost, docker, pros, cons, verdict} per repo
7. Combine + cache 24h in Redis + Postgres, return to UI
8. Save action requires login -> SavedTool row

## 6. Error Handling / Edge Cases
- GitHub 403 rate-limit: serve stale cache + banner "Live data limited, showing cached", exponential backoff, per-IP bucket
- LLM timeout/fail: fallback to raw GitHub sorted list with notice
- Hallucination guard: UI only renders repos with verified GitHub `id`; LLM output validated with zod, unknown IDs dropped
- Empty/noisy results: broaden expansion, suggest reformulation, show "no good OSS match" state
- Vague query example: "whatsapp api thing" expands correctly; test case included
- License unknown: show "NOASSERTION", allow license filter to exclude

## 7. Testing
- Unit: query-hash, dedupe, zod validators, ranking sort
- Integration (mocked): GitHub API mock + LLM mock -> verify pipeline + fallback paths
- E2E (Playwright): search "whatsapp api" -> sees Evolution API/Baileys cards -> login -> save -> appears in /saved
- Manual check: rate-limit simulation, LLM-off mode

## 8. Out of Scope (v1)
Payments/Pro tier, one-click deploy, API access, alerts, browser extension, curated editorial content. YAGNI ruthlessly.

## 9. Success Criteria
- Query "whatsapp api" returns >=3 relevant maintained repos in <8s (cached <1s)
- Comparison table understandable without opening GitHub
- User can sign in, save, revisit history

---
Self-review: No TBDs. Architecture matches flow. Single-plan scope. No ambiguous requirements. Verified IDs prevent hallucination.

---
## Phase 2 Amendment (2026-09-10, user-approved)
- **LLM:** NVIDIA API (`https://integrate.api.nvidia.com/v1`, OpenAI-compatible), primary `meta/llama-3.1-70b-instruct`, env `NVIDIA_API_KEY` + `NVIDIA_MODEL`. Deterministic fallback kept when key absent.
- **Hosting:** Vercel. OAuth callback `https://<project>.vercel.app/api/auth/callback/github`.
- **Auth:** GitHub-only (Auth.js v5, JWT sessions — no session tokens stored).
- **DB:** MongoDB Atlas M0 (Mongoose). TLS in transit, Atlas encryption at rest, least-privilege DB user, 90-day TTL on SearchHistory, minimal PII (github id + username only), no query content in logs + `/privacy` page.
- **Redis:** Upstash cloud REST (nothing to install; local dev gracefully no-ops).
- **Telegram:** grammY webhook `POST /api/telegram`; text → search pipeline; voice (<1min) → NVIDIA ASR → pipeline; reply top-3 repo cards with links. Needs `TELEGRAM_BOT_TOKEN` + webhook set to prod URL.
- **PWA:** `manifest.webmanifest` + SVG icons + minimal service worker (offline shell), installable, themeColor ink on paper.
