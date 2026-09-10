// components/SaveButton.tsx
"use client";
export function SaveButton({ repo }: { repo: string }) {
  async function save() { const k = "oss-saved"; const cur: string[] = JSON.parse(localStorage.getItem(k) ?? "[]"); localStorage.setItem(k, JSON.stringify([...new Set([...cur, repo])])); await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repoFullName: repo }) }); alert(`saved ${repo}`); }
  return <button onClick={save} className="border border-[#111111] bg-white px-2 py-1 text-xs font-bold">+ Save</button>;
}
