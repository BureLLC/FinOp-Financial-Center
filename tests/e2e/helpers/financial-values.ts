import { expect, type Page } from "@playwright/test";

export function parseCurrency(value: string): number {
  const normalized = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Could not parse currency from: ${value}`);
  }
  return parsed;
}

export async function readCurrency(page: Page, testId: string): Promise<number> {
  const locator = page.getByTestId(`${testId}-value`).first();
  await expect(locator).toBeVisible({ timeout: 15_000 });
  return parseCurrency(await locator.innerText());
}

export async function expectNoInvalidFinancialText(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/NaN|undefined/i);
}

export async function expectCurrencyNear(actual: number, expected: number, delta = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(delta);
}
