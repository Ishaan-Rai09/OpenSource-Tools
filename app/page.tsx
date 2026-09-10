// app/page.tsx (replace)
"use client";
import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ResultsGrid } from "@/components/ResultsGrid";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Ticker } from "@/components/Ticker";
export default function Page() {
  const [data, setData] = useState<{ repos: unknown[]; error?: string; searched?: boolean }>({ repos: [] });
  function handle(j: unknown) {
    const d = j as { repos?: unknown[]; error?: string };
    setData({ repos: d.repos ?? [], error: d.error, searched: true });
  }
  const showResults = !!data.searched && !data.error && data.repos.length > 0;
  const showEmpty = !!data.searched && !data.error && data.repos.length === 0;
  return (<div className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight">STOP PAYING<br />FOR SOFTWARE.</h1>
    <p className="mt-3 max-w-xl text-lg">Type “whatsapp api” or “Twilio” — get maintained open-source GitHub alternatives.</p>
    <div className="mt-6"><SearchBar onResults={handle as never} /></div><Ticker />
    {data.error ? <div role="alert" className="mt-6 border-[1.5px] border-[#111111] bg-white px-4 py-3"><span className="mr-2 inline-block bg-[#FF4D00] px-2 py-0.5 font-mono text-xs font-bold uppercase text-white">Live search failed</span>{data.error}</div> : null}
    {!data.searched && !data.error ? <div className="mt-6 border-[1.5px] border-[#111111] bg-[#D9FF3D] px-4 py-3 font-bold">Type a tool above and hit Enter — results come straight from live GitHub, nothing canned.</div> : null}
    {showEmpty ? <div className="mt-6 border-[1.5px] border-[#111111] bg-white px-4 py-3 font-bold">No live GitHub matches — try different words.</div> : null}
    {showResults ? <><ResultsGrid repos={data.repos as never} /><ComparisonTable repos={data.repos as never} /></> : null}</div>);
}
