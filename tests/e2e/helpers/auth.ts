import { expect, type Page } from "@playwright/test";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required E2E environment variable: ${name}`);
  return value;
}

export async function loginAsE2EUser(page: Page) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });

  await page.locator('input[type="email"]').fill(requiredEnv("E2E_TEST_EMAIL"));
  await page.locator('input[type="password"]').fill(requiredEnv("E2E_TEST_PASSWORD"));
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

export async function ensureDashboardReady(page: Page) {
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error|TypeError|ReferenceError/i);
}
