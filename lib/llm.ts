import { expandFallback } from "./github";
import { ComparisonSchema } from "./validators";
const BASE = "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-70b-instruct";
async function chat(system: string, user: string): Promise<string> {
  const key = process.env.NVIDIA_API_KEY; if (!key) throw new Error("no key");
  const r = await fetch(`${BASE}/chat/completions`, { method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 600,
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
  if (!r.ok) throw new Error(`nvidia ${r.status}`);
  const j = await r.json(); return j.choices?.[0]?.message?.content ?? "";
}
export async function expandQueries(q: string): Promise<string[]> {
  try {
    const raw = await chat("Return ONLY a JSON array of 3 GitHub search queries.", q);
    const arr = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] ?? "[]");
    if (Array.isArray(arr) && arr.length === 3 && arr.every((s) => typeof s === "string")) return arr;
  } catch { /* fall through */ }
  return expandFallback(q);
}
export async function buildComparison(fullName: string, description: string | null) {
  try {
    const raw = await chat("Return ONLY valid JSON.", `repo ${fullName}: ${description ?? ""}. JSON: {"features":[5 strings],"selfHost":"Easy|Medium|Hard","docker":bool,"replaces":string,"pros":string,"cons":string}`);
    const parsed = ComparisonSchema.omit({ ai: true }).safeParse(JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}"));
    if (parsed.success) return { ...parsed.data, ai: true as const };
  } catch { /* fall through */ }
  return stubComparison(fullName);
}
export function stubComparison(fullName: string) {
  return {
    features: [
      "Live details unavailable (AI offline)",
      "Check the repo README for the feature list",
      "Verify the license on GitHub",
      "Check recent commits for activity",
      "Confirm Docker support in the repo",
    ],
    selfHost: "Unknown" as const,
    docker: false as const,
    replaces: "Unspecified (AI unavailable)",
    pros: `${fullName} is open source — check its README for strengths`,
    cons: "AI comparison unavailable — review the repo manually",
    ai: false as const,
  };
}
