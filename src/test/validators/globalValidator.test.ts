import { describe, it, expect } from "vitest";
import {
  validateGlobal,
  fromStructuredFields,
  isEmCode,
  daysSinceSurgery,
  type GlobalValidatorInput,
} from "@/validators/globalValidator";
import { buildTestCodingOutput } from "@/utils/applyGlobalValidation";
import { validateCodingOutput } from "@/utils/validateCodingOutput";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<GlobalValidatorInput> = {}): GlobalValidatorInput {
  return {
    laterality: "right",
    payer_type: "commercial",
    cpt_codes_submitted: [],
    modifiers_present: {},
    patient_type: "established",
    setting: "office",
    physician_id: "PHY-001",
    global_period_status: "none",
    global_period_surgery_date: null,
    global_period_surgery_cpt: null,
    encounter_date: "2026-02-28",
    prior_surgery_related: true,
    decision_for_surgery_documented: false,
    em_separately_identifiable: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Global Period Validator — ACC-07", () => {
  // =========================================================================
  // Test 1: R-3.4.1 block — E/M in 90-day global without modifier (ACC02-049)
  // =========================================================================
  it("1. blocks E/M in 90-day global without modifier (R-3.4.1)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214"],
      global_period_status: "active_90",
      global_period_surgery_date: "2026-01-31",
      global_period_surgery_cpt: "27447",
    });
    const result = validateGlobal(input);

    const r341 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.1");
    expect(r341).toBeDefined();
    expect(r341!.trigger_matched).toBe(true);
    expect(r341!.action_type).toBe("block");
    expect(r341!.severity).toBe("Critical");
    expect(r341!.policy_anchor).toBe("CMS Global Surgery Policy Q1 2026");

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].cpt_code).toBe("99214");
    expect(result.global_findings[0].status).toBe("blocked");
    expect(result.global_findings[0].is_em_code).toBe(true);
    expect(result.global_findings[0].modifier_status).toBe("missing");
    expect(result.global_findings[0].days_since_surgery).toBe(28);

    expect(result.force_review_items).toHaveLength(0);
    expect(result.suppressed_codes).toHaveLength(0);
  });

  // =========================================================================
  // Test 2: R-3.4.1 pass — E/M in 90-day global WITH -24
  // =========================================================================
  it("2. passes E/M in 90-day global with -24 modifier", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214"],
      modifiers_present: { "99214": ["-24"] },
      global_period_status: "active_90",
      global_period_surgery_date: "2026-01-31",
      global_period_surgery_cpt: "27447",
    });
    const result = validateGlobal(input);

    const r341 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.1");
    expect(r341!.trigger_matched).toBe(false);

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].status).toBe("valid");
    expect(result.global_findings[0].modifier_status).toBe("present");
  });

  // =========================================================================
  // Test 3: R-3.4.1 pass — prior_surgery_related=false
  // =========================================================================
  it("3. does not trigger R-3.4.1 when prior_surgery_related is false", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214"],
      global_period_status: "active_90",
      global_period_surgery_date: "2026-01-31",
      global_period_surgery_cpt: "27447",
      prior_surgery_related: false,
    });
    const result = validateGlobal(input);

    const r341 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.1");
    expect(r341!.trigger_matched).toBe(false);

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].status).toBe("valid");
    expect(result.global_findings[0].modifier_status).toBe("not_applicable");
  });

  // =========================================================================
  // Test 4: R-3.4.2 force-review — E/M + 0-day procedure, no -25 (ACC02-053)
  // =========================================================================
  it("4. triggers R-3.4.2 force-review for E/M + procedure without -25 (ACC02-053)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "20610"],
      modifiers_present: { "20610": ["-RT"] },
    });
    const result = validateGlobal(input);

    const r342 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.2");
    expect(r342).toBeDefined();
    expect(r342!.trigger_matched).toBe(true);
    expect(r342!.action_type).toBe("force-review");
    expect(r342!.severity).toBe("High");

    expect(result.force_review_items).toHaveLength(1);
    expect(result.force_review_items[0].rule_id).toBe("R-3.4.2");
    expect(result.force_review_items[0].resolved).toBe(false);
    expect(result.force_review_items[0].code_context).toContain("99214");

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].cpt_code).toBe("99214");
    expect(result.global_findings[0].status).toBe("needs_review");
    expect(result.global_findings[0].required_modifier).toBe("25");
  });

  // =========================================================================
  // Test 5: R-3.4.2 pass — E/M + procedure WITH -25
  // =========================================================================
  it("5. does not trigger R-3.4.2 when E/M has -25", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "20610"],
      modifiers_present: { "99214": ["-25"], "20610": ["-RT"] },
    });
    const result = validateGlobal(input);

    const r342 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.2");
    expect(r342!.trigger_matched).toBe(false);

    expect(result.force_review_items).toHaveLength(0);
    expect(result.global_findings).toHaveLength(0);
  });

  // =========================================================================
  // Test 6: R-3.4.2 fires even when em_separately_identifiable=true
  // (ACC-10: boolean is message context, NOT a gate — modifier -25 is still required)
  // =========================================================================
  it("6. triggers R-3.4.2 even when em_separately_identifiable is true (modifier -25 still required)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "20610"],
      modifiers_present: { "20610": ["-RT"] },
      em_separately_identifiable: true,
    });
    const result = validateGlobal(input);

    const r342 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.2");
    expect(r342!.trigger_matched).toBe(true);

    // Force-review item created with "separately identifiable" message
    const frItem = result.force_review_items.find((item) => item.rule_id === "R-3.4.2");
    expect(frItem).toBeDefined();
    expect(frItem!.message).toContain("separately identifiable but modifier -25 is missing");
    expect(frItem!.message).toContain("-25");
  });

  // =========================================================================
  // Test 7: R-3.4.3 force-review — E/M + major surgery, no -57 (isolated)
  // =========================================================================
  it("7. triggers R-3.4.3 force-review for E/M + major surgery without -57 (ACC02-057)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "27447"],
      modifiers_present: { "99214": ["-25"], "27447": ["-RT"] },
    });
    const result = validateGlobal(input);

    const r343 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.3");
    expect(r343).toBeDefined();
    expect(r343!.trigger_matched).toBe(true);
    expect(r343!.action_type).toBe("force-review");
    expect(r343!.severity).toBe("High");

    // R-3.4.2 should NOT trigger since E/M has -25
    const r342 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.2");
    expect(r342!.trigger_matched).toBe(false);

    expect(result.force_review_items).toHaveLength(1);
    expect(result.force_review_items[0].rule_id).toBe("R-3.4.3");
    expect(result.force_review_items[0].code_context).toContain("27447");

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].cpt_code).toBe("99214");
    expect(result.global_findings[0].status).toBe("needs_review");
    expect(result.global_findings[0].required_modifier).toBe("57");
  });

  // =========================================================================
  // Test 8: R-3.4.3 pass — E/M + major surgery WITH -57
  // =========================================================================
  it("8. does not trigger R-3.4.3 when E/M has -57", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "27447"],
      modifiers_present: { "99214": ["-25", "-57"], "27447": ["-RT"] },
    });
    const result = validateGlobal(input);

    const r343 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.3");
    expect(r343!.trigger_matched).toBe(false);

    expect(result.force_review_items).toHaveLength(0);
  });

  // =========================================================================
  // Test 9: R-3.4.3 fires even when decision_for_surgery_documented=true
  // (ACC-10 Phase 2: boolean is message context, NOT a gate — modifier -57 is still required)
  // =========================================================================
  it("9. triggers R-3.4.3 even when decision_for_surgery_documented is true (modifier -57 still required)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "27447"],
      modifiers_present: { "99214": ["-25"], "27447": ["-RT"] },
      decision_for_surgery_documented: true,
    });
    const result = validateGlobal(input);

    const r343 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.3");
    expect(r343!.trigger_matched).toBe(true);

    // Force-review item created with "documented" message
    const frItem = result.force_review_items.find((item) => item.rule_id === "R-3.4.3");
    expect(frItem).toBeDefined();
    expect(frItem!.message).toContain("Decision for surgery is documented");
    expect(frItem!.message).toContain("-57");
  });

  // =========================================================================
  // Test 10: R-3.4.3 does NOT fire for E/M + minor procedure
  // =========================================================================
  it("10. does not trigger R-3.4.3 for E/M with minor procedure (0-day global)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "20610"],
      modifiers_present: { "99214": ["-25"], "20610": ["-RT"] },
    });
    const result = validateGlobal(input);

    const r343 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.3");
    expect(r343!.trigger_matched).toBe(false);

    // 20610 is minor_surgery (0-day global), not major_surgery
    expect(result.force_review_items).toHaveLength(0);
  });

  // =========================================================================
  // Test 11: R-3.4.4 block — procedure in 90-day global without modifier (ACC02-061)
  // =========================================================================
  it("11. blocks procedure in 90-day global without modifier (R-3.4.4, ACC02-061)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["29884"],
      modifiers_present: { "29884": ["-RT"] },
      global_period_status: "active_90",
      global_period_surgery_date: "2026-01-17",
      global_period_surgery_cpt: "27447",
    });
    const result = validateGlobal(input);

    const r344 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.4");
    expect(r344).toBeDefined();
    expect(r344!.trigger_matched).toBe(true);
    expect(r344!.action_type).toBe("block");
    expect(r344!.severity).toBe("High");

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].cpt_code).toBe("29884");
    expect(result.global_findings[0].status).toBe("blocked");
    expect(result.global_findings[0].is_em_code).toBe(false);
    expect(result.global_findings[0].modifier_status).toBe("missing");
    expect(result.global_findings[0].days_since_surgery).toBe(42);
  });

  // =========================================================================
  // Test 12: R-3.4.4 block — procedure in 10-day global
  // =========================================================================
  it("12. blocks procedure in 10-day global without modifier (R-3.4.4)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["29874"],
      modifiers_present: { "29874": ["-RT"] },
      global_period_status: "active_10",
      global_period_surgery_date: "2026-02-22",
      global_period_surgery_cpt: "27750",
    });
    const result = validateGlobal(input);

    const r344 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.4");
    expect(r344!.trigger_matched).toBe(true);

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].status).toBe("blocked");
    expect(result.global_findings[0].active_global_status).toBe("active_10");
    expect(result.global_findings[0].days_since_surgery).toBe(6);
  });

  // =========================================================================
  // Test 13: R-3.4.4 pass — procedure WITH -78
  // =========================================================================
  it("13. does not trigger R-3.4.4 when procedure has -78", () => {
    const input = makeInput({
      cpt_codes_submitted: ["29884"],
      modifiers_present: { "29884": ["-78", "-RT"] },
      global_period_status: "active_90",
      global_period_surgery_date: "2026-01-17",
      global_period_surgery_cpt: "27447",
    });
    const result = validateGlobal(input);

    const r344 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.4");
    expect(r344!.trigger_matched).toBe(false);

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].status).toBe("valid");
    expect(result.global_findings[0].modifier_status).toBe("present");
  });

  // =========================================================================
  // Test 14: R-3.4.4 — same CPT as original surgery still fires (ACC02-064)
  // =========================================================================
  it("14. triggers R-3.4.4 for repeat procedure matching original surgery CPT (ACC02-064)", () => {
    const input = makeInput({
      payer_type: "medicare",
      cpt_codes_submitted: ["25607"],
      modifiers_present: { "25607": ["-LT"] },
      global_period_status: "active_90",
      global_period_surgery_date: "2026-01-10",
      global_period_surgery_cpt: "25607",
    });
    const result = validateGlobal(input);

    const r344 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.4");
    expect(r344!.trigger_matched).toBe(true);

    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].status).toBe("blocked");
    expect(result.global_findings[0].payer_handling).toBe("medicare_strict");
  });

  // =========================================================================
  // Test 15: Combined — R-3.4.1 + R-3.4.2 + R-3.4.4 (E/M + procedure in 90-day global)
  // =========================================================================
  it("15. triggers R-3.4.1 + R-3.4.2 + R-3.4.4 for E/M + procedure in 90-day global", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "29884"],
      modifiers_present: { "29884": ["-RT"] },
      global_period_status: "active_90",
      global_period_surgery_date: "2026-01-17",
      global_period_surgery_cpt: "27447",
    });
    const result = validateGlobal(input);

    // R-3.4.1: E/M in 90-day global without modifier → block
    const r341 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.1");
    expect(r341!.trigger_matched).toBe(true);

    // R-3.4.2: E/M + procedure without -25 → force-review
    const r342 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.2");
    expect(r342!.trigger_matched).toBe(true);

    // R-3.4.3: 29884 is endoscopy (0-day), not major surgery → no trigger
    const r343 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.3");
    expect(r343!.trigger_matched).toBe(false);

    // R-3.4.4: procedure in active global without modifier → block
    const r344 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.4");
    expect(r344!.trigger_matched).toBe(true);

    // 2 findings: E/M blocked (from R-3.4.1), procedure blocked (from R-3.4.4)
    expect(result.global_findings).toHaveLength(2);
    expect(result.global_findings.find((f) => f.cpt_code === "99214")!.status).toBe("blocked");
    expect(result.global_findings.find((f) => f.cpt_code === "29884")!.status).toBe("blocked");

    // 1 force-review item from R-3.4.2
    expect(result.force_review_items).toHaveLength(1);
    expect(result.force_review_items[0].rule_id).toBe("R-3.4.2");
  });

  // =========================================================================
  // Test 16: Combined — R-3.4.2 + R-3.4.3 (E/M + major surgery, no global)
  // =========================================================================
  it("16. triggers R-3.4.2 + R-3.4.3 for E/M + major surgery outside global", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "27447"],
      modifiers_present: { "27447": ["-RT"] },
    });
    const result = validateGlobal(input);

    // R-3.4.1: not active_90 → no trigger
    const r341 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.1");
    expect(r341!.trigger_matched).toBe(false);

    // R-3.4.2: E/M + procedure without -25 → force-review
    const r342 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.2");
    expect(r342!.trigger_matched).toBe(true);

    // R-3.4.3: E/M + major surgery without -57 → force-review
    const r343 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.3");
    expect(r343!.trigger_matched).toBe(true);

    // R-3.4.4: status=none → no trigger
    const r344 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.4");
    expect(r344!.trigger_matched).toBe(false);

    // 2 force-review items
    expect(result.force_review_items).toHaveLength(2);
    expect(result.force_review_items.map((f) => f.rule_id).sort()).toEqual(["R-3.4.2", "R-3.4.3"]);

    // 1 finding (E/M — R-3.4.2 creates it, R-3.4.3 skips duplicate)
    expect(result.global_findings).toHaveLength(1);
    expect(result.global_findings[0].cpt_code).toBe("99214");
    expect(result.global_findings[0].status).toBe("needs_review");
  });

  // =========================================================================
  // Test 17: No triggers — E/M only, no global period
  // =========================================================================
  it("17. produces no triggers when only E/M codes and no active global", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214", "99213"],
    });
    const result = validateGlobal(input);

    for (const re of result.rule_evaluations) {
      expect(re.trigger_matched).toBe(false);
    }
    expect(result.global_findings).toHaveLength(0);
    expect(result.force_review_items).toHaveLength(0);
    expect(result.suppressed_codes).toHaveLength(0);
  });

  // =========================================================================
  // Test 18: Helper functions — isEmCode + daysSinceSurgery
  // =========================================================================
  it("18. isEmCode and daysSinceSurgery helpers work correctly", () => {
    // E/M codes
    expect(isEmCode("99202")).toBe(true);
    expect(isEmCode("99211")).toBe(true);
    expect(isEmCode("99214")).toBe(true);
    expect(isEmCode("99215")).toBe(true);

    // Non-E/M codes
    expect(isEmCode("29881")).toBe(false);
    expect(isEmCode("20610")).toBe(false);
    expect(isEmCode("27447")).toBe(false);

    // Days calculation
    expect(daysSinceSurgery("2026-01-31", "2026-02-28")).toBe(28);
    expect(daysSinceSurgery("2026-01-01", "2026-01-01")).toBe(0);
    expect(daysSinceSurgery("2026-01-01", "2026-04-01")).toBe(90);
    expect(daysSinceSurgery("invalid", "2026-01-01")).toBeNull();
    expect(daysSinceSurgery("2026-01-01", "invalid")).toBeNull();
  });

  // =========================================================================
  // Test 19: fromStructuredFields adapter — maps active_90day → active_90
  // =========================================================================
  it("19. adapter maps ACC-02 structured_fields correctly", () => {
    const structuredFields = {
      laterality: "right",
      patient_type: "established",
      setting: "office",
      payer_type: "commercial",
      global_period_status: "active_90day",
      global_period_surgery_date: "2026-01-31",
      global_period_surgery_cpt: "27447",
      units_of_service: { "99214": 1 },
      modifiers_present: {},
      cpt_codes_submitted: ["99214"],
      icd10_codes: ["Z96.651"],
      physician_id: "PHY-001",
    };

    const input = fromStructuredFields(structuredFields);

    // Verify mapping
    expect(input.global_period_status).toBe("active_90");
    expect(input.payer_type).toBe("commercial");
    expect(input.prior_surgery_related).toBe(true); // default
    expect(input.decision_for_surgery_documented).toBe(false); // default
    expect(input.em_separately_identifiable).toBe(false); // default

    // Should trigger R-3.4.1 (E/M in 90-day global, no modifier, related)
    const result = validateGlobal(input);
    const r341 = result.rule_evaluations.find((re) => re.rule_id === "R-3.4.1");
    expect(r341!.trigger_matched).toBe(true);
  });

  // =========================================================================
  // Test 20: ACC-03 semantic validation — block + force-review scenarios
  // =========================================================================
  it("20. produces output that passes ACC-03 validateCodingOutput()", () => {
    // --- Block scenario: R-3.4.1 ---
    const blockInput = makeInput({
      cpt_codes_submitted: ["99214"],
      global_period_status: "active_90",
      global_period_surgery_date: "2026-01-31",
      global_period_surgery_cpt: "27447",
    });
    const blockResult = validateGlobal(blockInput);
    const blockOutput = buildTestCodingOutput(blockResult, { payer_type: "commercial" });

    expect(blockOutput.clean_claim_ready).toBe(false);
    expect(blockOutput.confidence).toBe("low");
    expect(blockOutput.force_review_pending).toBe(false);

    const blockValidation = validateCodingOutput(blockOutput);
    expect(blockValidation.valid).toBe(true);
    expect(blockValidation.errors).toHaveLength(0);

    // --- Force-review scenario: R-3.4.2 ---
    const frInput = makeInput({
      cpt_codes_submitted: ["99214", "20610"],
      modifiers_present: { "20610": ["-RT"] },
    });
    const frResult = validateGlobal(frInput);
    const frOutput = buildTestCodingOutput(frResult, { payer_type: "medicare" });

    // ACC-01 §3.0: force-review leaves clean_claim_ready unchanged (true)
    expect(frOutput.clean_claim_ready).toBe(true);
    expect(frOutput.confidence).toBe("medium");
    expect(frOutput.force_review_pending).toBe(true);

    const frValidation = validateCodingOutput(frOutput);
    expect(frValidation.valid).toBe(true);
    expect(frValidation.errors).toHaveLength(0);
  });
});
