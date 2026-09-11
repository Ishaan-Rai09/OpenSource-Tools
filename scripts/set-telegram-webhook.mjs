// Registers the Telegram webhook: PUBLIC_URL + "/api/telegram".
// Usage: TELEGRAM_BOT_TOKEN=test PUBLIC_URL=https://example.com node scripts/set-telegram-webhook.mjs
// Optional: TELEGRAM_WEBHOOK_SECRET=test-secret (sent as secret_token so Telegram signs callbacks).
// Never commit real tokens — pass them via environment only.
const token = process.env.TELEGRAM_BOT_TOKEN;
const base = process.env.PUBLIC_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !base) {
  console.error("Missing TELEGRAM_BOT_TOKEN or PUBLIC_URL env vars.");
  process.exit(1);
}

const url = `${base.replace(/\/$/, "")}/api/telegram`;
const body = secret ? { url, secret_token: secret } : { url };
const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json();
console.log(JSON.stringify(json));
if (!json.ok) process.exit(1);
