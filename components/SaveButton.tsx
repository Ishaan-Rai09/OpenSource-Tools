// components/SaveButton.tsx
"use client";
import { useState } from "react";

export function SaveButton({ repo }: { repo: string }) {
  const [saved, setSaved] = useState(false);
  function save() {
    try {
      const k = "oss-saved";
      const cur: string[] = JSON.parse(localStorage.getItem(k) ?? "[]");
      localStorage.setItem(k, JSON.stringify([...new Set([...cur, repo])]));
    } catch {
      /* localStorage unavailable — still show feedback */
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }
  return (
    <button
      onClick={save}
      className="border border-[#111111] bg-white px-2 py-1 text-xs font-bold"
    >
      {saved ? "Saved ✓" : "+ Save"}
    </button>
  );
}
