// ACC-13: Shared scenario loading and validator execution
// Extracted from ACC-09 redteam harness for reuse by ACC-13 evaluation harness.

import { readFileSync } from "fs";

import { validatePtp, fromStructuredFields as ptpFromSF } from "@/validators/ptpValidator";
import { validateMue, fromStructuredFields as mueFromSF } from "@/validators/mueValidator";
import { validateModifiers, fromStructuredFields as modFromSF } from "@/validators/modifierValidator";
import { validateGlobal, fromStructuredFields as globalFromSF } from "@/validators/globalValidator";
import { validateDocumentation, fromStructuredFields as docFromSF } from "@/validators/documentationValidator";
import type { RuleEvaluation, SuppressedCode, ForceReviewItem, DeterministicWarning } from "@/types/ruleEngine";

// ============================================================================
// Types
// ============================================================================

export interface ScenarioStructuredFields {
  laterality: string;
  patient_type: string;
  setting: string;
  payer_type: string;
  global_period_status: string;
  global_period_surgery_date: string | null;
  global_period_surgery_cpt: string | null;
  units_of_service: Record<string, number>;
  modifiers_present: Record<string, string[]>;
  cpt_codes_submitted: string[];
  icd10_codes: string[];
  physician_id: string;
}

export interface Scenario {
  id: string;
  domain: string;
  sub_category: string;
  complexity: string;
  payer_type: string;
  clinical_vignette: string;
  clinical_input: string;
  structured_fields: ScenarioStructuredFields;
  expected_rule_hits: string[];
  expected_action: string;
  expected_clean_claim_ready: boolean;
  expected_confidence: string;
  expected_suppressed_codes: string[];
  expected_missing_info_keys: string[];
  edge_case_tags: string[];
  domains_tested: string[];
  rationale: string;
}

export interface ValidatorRunResult {
  rule_evaluations: RuleEvaluation[];
  suppressed_codes: SuppressedCode[];
  warnings: DeterministicWarning[];
  force_review_items: ForceReviewItem[];
  missing_information: string[];
}

// ============================================================================
// JSONL loading
// ============================================================================

export function loadScenarios(path: string): Scenario[] {
  const raw = readFileSync(path, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const scenarios: Scenario[] = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      scenarios.push(JSON.parse(lines[i]) as Scenario);
    } catch (e) {
      console.error(`FATAL: malformed JSONL at line ${i + 1}: ${(e as Error).message}`);
      process.exit(1);
    }
  }
  return scenarios;
}

// ============================================================================
// Validator execution — runs all 5 validators on structured_fields
// ============================================================================

export function runAllValidators(sf: ScenarioStructuredFields): ValidatorRunResult {
  const allRuleEvals: RuleEvaluation[] = [];
  const allSuppressed: SuppressedCode[] = [];
  const allWarnings: DeterministicWarning[] = [];
  const allForceReview: ForceReviewItem[] = [];
  const allMissingInfo: string[] = [];

  // 1. PTP
  const ptpInput = ptpFromSF(sf as unknown as Parameters<typeof ptpFromSF>[0]);
  const ptpResult = validatePtp(ptpInput);
  allRuleEvals.push(...ptpResult.rule_evaluations);
  allSuppressed.push(...ptpResult.suppressed_codes);
  allWarnings.push(...ptpResult.warnings);

  // 2. MUE
  const mueInput = mueFromSF(sf as unknown as Parameters<typeof mueFromSF>[0]);
  const mueResult = validateMue(mueInput);
  allRuleEvals.push(...mueResult.rule_evaluations);
  allSuppressed.push(...mueResult.suppressed_codes);
  allWarnings.push(...mueResult.warnings);

  // 3. MODIFIER
  const modInput = modFromSF(sf as unknown as Parameters<typeof modFromSF>[0]);
  const modResult = validateModifiers(modInput);
  allRuleEvals.push(...modResult.rule_evaluations);
  allSuppressed.push(...modResult.suppressed_codes);
  allWarnings.push(...modResult.warnings);
  allForceReview.push(...modResult.force_review_items);

  // 4. GLOBAL
  const globalInput = globalFromSF(sf as unknown as Parameters<typeof globalFromSF>[0]);
  const globalResult = validateGlobal(globalInput);
  allRuleEvals.push(...globalResult.rule_evaluations);
  allSuppressed.push(...globalResult.suppressed_codes);
  allWarnings.push(...globalResult.warnings);
  allForceReview.push(...globalResult.force_review_items);

  // 5. DOC_SUFFICIENCY
  const docInput = docFromSF(sf as unknown as Parameters<typeof docFromSF>[0]);
  const docResult = validateDocumentation(docInput);
  allRuleEvals.push(...docResult.rule_evaluations);
  allSuppressed.push(...docResult.suppressed_codes);
  allWarnings.push(...docResult.warnings);
  allForceReview.push(...docResult.force_review_items);
  allMissingInfo.push(...docResult.missing_information);

  return {
    rule_evaluations: allRuleEvals,
    suppressed_codes: allSuppressed,
    warnings: allWarnings,
    force_review_items: allForceReview,
    missing_information: allMissingInfo,
  };
}
