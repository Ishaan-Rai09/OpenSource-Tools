// app/api/save/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
const Body = z.object({ repoFullName: z.string().min(3) });
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  return NextResponse.json({ ok: true, saved: p.data.repoFullName }); // Prisma create in next iteration when DATABASE_URL set
}
