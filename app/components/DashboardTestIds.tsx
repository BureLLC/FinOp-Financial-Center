"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type SelectorRule = {
  label: RegExp;
  testId: string;
};

const CARD_RULES: SelectorRule[] = [
  { label: /^NET WORTH$|^Net Worth$/i, testId: "summary-net-worth" },
  { label: /^TOTAL INCOME$|^Total Income$/i, testId: "summary-total-income" },
  { label: /^TOTAL EXPENSES$|^Total Expenses$/i, testId: "summary-total-expenses" },
  { label: /^NET CASH FLOW$|^Net Cash Flow$/i, testId: "summary-net-cash-flow" },
  { label: /^INVESTMENTS$|^Investments$/i, testId: "summary-investments" },
  { label: /^EST\. TAX$|^Est\. Tax$|^ESTIMATED TAX$|^Estimated Tax$/i, testId: "summary-estimated-tax" },

  { label: /^Tagged Income$/i, testId: "income-tagged" },
  { label: /^Untagged$|^Untagged Income$/i, testId: "income-untagged" },
  { label: /^Income Sources$/i, testId: "income-sources" },

  { label: /^Total In$/i, testId: "transactions-total-in" },
  { label: /^Total Out$/i, testId: "transactions-total-out" },
  { label: /^Net$/i, testId: "transactions-net" },

  { label: /^Monthly Budget$|^Budget$/i, testId: "budget-monthly" },
  { label: /^Total Spent$|^Spent$/i, testId: "budget-spent" },
  { label: /^Total Remaining$|^Remaining$/i, testId: "budget-remaining" },
  { label: /^Envelope Allocated$/i, testId: "budget-envelope-allocated" },
  { label: /^Envelope Spent$/i, testId: "budget-envelope-spent" },
  { label: /^Envelope Remaining$/i, testId: "budget-envelope-remaining" },

  { label: /^Total Saved$/i, testId: "savings-total-saved" },
  { label: /^Total Target$/i, testId: "savings-total-target" },
  { label: /^Active Goals$/i, testId: "savings-active-goals" },

  { label: /^Total Deductible$/i, testId: "writeoffs-total-deductible" },
  { label: /^Tax Savings$|^Estimated Tax Savings$/i, testId: "writeoffs-tax-savings" },
  { label: /^Verified$|^Verified Deductions$/i, testId: "writeoffs-verified" },

  { label: /^Portfolio Total$|^Total Portfolio$|^Portfolio Value$/i, testId: "investments-portfolio-total" },

  { label: /^Estimated Tax Due$|^Estimated Tax$|^Tax Due$/i, testId: "tax-estimated-due" },
  { label: /^W2 Income$|^W2\/Salary$|^Salary \/ W2$/i, testId: "tax-w2-income" },
  { label: /^Self-Employed Income$|^Self Employment$/i, testId: "tax-self-employed-income" },
  { label: /^Business Income$/i, testId: "tax-business-income" },
  { label: /^Untagged Income$/i, testId: "tax-untagged-income" },
];

const BUTTON_RULES: SelectorRule[] = [
  { label: /save.*income.*tag|save.*tag/i, testId: "income-save-button" },
  { label: /save.*changes|save/i, testId: "transaction-save-button" },
  { label: /delete.*transaction|delete/i, testId: "transaction-delete-button" },
  { label: /create.*budget|add.*budget|new.*budget/i, testId: "budget-category-create-button" },
  { label: /save.*budget|save.*category/i, testId: "budget-category-save-button" },
  { label: /delete.*budget|delete.*category/i, testId: "budget-category-delete-button" },
  { label: /create.*goal|add.*goal|new.*goal/i, testId: "savings-goal-create-button" },
  { label: /save.*goal/i, testId: "savings-goal-save-button" },
  { label: /complete.*goal|mark.*complete/i, testId: "savings-goal-complete-button" },
  { label: /archive.*goal/i, testId: "savings-goal-archive-button" },
  { label: /delete.*goal/i, testId: "savings-goal-delete-button" },
  { label: /create.*write|add.*write|new.*write|add.*deduction/i, testId: "writeoff-create-button" },
  { label: /save.*write|save.*deduction/i, testId: "writeoff-save-button" },
  { label: /delete.*write|delete.*deduction/i, testId: "writeoff-delete-button" },
  { label: /add.*position|new.*position/i, testId: "investment-add-position-button" },
  { label: /save.*position/i, testId: "investment-position-save-button" },
  { label: /delete.*position|close.*position/i, testId: "investment-position-delete-button" },
  { label: /sync|refresh/i, testId: "connection-sync-button" },
  { label: /disconnect/i, testId: "connection-disconnect-button" },
  { label: /delete.*connection|remove.*connection/i, testId: "connection-delete-button" },
];

const PAGE_ROOT_IDS: Record<string, string> = {
  "/dashboard/income": "income-page",
  "/dashboard/transactions": "transactions-page",
  "/dashboard/budget": "budget-page",
  "/dashboard/savings": "savings-page",
  "/dashboard/write-offs": "writeoffs-page",
  "/dashboard/investments": "investments-page",
  "/dashboard/tax": "tax-page",
  "/dashboard/connections": "connections-page",
  "/dashboard/summary": "summary-page",
};

function ownText(el: Element): string {
  return Array.from(el.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function allElements(): Element[] {
  return Array.from(document.querySelectorAll("main *"));
}

function isValueText(text: string): boolean {
  const trimmed = text.trim();
  return /[$€£]|^[-+]?\d+(\.\d+)?%?$|transactions?$|types?$|goals?$|—/.test(trimmed);
}

function findCard(labelEl: Element): HTMLElement | null {
  let current = labelEl.parentElement;
  for (let depth = 0; current && depth < 4; depth += 1) {
    const text = current.textContent ?? "";
    if (isValueText(text) && current.querySelectorAll("div,span,p").length >= 2) {
      return current;
    }
    current = current.parentElement;
  }
  return labelEl.parentElement;
}

function tagCards() {
  const elements = allElements();
  for (const rule of CARD_RULES) {
    const labelEl = elements.find((el) => rule.label.test(ownText(el)));
    if (!labelEl) continue;

    const card = findCard(labelEl);
    if (!card) continue;

    card.dataset.testid ||= rule.testId;

    const descendants = Array.from(card.querySelectorAll("div,span,p"));
    const valueEl = descendants.find((el) => {
      if (el === labelEl) return false;
      const text = ownText(el) || el.textContent?.trim() || "";
      return isValueText(text) && !rule.label.test(text);
    }) as HTMLElement | undefined;

    if (valueEl) valueEl.dataset.testid ||= `${rule.testId}-value`;
  }
}

function tagRows(pathname: string) {
  const rowRules: Array<{ path: string; testId: string; match: RegExp }> = [
    { path: "/dashboard/income", testId: "income-source-row", match: /Money In|Salary|Business|Untagged|Income/i },
    { path: "/dashboard/transactions", testId: "transaction-row", match: /Money In|Money Out|pending|credit|debit/i },
    { path: "/dashboard/savings", testId: "savings-goal-row", match: /goal|saved|target/i },
    { path: "/dashboard/write-offs", testId: "writeoff-row", match: /deduct|write|verified|tax/i },
    { path: "/dashboard/investments", testId: "investment-position-row", match: /position|shares|portfolio|market value/i },
    { path: "/dashboard/connections", testId: "connection-row", match: /connected|sync|bank|brokerage|plaid|snaptrade/i },
  ];

  for (const rule of rowRules) {
    if (!pathname.startsWith(rule.path)) continue;
    document.querySelectorAll("main div").forEach((el) => {
      const text = el.textContent ?? "";
      if (rule.match.test(text) && el.querySelectorAll("div,span,button").length >= 2) {
        (el as HTMLElement).dataset.testid ||= rule.testId;
      }
    });
  }
}

function tagControls(pathname: string) {
  document.querySelectorAll("button").forEach((button) => {
    const text = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const rule = BUTTON_RULES.find((candidate) => candidate.label.test(text));
    if (rule) button.dataset.testid ||= rule.testId;
  });

  document.querySelectorAll("input").forEach((input) => {
    const placeholder = input.getAttribute("placeholder") ?? "";
    if (/category/i.test(placeholder)) input.dataset.testid ||= "transaction-category-input";
  });

  document.querySelectorAll("select").forEach((select) => {
    const options = Array.from(select.querySelectorAll("option")).map((option) => option.textContent ?? "").join(" ");
    if (/Salary|W2|Business|Self|Rental|Dividend|Interest|Untagged/i.test(options)) {
      select.dataset.testid ||= pathname.includes("income") ? "income-classification-select" : "transaction-income-classification-select";
    }
    if (/bank|trade|crypto|income|fee|transfer|tax_payment/i.test(options)) select.dataset.testid ||= "transaction-type-select";
    if (/2024|2025|2026|2027|tax year/i.test(options)) select.dataset.testid ||= pathname.includes("tax") ? "tax-year-select" : "writeoffs-tax-year-select";
    if (/January|February|March|April|May|June|July|August|September|October|November|December/i.test(options)) select.dataset.testid ||= "budget-month-select";
    if (/Alabama|Alaska|California|Florida|Georgia|New York|Texas|State/i.test(options)) select.dataset.testid ||= "tax-state-select";
    if (/LLC|S Corp|C Corp|Sole Proprietor|Partnership|Entity/i.test(options)) select.dataset.testid ||= "tax-entity-type-select";
  });
}

function tagPageRoot(pathname: string) {
  const rootId = PAGE_ROOT_IDS[pathname];
  const main = document.querySelector("main");
  if (rootId && main) (main as HTMLElement).dataset.testid ||= rootId;
}

function applyDashboardTestIds(pathname: string) {
  if (!pathname.startsWith("/dashboard")) return;
  tagPageRoot(pathname);
  tagCards();
  tagRows(pathname);
  tagControls(pathname);
}

export default function DashboardTestIds() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/dashboard")) return;

    const run = () => applyDashboardTestIds(pathname);
    run();

    const observer = new MutationObserver(() => run());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
