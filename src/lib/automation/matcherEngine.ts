// Pure rule evaluation engine.
// No DB calls. No side effects. Same inputs always produce the same output.
// Caller is responsible for:
//   - filtering rules to status = 'active' before calling evaluateRule
//   - filtering out rules whose action_config.category is in SENSITIVE_CATEGORIES
//   - only passing debit transactions (evaluateRule enforces this as a guard)

import { RawTransaction } from "../financialCalculations";
import { AutomationRule, MatchResult, MerchantNormalizedMatcher, DescriptionPatternMatcher } from "./types";
import { normalizeMerchant, normalizeDescription } from "./merchantNormalizer";

// Minimum confidence required to consider a rule "matched".
const MATCH_THRESHOLD = 0.50;

// Confidence scores for merchant matching tiers.
const MERCHANT_EXACT_CONFIDENCE = 0.85;
const MERCHANT_PARTIAL_CONFIDENCE = 0.65;

// Maximum confidence achievable via description token matching alone.
// Kept below the merchant exact tier to reflect lower signal strength.
const DESCRIPTION_MAX_CONFIDENCE = 0.80;

/**
 * Evaluates a single automation rule against a transaction.
 * Returns a MatchResult with matched=true only if confidence >= MATCH_THRESHOLD.
 *
 * Direction guard: Phase 1 only matches debit transactions.
 * Status is not checked here — the caller must filter to active rules.
 */
export function evaluateRule(rule: AutomationRule, tx: RawTransaction): MatchResult {
  if (tx.direction !== "debit") {
    return { matched: false, confidence: 0, reason: "Transaction is not a debit" };
  }

  if (rule.matcher_type === "merchant_normalized") {
    return evaluateMerchantMatcher(rule.matcher_config as MerchantNormalizedMatcher, tx);
  }

  if (rule.matcher_type === "description_pattern") {
    return evaluateDescriptionMatcher(rule.matcher_config as DescriptionPatternMatcher, tx);
  }

  return { matched: false, confidence: 0, reason: "Unknown matcher type" };
}

function evaluateMerchantMatcher(
  config: MerchantNormalizedMatcher,
  tx: RawTransaction,
): MatchResult {
  const ruleMerchant = config.normalized_merchant;
  const txMerchant = normalizeMerchant(tx.merchant_name ?? "");

  if (!txMerchant || !ruleMerchant) {
    return { matched: false, confidence: 0, reason: "No merchant name to compare" };
  }

  if (txMerchant === ruleMerchant) {
    return {
      matched: true,
      confidence: MERCHANT_EXACT_CONFIDENCE,
      reason: `Exact merchant match: "${txMerchant}"`,
    };
  }

  if (txMerchant.startsWith(ruleMerchant) || ruleMerchant.startsWith(txMerchant)) {
    return {
      matched: true,
      confidence: MERCHANT_PARTIAL_CONFIDENCE,
      reason: `Partial merchant match: "${txMerchant}" ~ "${ruleMerchant}"`,
    };
  }

  return {
    matched: false,
    confidence: 0,
    reason: `No merchant match: "${txMerchant}" vs "${ruleMerchant}"`,
  };
}

function evaluateDescriptionMatcher(
  config: DescriptionPatternMatcher,
  tx: RawTransaction,
): MatchResult {
  const ruleTokens = config.description_tokens;
  const txNorm = normalizeDescription(tx.description ?? "");
  const txTokens = txNorm.split(/\s+/).filter(Boolean);

  if (!txTokens.length || !ruleTokens.length) {
    return { matched: false, confidence: 0, reason: "No description tokens to compare" };
  }

  // Amount range guard
  const amount = Number(tx.amount ?? 0);
  if (config.amount_min !== undefined && amount < config.amount_min) {
    return { matched: false, confidence: 0, reason: "Amount below range minimum" };
  }
  if (config.amount_max !== undefined && amount > config.amount_max) {
    return { matched: false, confidence: 0, reason: "Amount above range maximum" };
  }

  const txTokenSet = new Set(txTokens);
  const matchingTokens = ruleTokens.filter((t) => txTokenSet.has(t));
  const hitRate = matchingTokens.length / ruleTokens.length;
  const confidence = Math.round(hitRate * DESCRIPTION_MAX_CONFIDENCE * 10000) / 10000;

  if (hitRate === 0) {
    return { matched: false, confidence: 0, reason: "No description tokens matched" };
  }

  return {
    matched: confidence >= MATCH_THRESHOLD,
    confidence,
    reason: `Description match: ${matchingTokens.length}/${ruleTokens.length} tokens (${Math.round(hitRate * 100)}%)`,
  };
}
