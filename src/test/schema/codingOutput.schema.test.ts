import { describe, it, expect } from "vitest";
import { validateCodingOutput } from "@/utils/validateCodingOutput";
import { RULE_DOMAIN_MAP, RULE_ACTION_MAP, ALL_RULE_IDS } from "@/utils/validateRuleEvaluation";
import type { DeterministicCodingOutput, RuleEvaluation, RuleId } from "@/types/ruleEngine";

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

function makeRuleEvaluation(
  ruleId: RuleId,
  overrides: Partial<RuleEvaluation> = {}
): RuleEvaluation {
  return {
    rule_id: ruleId,
    domain: RULE_DOMAIN_MAP[ruleId],
    action_type: RULE_ACTION_MAP[ruleId],
    severity: "Medium",
    trigger_matched: false,
    message_user: "",
    message_internal: "",
    evidence_fields: [],
    missing_info_keys: [],
    payer_note: null,
    suppressed_code: null,
    payer_context: null,
    policy_anchor: null,
    ...overrides,
  };
}

function makeValidOutput(
  overrides: Partial<DeterministicCodingOutput> = {}
): DeterministicCodingOutput {
  return {
    suggested_codes: [{ cpt_code: "29881", description: "Knee arthroscopy, meniscectomy" }],
    suppressed_codes: [],
    modifiers: [],
    diagnoses: [{ icd10_code: "M23.311", description: "Other meniscus derangements, right knee" }],
    missing_information: [],
    warnings: [],
    force_review_items: [],
    force_review_pending: false,
    clean_claim_ready: true,
    confidence: "high",
    rule_evaluations: ALL_RULE_IDS.map((id) => makeRuleEvaluation(id)),
    payer_context_applied: { payer_type: "commercial", safe_defaults_used: false },
    version_metadata: {
      ncci_ptp_edition: "Q1 2026",
      mue_edition: "Q1 2026",
      cpt_edition: "AMA CPT 2026",
      icd10_edition: "FY2026",
      ruleset_version: "1.0.0",
      schema_version: "1.0.0",
      generated_at: "2026-02-28T12:00:00Z",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mandatory fixtures
// ---------------------------------------------------------------------------

describe("validateCodingOutput", () => {
  // Fixture 1: Valid clean-claim output
  it("accepts a valid clean-claim output with no rules triggered", () => {
    const output = makeValidOutput();
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Fixture 2: Valid block rule fired
  it("accepts a valid output with block rule R-3.1.1 fired", () => {
    const output = makeValidOutput({
      clean_claim_ready: false,
      confidence: "low",
      suppressed_codes: [
        {
          cpt_code: "29870",
          description: "Diagnostic arthroscopy, knee",
          suppressed_by_rule: "R-3.1.1",
          reason: "Bundled under NCCI PTP",
        },
      ],
      rule_evaluations: ALL_RULE_IDS.map((id) =>
        makeRuleEvaluation(id, id === "R-3.1.1" ? {
          trigger_matched: true,
          suppressed_code: "29870",
          message_user: "Arthroscopy bundled with open procedure.",
          message_internal: "NCCI PTP conflict detected.",
        } : {})
      ),
    });
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Fixture 3: Valid force_review_pending
  it("accepts a valid output with force-review pending", () => {
    const output = makeValidOutput({
      clean_claim_ready: false,
      confidence: "medium",
      force_review_pending: true,
      force_review_items: [
        {
          rule_id: "R-3.3.1",
          message: "Medicare: -59 should be replaced with X-modifier.",
          code_context: ["29881"],
          resolved: false,
        },
      ],
      rule_evaluations: ALL_RULE_IDS.map((id) =>
        makeRuleEvaluation(id, id === "R-3.3.1" ? {
          trigger_matched: true,
          message_user: "Many Medicare MACs require X-modifiers.",
          message_internal: "Modifier -59 on Medicare claim.",
        } : {})
      ),
    });
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Fixture 4: Invalid — missing required field
  it("rejects output missing version_metadata", () => {
    const output = makeValidOutput();
    const { version_metadata, ...noMeta } = output;
    const result = validateCodingOutput(noMeta);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].code).toMatch(/^STRUCTURAL_/);
  });

  // Fixture 5: Semantic — block + clean=true
  it("rejects block rule fired with clean_claim_ready=true", () => {
    const output = makeValidOutput({
      clean_claim_ready: true,
      confidence: "low",
      rule_evaluations: ALL_RULE_IDS.map((id) =>
        makeRuleEvaluation(id, id === "R-3.1.1" ? { trigger_matched: true } : {})
      ),
    });
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEMANTIC_BLOCK_CLEAN_CONTRADICTION")).toBe(true);
  });

  // Fixture 6: Semantic — block + confidence=high
  it("rejects block rule fired with confidence=high", () => {
    const output = makeValidOutput({
      clean_claim_ready: false,
      confidence: "high",
      rule_evaluations: ALL_RULE_IDS.map((id) =>
        makeRuleEvaluation(id, id === "R-3.5.1" ? { trigger_matched: true } : {})
      ),
    });
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEMANTIC_BLOCK_CONFIDENCE_CONTRADICTION")).toBe(true);
  });

  // Fixture 7: Edge — empty rule_evaluations
  it("accepts output with empty rule_evaluations array", () => {
    const output = makeValidOutput({ rule_evaluations: [] });
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Bonus fixtures
  // ---------------------------------------------------------------------------

  it("rejects force_review_pending mismatch (pending=false with unresolved items)", () => {
    const output = makeValidOutput({
      clean_claim_ready: false,
      confidence: "medium",
      force_review_pending: false,
      force_review_items: [
        {
          rule_id: "R-3.4.2",
          message: "Same-day E/M requires -25.",
          code_context: ["99213", "20610"],
          resolved: false,
        },
      ],
      rule_evaluations: ALL_RULE_IDS.map((id) =>
        makeRuleEvaluation(id, id === "R-3.4.2" ? { trigger_matched: true } : {})
      ),
    });
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEMANTIC_FORCE_REVIEW_PENDING_MISMATCH")).toBe(true);
  });

  it("rejects suppressed_code referencing non-triggered rule", () => {
    const output = makeValidOutput({
      clean_claim_ready: true,
      confidence: "high",
      suppressed_codes: [
        {
          cpt_code: "29870",
          description: "Diagnostic arthroscopy",
          suppressed_by_rule: "R-3.1.4",
          reason: "Bundled",
        },
      ],
    });
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEMANTIC_SUPPRESSED_REF_UNTRIGGERED")).toBe(true);
  });

  it("rejects rule_evaluation with wrong domain", () => {
    const output = makeValidOutput({
      rule_evaluations: ALL_RULE_IDS.map((id) =>
        makeRuleEvaluation(id, id === "R-3.1.1" ? { domain: "MUE" as unknown as "PTP" } : {})
      ),
    });
    const result = validateCodingOutput(output);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEMANTIC_RULE_DOMAIN_MISMATCH")).toBe(true);
  });

  it("warns when warning references non-triggered rule", () => {
    const output = makeValidOutput({
      warnings: [
        {
          type: "warning",
          rule_id: "R-3.1.3",
          message: "Cast/splint bundled.",
          code_context: null,
        },
      ],
    });
    const result = validateCodingOutput(output);
    // This is classified as a warning, not an error
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "SEMANTIC_WARNING_REF_UNTRIGGERED")).toBe(true);
  });
});
