import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runSearch } from "@/lib/search-core";
import { checkRateLimit } from "@/lib/rate-limit";
import { card } from "@/lib/telegram";

const API = "https://api.telegram.org";

async function send(token: string, chatId: number, text: string) {
  await fetch(`${API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
  });
}

async function transcribe(token: string, fileId: string): Promise<string> {
  const f = await (await fetch(`${API}/bot${token}/getFile?file_id=${fileId}`)).json();
  const buf = await (await fetch(`${API}/bot${token}/${f.result.file_path}`)).arrayBuffer();
  const fd = new FormData();
  fd.append("file", new Blob([buf]), "voice.ogg");
  fd.append("model", "nvidia/parakeet-ctc-1.1b-asr");
  const r = await (
    await fetch("https://integrate.api.nvidia.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
      body: fd,
    })
  ).json();
  return r.text ?? "";
}

function secretMismatch(req: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;
  const got = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return true;
  return !timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (secretMismatch(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false });
  const u = await req.json().catch(() => ({}));
  const chatId = u.message?.chat?.id;
  if (!chatId) return NextResponse.json({ ok: true });
  const { allowed } = await checkRateLimit(`telegram:${chatId}`, 30, 60);
  if (!allowed) {
    await send(token, chatId, "Slow down… try again in a minute.");
    return NextResponse.json({ ok: true });
  }
  try {
    let q: string = (u.message?.text ?? "").trim();
    if (!q && u.message?.voice && Number(u.message.voice.duration ?? 99) <= 60)
      q = (await transcribe(token, u.message.voice.file_id)).trim();
    if (!q) {
      await send(token, chatId, "Send a tool name or a voice note (under 1 min) \u2014 e.g. whatsapp api");
      return NextResponse.json({ ok: true });
    }
    const { repos } = await runSearch(q.slice(0, 120));
    await send(token, chatId, repos.slice(0, 3).map(card).join("\n\n") || "No good OSS match \u2014 try rephrasing.");
  } catch {
    await send(token, chatId, "Search hiccup \u2014 try again in a minute.");
  }
  return NextResponse.json({ ok: true });
}
