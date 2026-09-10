export type Repo = { id: number; full_name: string; description: string; stargazers_count: number; language: string; license: string; pushed_at: string; html_url: string };
export const MOCK_REPOS: Repo[] = [
  { id: 1, full_name: "EvolutionAPI/evolution-api", description: "WhatsApp API with Docker, webhooks", stargazers_count: 4200, language: "TypeScript", license: "Apache-2.0", pushed_at: "2026-08-01", html_url: "https://github.com/EvolutionAPI/evolution-api" },
  { id: 2, full_name: "WhiskeySockets/Baileys", description: "Lightweight WhatsApp Web API", stargazers_count: 8900, language: "TypeScript", license: "MIT", pushed_at: "2026-08-20", html_url: "https://github.com/WhiskeySockets/Baileys" },
  { id: 3, full_name: "open-wa/wa-automate-nodejs", description: "Node.js WhatsApp automation", stargazers_count: 5100, language: "JavaScript", license: "MIT", pushed_at: "2026-05-11", html_url: "https://github.com/open-wa/wa-automate-nodejs" },
  { id: 4, full_name: "wppconnect-team/wppconnect", description: "WhatsApp API + headless browser", stargazers_count: 3300, language: "TypeScript", license: "Apache-2.0", pushed_at: "2026-07-02", html_url: "https://github.com/wppconnect-team/wppconnect" },
];
