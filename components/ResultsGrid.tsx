// components/ResultsGrid.tsx
export type CardRepo = { id: number; full_name: string; description: string | null; stargazers_count: number; language: string | null; license: string; html_url: string; comparison?: { replaces: string } };
export function ResultsGrid({ repos }: { repos: CardRepo[] }) {
  return <div className="mt-6 grid gap-4 md:grid-cols-3">{repos.map((r, i) => (
    <article key={r.id} className={`hard border-[1.5px] border-[#111111] bg-white p-4 ${i === 0 ? "md:col-span-2 bg-[#D9FF3D]" : ""}`}>
      <div className="font-mono text-[11px] uppercase tracking-widest">★ {r.stargazers_count.toLocaleString()} · {r.language} · {r.license}</div>
      <h3 className="mt-1 font-bold">{r.full_name}</h3><p className="text-sm">{r.description}</p>
      <div className="mt-2 flex gap-2"><a href={r.html_url} className="border border-[#111111] px-2 py-1 text-xs font-bold">GitHub ↗</a><span className="-rotate-3 border border-[#111111] bg-[#FF4D00] px-2 py-1 text-xs font-bold text-white">replaces {r.comparison?.replaces ?? "paid tool"}</span></div>
    </article>))}</div>;
}
