// app/api/save/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { SavedTool } from "@/models/SavedTool";
const Body = z.object({ repoFullName: z.string().min(3) });
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    if (await dbConnect()) {
      await SavedTool.updateOne(
        { userId: "anon", repoFullName: p.data.repoFullName },
        { $setOnInsert: { userId: "anon", repoFullName: p.data.repoFullName } },
        { upsert: true }
      );
    }
  } catch { /* persist best-effort; still ok */ }
  return NextResponse.json({ ok: true, saved: p.data.repoFullName });
}
