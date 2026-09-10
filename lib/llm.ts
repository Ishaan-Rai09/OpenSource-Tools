import { expandFallback } from "./github";
export async function expandQueries(q: string): Promise<string[]> {
  if (!process.env.LLM_API_KEY) return expandFallback(q);
  return expandFallback(q); // v1: deterministic expansion; LLM upgrade behind same signature
}
export function stubComparison(fullName: string) {
  return { features: ["Self-hostable", "REST/webhooks", "Docker support", "MIT/Apache license", "Active commits"], selfHost: "Medium" as const, docker: true, replaces: "Twilio / paid WhatsApp API", pros: `${fullName} is free and hackable`, cons: "You operate it yourself" };
}
