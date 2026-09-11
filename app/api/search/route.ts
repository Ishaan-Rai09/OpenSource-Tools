import { NextResponse } from "next/server";
import { SearchRequest } from "@/lib/validators";
import { runSearch } from "@/lib/search-core";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = SearchRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "query min 2 chars" }, { status: 400 });
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const { allowed } = await checkRateLimit(`search:${ip}`, 20, 60);
  if (!allowed) return NextResponse.json({ error: "rate limited, try again soon" }, { status: 429 });
  return NextResponse.json(await runSearch(parsed.data.query));
}
