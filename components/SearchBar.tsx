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
