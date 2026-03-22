// ACC-13: Shared classification and scoring logic
// Extracted from ACC-09 redteam harness for reuse by ACC-13 evaluation harness.

import { RULE_ACTION_MAP, RULE_DOMAIN_MAP } from "@/utils/validateRuleEvaluation";
import type { RuleId, RuleDomain, RuleEvaluation } from "@/types/ruleEngine";
import type { Scenario, ValidatorRunResult } from "./scenarioMapper";

// ============================================================================
// Types
// ============================================================================

export type Classification = "PASS" | "FALSE_PASS" | "FALSE_FAIL" | "WRONG_ACTION" | "PARTIAL" | "UNEVALUABLE";

export interface DomainResult {
  domain: RuleDomain;
  expected_rules: string[];
  actual_rules: string[];
  expected_action: string | null;
  actual_action: string;
  rules_matched: boolean;
  action_matched: boolean;
  extra_rules: string[];
  missing_rules: string[];
}

export interface AggregatedResult {
  actual_action: string;
  actual_clean_claim_ready: boolean;
  actual_confidence: string;
  actual_rule_hits: string[];
  actual_suppressed_codes: string[];
  actual_missing_info_keys: string[];
  all_rule_evaluations: RuleEvaluation[];
  all_suppressed_codes: ValidatorRunResult["suppressed_codes"];
  all_force_review_items: ValidatorRunResult["force_review_items"];
  all_warnings: ValidatorRunResult["warnings"];
  domain_results: DomainResult[];
  unevaluable_domains: { domain: string; reason: string }[];
}

// ============================================================================
// Helpers
// ============================================================================

export function actionSeverity(action: string): number {
  if (action === "block") return 3;
  if (action === "force-review") return 2;
  if (action === "warn") return 1;
  return 0;
}

export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ============================================================================
// Domain-level results
// ============================================================================

export function buildDomainResults(scenario: Scenario, triggeredEvals: RuleEvaluation[]): DomainResult[] {
  const allDomains: RuleDomain[] = ["PTP", "MUE", "MODIFIER", "GLOBAL", "DOC_SUFFICIENCY"];
  const results: DomainResult[] = [];

  for (const domain of allDomains) {
    const expectedRulesInDomain = scenario.expected_rule_hits.filter(
      (r) => RULE_DOMAIN_MAP[r as RuleId] === domain
    );
    const actualRulesInDomain = triggeredEvals
      .filter((re) => re.domain === domain)
      .map((re) => re.rule_id)
      .sort();

    const expectedSet = new Set(expectedRulesInDomain);
    const actualSet = new Set(actualRulesInDomain);

    const missingRules = expectedRulesInDomain.filter((r) => !actualSet.has(r as RuleId));
    const extraRules = actualRulesInDomain.filter((r) => !expectedSet.has(r as string));

    // Determine expected action for domain (highest severity expected rule in domain)
    let expectedDomainAction: string | null = null;
    for (const ruleId of expectedRulesInDomain) {
      const action = RULE_ACTION_MAP[ruleId as RuleId];
      if (action) {
        if (!expectedDomainAction) expectedDomainAction = action;
        else if (actionSeverity(action) > actionSeverity(expectedDomainAction)) expectedDomainAction = action;
      }
    }

    // Determine actual action for domain
    let actualDomainAction = "pass";
    for (const re of triggeredEvals.filter((e) => e.domain === domain)) {
      if (actionSeverity(re.action_type) > actionSeverity(actualDomainAction)) {
        actualDomainAction = re.action_type;
      }
    }

    results.push({
      domain,
      expected_rules: expectedRulesInDomain.sort(),
      actual_rules: actualRulesInDomain,
      expected_action: expectedDomainAction,
      actual_action: actualDomainAction,
      rules_matched: missingRules.length === 0 && extraRules.length === 0,
      action_matched: expectedDomainAction === null
        ? actualDomainAction === "pass"
        : expectedDomainAction === actualDomainAction,
      extra_rules: extraRules,
      missing_rules: missingRules,
    });
  }

  return results;
}

// ============================================================================
// Unevaluable domain detection
// ============================================================================

export function detectUnevaluableDomains(scenario: Scenario): { domain: string; reason: string }[] {
  const issues: { domain: string; reason: string }[] = [];

  // R-3.5.4 requires diagnosis_text which is not in structured_fields
  if (scenario.expected_rule_hits.includes("R-3.5.4")) {
    issues.push({
      domain: "DOC_SUFFICIENCY:R-3.5.4",
      reason: "diagnosis_text not in structured_fields; rule-out keyword detection impossible",
    });
  }

  // Modifier documentation evidence booleans not in structured_fields
  const modifierRulesExpected = scenario.expected_rule_hits.filter((r) =>
    ["R-3.3.1", "R-3.3.3"].includes(r)
  );
  if (modifierRulesExpected.length > 0 && !scenario.expected_rule_hits.includes("R-3.3.2")) {
    issues.push({
      domain: "MODIFIER:documentation_evidence",
      reason: "distinct_*_documented fields absent in structured_fields; defaults to false causing R-3.3.2 co-fire",
    });
  }

  return issues;
}

// ============================================================================
// Result aggregation
// ============================================================================

export function aggregateResults(scenario: Scenario, run: ValidatorRunResult): AggregatedResult {
  const triggeredEvals = run.rule_evaluations.filter((re) => re.trigger_matched);
  const triggeredRuleIds = triggeredEvals.map((re) => re.rule_id).sort();

  const hasBlock = triggeredEvals.some((re) => re.action_type === "block");
  const hasForceReview = triggeredEvals.some((re) => re.action_type === "force-review");
  const hasWarn = triggeredEvals.some((re) => re.action_type === "warn");

  let actualAction: string;
  if (hasBlock) actualAction = "block";
  else if (hasForceReview) actualAction = "force-review";
  else if (hasWarn) actualAction = "warn";
  else actualAction = "pass";

  // ACC-01 §3.0: clean_claim_ready is false only on block; force-review leaves it unchanged
  const actualCleanClaimReady = !hasBlock;

  let actualConfidence: string;
  if (hasBlock) actualConfidence = "low";
  else if (hasForceReview) actualConfidence = "medium";
  else actualConfidence = "high";

  const actualSuppressedCodes = [...new Set(run.suppressed_codes.map((sc) => sc.cpt_code))].sort();

  // Collect missing info keys from triggered rule evals + documentation missing_information
  const missingInfoSet = new Set<string>();
  for (const re of triggeredEvals) {
    for (const k of re.missing_info_keys) missingInfoSet.add(k);
  }
  for (const mi of run.missing_information) missingInfoSet.add(mi);
  const actualMissingInfoKeys = [...missingInfoSet].sort();

  // Domain-level results
  const domainResults = buildDomainResults(scenario, triggeredEvals);

  // Check for unevaluable domains
  const unevaluableDomains = detectUnevaluableDomains(scenario);

  return {
    actual_action: actualAction,
    actual_clean_claim_ready: actualCleanClaimReady,
    actual_confidence: actualConfidence,
    actual_rule_hits: triggeredRuleIds,
    actual_suppressed_codes: actualSuppressedCodes,
    actual_missing_info_keys: actualMissingInfoKeys,
    all_rule_evaluations: run.rule_evaluations,
    all_suppressed_codes: run.suppressed_codes,
    all_force_review_items: run.force_review_items,
    all_warnings: run.warnings,
    domain_results: domainResults,
    unevaluable_domains: unevaluableDomains,
  };
}

// ============================================================================
// R-3.2.2 informational tolerance (ACC-10)
// ============================================================================

// R-3.2.2 (MUE at-limit warn) is informational-only per ACC-01 §3.0.
// When MUE=1 (87% of orthopedic codes), it fires trivially on every
// single-unit code. Tolerate R-3.2.2 as an unexpected extra without
// penalizing classification, provided it doesn't change CCR or confidence.
// This is a narrow exception for R-3.2.2 only — other warn rules are
// not tolerated.
const TOLERATED_INFO_RULE = "R-3.2.2" as const;

/**
 * Compute effective action and rules with R-3.2.2 filtered out.
 * Returns null if R-3.2.2 is not an unexpected extra or if filtering
 * would change CCR/confidence (safety guard).
 */
export function applyR322Tolerance(
  expRules: string[],
  actRules: string[],
  actAction: string,
  actCCR: boolean,
  actConf: string,
  allRuleEvals: RuleEvaluation[],
): { effectiveAction: string; effectiveRules: string[] } | null {
  // Only applies when R-3.2.2 is an unexpected extra
  if (!actRules.includes(TOLERATED_INFO_RULE) || expRules.includes(TOLERATED_INFO_RULE)) {
    return null;
  }

  // Guard: verify R-3.2.2 action_type is warn (defensive — always true by spec)
  const r322Eval = allRuleEvals.find(
    (re) => re.trigger_matched && re.rule_id === TOLERATED_INFO_RULE,
  );
  if (!r322Eval || r322Eval.action_type !== "warn") {
    return null;
  }

  // Compute what action/CCR/confidence would be without R-3.2.2
  const nonR322Triggered = allRuleEvals.filter(
    (re) => re.trigger_matched && re.rule_id !== TOLERATED_INFO_RULE,
  );
  const hasBlock = nonR322Triggered.some((re) => re.action_type === "block");
  const hasFR = nonR322Triggered.some((re) => re.action_type === "force-review");
  const hasWarn = nonR322Triggered.some((re) => re.action_type === "warn");

  let effectiveAction: string;
  if (hasBlock) effectiveAction = "block";
  else if (hasFR) effectiveAction = "force-review";
  else if (hasWarn) effectiveAction = "warn";
  else effectiveAction = "pass";

  // Guard: R-3.2.2 must not have changed CCR or confidence
  const effectiveCCR = !hasBlock;
  const effectiveConf = hasBlock ? "low" : hasFR ? "medium" : "high";
  if (actCCR !== effectiveCCR || actConf !== effectiveConf) {
    return null; // R-3.2.2 somehow affected CCR/conf — don't tolerate
  }

  const effectiveRules = actRules.filter((r) => r !== TOLERATED_INFO_RULE);
  return { effectiveAction, effectiveRules };
}

// ============================================================================
// Classification
// ============================================================================

export function classifyScenario(scenario: Scenario, agg: AggregatedResult): Classification {
  const expAction = scenario.expected_action;
  const actAction = agg.actual_action;
  const expCCR = scenario.expected_clean_claim_ready;
  const actCCR = agg.actual_clean_claim_ready;
  const expConf = scenario.expected_confidence;
  const actConf = agg.actual_confidence;
  const expRules = [...scenario.expected_rule_hits].sort();
  const actRules = [...agg.actual_rule_hits].sort();
  const expSuppressed = [...scenario.expected_suppressed_codes].sort();
  const actSuppressed = [...agg.actual_suppressed_codes].sort();

  // FALSE PASS: expected block/force-review but got pass/warn, OR expected CCR=false but got true
  // Safety-critical — always uses original (un-toleranced) values
  if (
    (["block", "force-review"].includes(expAction) && ["pass", "warn"].includes(actAction)) ||
    (expCCR === false && actCCR === true)
  ) {
    return "FALSE_PASS";
  }

  // FALSE FAIL: expected pass/warn but got block/force-review
  // Safety-critical — always uses original (un-toleranced) values
  if (
    (["pass", "warn"].includes(expAction) && ["block", "force-review"].includes(actAction)) ||
    (expCCR === true && actCCR === false)
  ) {
    return "FALSE_FAIL";
  }

  // Apply narrow R-3.2.2 tolerance (ACC-10)
  const r322 = applyR322Tolerance(expRules, actRules, actAction, actCCR, actConf, agg.all_rule_evaluations);
  const effectiveAction = r322?.effectiveAction ?? actAction;
  const effectiveRules = r322?.effectiveRules ?? actRules;

  // WRONG ACTION: action mismatch not covered above
  if (expAction !== effectiveAction) {
    return "WRONG_ACTION";
  }

  // Check supporting fields
  const rulesMatch = arraysEqual(expRules, effectiveRules);
  const suppressedMatch = arraysEqual(expSuppressed, actSuppressed);
  const confMatch = expConf === actConf;
  const ccrMatch = expCCR === actCCR;

  // Compare missing info keys carefully
  const expMissing = [...scenario.expected_missing_info_keys].sort();
  // Filter actual missing info keys to only the short-form keys (not prompt templates)
  const actualShortKeys = agg.actual_missing_info_keys
    .filter((k) => !k.includes(" "))
    .sort();
  const missingInfoMatch = arraysEqual(expMissing, actualShortKeys);

  if (rulesMatch && suppressedMatch && confMatch && ccrMatch) {
    return "PASS";
  }

  return "PARTIAL";
}
