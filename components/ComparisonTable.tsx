// components/ComparisonTable.tsx
export function ComparisonTable({ repos }: { repos: { full_name: string; comparison: { features: string[]; selfHost: string; docker: boolean; pros: string; cons: string } }[] }) {
  return <div className="mt-6 overflow-x-auto border-[1.5px] border-[#111111] bg-white"><table className="w-full text-sm">
    <thead><tr className="border-b-[1.5px] border-[#111111] bg-[#111111] text-left text-white"><th className="p-3">Tool</th><th className="p-3">Features</th><th className="p-3">Self-host</th><th className="p-3">Docker</th><th className="p-3">Trade-off</th></tr></thead>
    <tbody>{repos.map((r, i) => <tr key={r.full_name} className={i % 2 ? "bg-[#FAF6EF]" : "bg-white"}><td className="p-3 font-bold">{r.full_name}</td><td className="p-3">{r.comparison.features.join(" · ")}</td><td className="p-3">{r.comparison.selfHost}</td><td className="p-3">{r.comparison.docker ? "yes" : "no"}</td><td className="p-3">+{r.comparison.pros} / −{r.comparison.cons}</td></tr>)}</tbody></table></div>;
}
