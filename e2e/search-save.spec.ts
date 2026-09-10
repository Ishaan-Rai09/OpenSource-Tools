import { test, expect } from "@playwright/test";
test("search whatsapp shows alternatives", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("STOP PAYING")).toBeVisible();
  await expect(page.getByText("EvolutionAPI/evolution-api")).toBeVisible();
});
