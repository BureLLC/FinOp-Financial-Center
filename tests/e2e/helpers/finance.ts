export function parseCurrency(text: string): number {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  const value = Number(cleaned || 0);
  if (!Number.isFinite(value)) throw new Error(`Unable to parse currency value from ${text}`);
  return value;
}

export async function currencyValue(page: any, testId: string): Promise<number> {
  const text = await page.getByTestId(`${testId}-value`).innerText();
  return parseCurrency(text);
}

export async function expectNoInvalidFinancialValues(page: any) {
  const bodyText = await page.locator("body").innerText();
  if (/NaN|undefined/i.test(bodyText)) {
    throw new Error(`Page contains invalid financial text: ${bodyText}`);
  }
}

export async function resetE2EDatabase(page: any) {
  await page.addInitScript(() => {
    window.localStorage.removeItem("finops:e2e:db");
  });
}
