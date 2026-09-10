import { test, expect } from "@playwright/test";
test("live search returns results or honest error", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /STOP PAYING/ })).toBeVisible();
  await expect(page.getByText("nothing canned")).toBeVisible();
  await page.getByPlaceholder("try: whatsapp api thing…").fill("whatsapp api");
  await page.getByRole("button", { name: "Find OSS" }).click();
  // Live-only: either real repo cards or the rate-limit/error alert (no mocks either way).
  await expect(
    page.getByRole("heading", { name: "EvolutionAPI/evolution-api" }).or(page.getByRole("alert"))
  ).toBeVisible({ timeout: 30000 });
});
