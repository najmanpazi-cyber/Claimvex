import { describe, it, expect } from "vitest";
import {
  validateRuleEvaluation,
  validateRuleEvaluations,
  RULE_DOMAIN_MAP,
  RULE_ACTION_MAP,
} from "@/utils/validateRuleEvaluation";
import type { RuleEvaluation } from "@/types/ruleEngine";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function makeEval(overrides: Partial<RuleEvaluation> = {}): RuleEvaluation {
  return {
    rule_id: "R-3.1.1",
    domain: "PTP",
    action_type: "block",
    severity: "Critical",
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("validateRuleEvaluation", () => {
  it("accepts a valid triggered rule evaluation", () => {
    const result = validateRuleEvaluation(
      makeEval({
        trigger_matched: true,
        message_user: "Arthroscopy bundled with open procedure.",
        message_internal: "NCCI PTP column-1/column-2 conflict.",
        evidence_fields: ["cpt_primary", "cpt_secondary"],
        suppressed_code: "29870",
        policy_anchor: "NCCI PTP Q1 2026",
      })
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts a valid non-triggered rule evaluation", () => {
    const result = validateRuleEvaluation(makeEval());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects invalid action_type enum value", () => {
    const result = validateRuleEvaluation(
      makeEval({ action_type: "deny" as unknown as "block" })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].code).toMatch(/^STRUCTURAL_/);
  });

  it("rejects rule-action consistency violation", () => {
    // R-3.1.1 should be "block", not "warn"
    const result = validateRuleEvaluation(
      makeEval({ rule_id: "R-3.1.1", action_type: "warn" })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEMANTIC_RULE_ACTION_MISMATCH")).toBe(true);
  });

  it("rejects missing required field", () => {
    const { severity, ...noSeverity } = makeEval();
    const result = validateRuleEvaluation(noSeverity);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code.startsWith("STRUCTURAL_"))).toBe(true);
  });

  it("rejects suppressed_code with trigger_matched=false", () => {
    const result = validateRuleEvaluation(
      makeEval({
        trigger_matched: false,
        suppressed_code: "29870",
      })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEMANTIC_SUPPRESSED_WITHOUT_TRIGGER")).toBe(true);
  });

  it("rejects rule-domain mismatch", () => {
    // R-3.2.1 belongs to MUE, not PTP
    const result = validateRuleEvaluation(
      makeEval({ rule_id: "R-3.2.1", domain: "PTP", action_type: "block" })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEMANTIC_RULE_DOMAIN_MISMATCH")).toBe(true);
  });
});

describe("validateRuleEvaluations (batch)", () => {
  it("validates a batch and prefixes paths with index", () => {
    const result = validateRuleEvaluations([
      makeEval(),
      makeEval({ rule_id: "R-3.2.1", domain: "PTP", action_type: "block" }), // wrong domain
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.startsWith("[1]."))).toBe(true);
  });

  it("accepts a valid batch", () => {
    const result = validateRuleEvaluations([
      makeEval(),
      makeEval({ rule_id: "R-3.2.1", domain: "MUE", action_type: "block" }),
    ]);
    expect(result.valid).toBe(true);
  });
});
