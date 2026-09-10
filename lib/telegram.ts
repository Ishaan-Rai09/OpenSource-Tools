export type CardRepo = {
  full_name: string;
  html_url: string;
  stargazers_count: number;
};

export function card(r: CardRepo): string {
  return `\u2B50 ${r.stargazers_count} \u2014 ${r.full_name}\n${r.html_url}`;
}
