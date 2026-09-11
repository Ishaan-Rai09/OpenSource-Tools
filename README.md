# OSSwap

Env: GITHUB_TOKEN=ghp_xxx UPSTASH_REDIS_REST_URL=xxx UPSTASH_REDIS_REST_TOKEN=xxx
Run: pnpm install; pnpm dev. Deploy: vercel --prod.

## Phase 2 — production backends (all optional locally, app runs on mocks without them)

Copy `.env.example` to `.env.local` and fill only what you have. Every backend degrades gracefully when its key is absent.

| Var | Where to get it | Notes |
|-----|-----------------|-------|
| `NVIDIA_API_KEY` | build.nvidia.com → API keys (free tier) | LLM compare/expand via `meta/llama-3.1-70b-instruct` (override with `NVIDIA_MODEL`) |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → **Fine-grained PAT, public read-only** | Higher rate limits; never needs write scopes |
| `MONGODB_URI` | MongoDB Atlas → free M0 cluster → Database Access user (least privilege) + Network Access allow `0.0.0.0/0` (needed for Vercel) → Connect → connection string | History auto-deletes after 90 days (TTL) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash → free Redis → REST tab | **Cloud over HTTPS — nothing to install on your PC**; local dev simply skips cache |
| `TELEGRAM_BOT_TOKEN` | Telegram → chat with `@BotFather` → `/newbot` → paste token | Then point Telegram at prod: `TELEGRAM_BOT_TOKEN=test PUBLIC_URL=https://example.com node scripts/set-telegram-webhook.mjs` |
| `TELEGRAM_WEBHOOK_SECRET` | Run `openssl rand -hex 32` (any random string) | Sent as `secret_token` when registering the webhook; the `/api/telegram` route rejects requests whose `x-telegram-bot-api-secret-token` header does not match (checked only when the env var is set, so local dev without it still works) |

## Deploy (Vercel)

1. Push `main` (already on GitHub). Vercel → Add New → Project → Import `OpenSource-Tools`.
2. Environment Variables: paste the rows above (all server-only; nothing prefixed `NEXT_PUBLIC_`).
3. Deploy. Then set the Telegram webhook (command above) and verify `https://<your-app>.vercel.app/manifest.webmanifest` for the PWA.
