// app/page.tsx (replace)
"use client";
import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ResultsGrid } from "@/components/ResultsGrid";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Ticker } from "@/components/Ticker";
import { MOCK_REPOS } from "@/lib/mock-data";
import { stubComparison } from "@/lib/llm";
export default function Page() {
  const [data, setData] = useState({ repos: MOCK_REPOS.map(r => ({ ...r, comparison: { ...stubComparison(r.full_name), features: ["Self-hostable", "REST/webhooks", "Docker", "MIT/Apache", "Active"] } })) });
  return (<div className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight">STOP PAYING<br />FOR SOFTWARE.</h1>
    <p className="mt-3 max-w-xl text-lg">Type “whatsapp api” or “Twilio” — get maintained open-source GitHub alternatives.</p>
    <div className="mt-6"><SearchBar onResults={setData as never} /></div><Ticker />
    <ResultsGrid repos={data.repos as never} /><ComparisonTable repos={data.repos as never} /></div>);
}
