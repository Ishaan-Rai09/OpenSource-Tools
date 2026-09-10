import { describe, expect, it } from "vitest";
import { card } from "@/lib/telegram";

describe("card", () => {
  it("formats star count, full name and url", () => {
    const out = card({
      full_name: "WhiskeySockets/Baileys",
      html_url: "https://github.com/WhiskeySockets/Baileys",
      stargazers_count: 8900,
    });
    expect(out).toContain("8900");
    expect(out).toContain("WhiskeySockets/Baileys");
    expect(out).toContain("https://github.com/WhiskeySockets/Baileys");
  });

  it("keeps a stable two-line shape", () => {
    const out = card({ full_name: "a/b", html_url: "https://github.com/a/b", stargazers_count: 1 });
    const [first, second] = out.split("\n");
    expect(first).toContain("a/b");
    expect(second).toBe("https://github.com/a/b");
  });
});
