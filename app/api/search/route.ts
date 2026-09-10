import { NextResponse } from "next/server";
import { SearchRequest } from "@/lib/validators";
import { runSearch } from "@/lib/search-core";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = SearchRequest.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "query min 2 chars" }, { status: 400 });
  return NextResponse.json(await runSearch(parsed.data.query));
}
