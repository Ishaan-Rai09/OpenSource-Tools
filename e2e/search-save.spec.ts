import { test, expect } from "@playwright/test";
test("search whatsapp shows alternatives", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /STOP PAYING/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "EvolutionAPI/evolution-api" })).toBeVisible();
});
