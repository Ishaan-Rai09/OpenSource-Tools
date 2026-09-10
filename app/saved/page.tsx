"use client";
import { useEffect, useState } from "react";

export default function SavedPage() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("oss-saved") ?? "[]"));
    } catch {
      setSaved([]);
    }
  }, []);
  return (
    <main className="min-h-screen bg-[#f5f1e8] p-6 text-[#111111]">
      <h1 className="border border-[#111111] bg-white px-4 py-3 text-2xl font-black">
        SAVED TOOLS
      </h1>
      {saved.length === 0 ? (
        <p className="mt-6 border border-[#111111] bg-white p-4 text-sm font-bold">
          Nothing saved yet. Hit + Save on any result.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {saved.map((repo) => (
            <li key={repo} className="border border-[#111111] bg-white px-4 py-2 text-sm font-bold">
              {repo}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
