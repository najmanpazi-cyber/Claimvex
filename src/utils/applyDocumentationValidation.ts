// ACC-08: Documentation Sufficiency Validation Integration Helper
// Thin wrapper around validateDocumentation() plus a test utility for building
// full DeterministicCodingOutput objects that pass ACC-03 validation.
// No force-review rules in ACC-08 — all rules are block or warn.

import type {
  DeterministicCodingOutput,
  RuleEvaluation,
  RuleId,
} from "@/types/ruleEngine";
import {
  ALL_RULE_IDS,
  RULE_DOMAIN_MAP,
  RULE_ACTION_MAP,
} from "@/utils/validateRuleEvaluation";
import {
  validateDocumentation,
  type DocumentationValidatorInput,
  type DocumentationValidationResult,
} from "@/validators/documentationValidator";

// ---------------------------------------------------------------------------
// Integration wrapper
// ---------------------------------------------------------------------------

export function applyDocumentationValidation(input: DocumentationValidatorInput): DocumentationValidationResult {
  return validateDocumentation(input);
}

// ---------------------------------------------------------------------------
// Test utility: build a full DeterministicCodingOutput from doc results
// ---------------------------------------------------------------------------

function buildDefaultEvaluation(ruleId: RuleId): RuleEvaluation {
  return {
    rule_id: ruleId,
    domain: RULE_DOMAIN_MAP[ruleId],
    action_type: RULE_ACTION_MAP[ruleId],
    severity: "Low",
    trigger_matched: false,
    message_user: "",
    message_internal: "",
    evidence_fields: [],
    missing_info_keys: [],
    payer_note: null,
    suppressed_code: null,
    payer_context: null,
    policy_anchor: null,
  };
}

export interface TestOutputOverrides {
  suggested_codes?: DeterministicCodingOutput["suggested_codes"];
  modifiers?: DeterministicCodingOutput["modifiers"];
  diagnoses?: DeterministicCodingOutput["diagnoses"];
  payer_type?: "commercial" | "medicare" | "unknown";
}

export function buildTestCodingOutput(
  docResult: DocumentationValidationResult,
  overrides: TestOutputOverrides = {}
): DeterministicCodingOutput {
  const evalMap = new Map<string, RuleEvaluation>();
  for (const re of docResult.rule_evaluations) {
    evalMap.set(re.rule_id, re);
  }

  const allEvaluations: RuleEvaluation[] = ALL_RULE_IDS.map((ruleId) => {
    if (evalMap.has(ruleId)) return evalMap.get(ruleId)!;
    return buildDefaultEvaluation(ruleId);
  });

  const hasBlock = allEvaluations.some(
    (re) => re.trigger_matched && re.action_type === "block"
  );

  // No force-review rules in ACC-08
  let confidence: "high" | "medium" | "low" = "high";
  if (hasBlock) confidence = "low";

  const cleanClaimReady = !hasBlock;

  return {
    suggested_codes: overrides.suggested_codes ?? [],
    suppressed_codes: docResult.suppressed_codes,
    modifiers: overrides.modifiers ?? [],
    diagnoses: overrides.diagnoses ?? [],
    missing_information: docResult.missing_information,
    warnings: docResult.warnings,
    force_review_items: docResult.force_review_items,
    force_review_pending: false,
    clean_claim_ready: cleanClaimReady,
    confidence,
    rule_evaluations: allEvaluations,
    payer_context_applied: {
      payer_type: overrides.payer_type ?? "commercial",
      safe_defaults_used: false,
    },
    version_metadata: {
      ncci_ptp_edition: "Q1 2026",
      mue_edition: "Q1 2026",
      cpt_edition: "2026",
      icd10_edition: "FY2026",
      ruleset_version: "orthopedics-v1-beta",
      schema_version: "1.0.0",
      generated_at: new Date().toISOString(),
    },
  };
}
