import { describe, it, expect } from "vitest";
import {
  validatePtp,
  findPtpConflicts,
  getCodeLaterality,
  isSameJoint,
  fromStructuredFields,
  type PtpValidatorInput,
} from "@/validators/ptpValidator";
import { buildTestCodingOutput } from "@/utils/applyPtpValidation";
import { validateCodingOutput } from "@/utils/validateCodingOutput";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<PtpValidatorInput> = {}): PtpValidatorInput {
  return {
    laterality: "right",
    cpt_codes_submitted: [],
    modifiers_present: {},
    payer_type: "commercial",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PTP Validator — ACC-04", () => {
  // =========================================================================
  // Test 1: No conflict — different laterality (ACC02-005)
  // =========================================================================
  it("1. reports no conflict when codes are on different sides (ACC02-005)", () => {
    const input = makeInput({
      laterality: "bilateral",
      cpt_codes_submitted: ["29881", "27405"],
      modifiers_present: { "27405": ["-LT"], "29881": ["-RT"] },
    });
    const result = validatePtp(input);

    // All 4 PTP rules should exist and none triggered
    expect(result.rule_evaluations).toHaveLength(4);
    for (const re of result.rule_evaluations) {
      expect(re.trigger_matched).toBe(false);
    }
    expect(result.suppressed_codes).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  // =========================================================================
  // Test 2: No conflict — different joint categories (ACC02-009)
  // =========================================================================
  it("2. reports no conflict when codes are in different joint categories (ACC02-009)", () => {
    // R knee injection + L shoulder scope — different joint categories AND different sides
    const input = makeInput({
      laterality: "bilateral",
      cpt_codes_submitted: ["20610", "29826"],
      modifiers_present: { "20610": ["-RT"], "29826": ["-LT"] },
    });
    const result = validatePtp(input);

    expect(result.suppressed_codes).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    for (const re of result.rule_evaluations) {
      expect(re.trigger_matched).toBe(false);
    }
  });

  // =========================================================================
  // Test 3: R-3.1.1 block — scope + open same joint (ACC02-001)
  // =========================================================================
  it("3. triggers R-3.1.1 block for arthroscopy + open procedure same joint (ACC02-001)", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["29881", "27447"],
      modifiers_present: {},
    });
    const result = validatePtp(input);

    const r311 = result.rule_evaluations.find((re) => re.rule_id === "R-3.1.1");
    expect(r311).toBeDefined();
    expect(r311!.trigger_matched).toBe(true);
    expect(r311!.action_type).toBe("block");
    expect(r311!.severity).toBe("Critical");
    expect(r311!.suppressed_code).toBe("29881");
    expect(r311!.policy_anchor).toBe("NCCI PTP Edits Q1 2026");

    expect(result.suppressed_codes).toHaveLength(1);
    expect(result.suppressed_codes[0].cpt_code).toBe("29881");
  });

  // =========================================================================
  // Test 4: R-3.1.2 block — injection + scope same joint (ACC02-006)
  // =========================================================================
  it("4. triggers R-3.1.2 block for injection + arthroscopy same joint (ACC02-006)", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["20610", "29877"],
      modifiers_present: {},
    });
    const result = validatePtp(input);

    const r312 = result.rule_evaluations.find((re) => re.rule_id === "R-3.1.2");
    expect(r312).toBeDefined();
    expect(r312!.trigger_matched).toBe(true);
    expect(r312!.action_type).toBe("block");
    expect(r312!.severity).toBe("High");

    expect(result.suppressed_codes).toHaveLength(1);
    expect(result.suppressed_codes[0].cpt_code).toBe("20610");
    expect(result.suppressed_codes[0].suppressed_by_rule).toBe("R-3.1.2");
  });

  // =========================================================================
  // Test 5: R-3.1.3 warn — cast + fracture (ACC02-011)
  // =========================================================================
  it("5. triggers R-3.1.3 warn for cast/splint + fracture care (ACC02-011)", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["27752", "29515"],
      modifiers_present: {},
    });
    const result = validatePtp(input);

    const r313 = result.rule_evaluations.find((re) => re.rule_id === "R-3.1.3");
    expect(r313).toBeDefined();
    expect(r313!.trigger_matched).toBe(true);
    expect(r313!.action_type).toBe("warn");
    expect(r313!.severity).toBe("Medium");
    expect(r313!.suppressed_code).toBeNull();

    // No suppression for warn rules
    expect(result.suppressed_codes).toHaveLength(0);
    // Should produce a warning
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].rule_id).toBe("R-3.1.3");
    expect(result.warnings[0].type).toBe("warning");
  });

  // =========================================================================
  // Test 6: R-3.1.4 block — diagnostic + surgical scope (ACC02-015)
  // =========================================================================
  it("6. triggers R-3.1.4 block for diagnostic + surgical arthroscopy (ACC02-015)", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["29870", "29881"],
      modifiers_present: {},
    });
    const result = validatePtp(input);

    const r314 = result.rule_evaluations.find((re) => re.rule_id === "R-3.1.4");
    expect(r314).toBeDefined();
    expect(r314!.trigger_matched).toBe(true);
    expect(r314!.action_type).toBe("block");
    expect(r314!.severity).toBe("Critical");

    expect(result.suppressed_codes.some((sc) => sc.cpt_code === "29870")).toBe(true);
  });

  // =========================================================================
  // Test 7: Multiple simultaneous conflicts
  // =========================================================================
  it("7. detects multiple simultaneous PTP conflicts", () => {
    // Submit codes that trigger both R-3.1.1 and R-3.1.4
    // 27447 (TKA) + 29881 (meniscectomy) + 29870 (diagnostic scope) — all right knee
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["27447", "29881", "29870"],
      modifiers_present: {},
    });
    const result = validatePtp(input);

    const triggeredRules = result.rule_evaluations.filter((re) => re.trigger_matched);
    expect(triggeredRules.length).toBeGreaterThanOrEqual(2);

    const ruleIds = triggeredRules.map((re) => re.rule_id);
    expect(ruleIds).toContain("R-3.1.1");
    expect(ruleIds).toContain("R-3.1.4");
  });

  // =========================================================================
  // Test 8: Suppressed code cross-reference
  // =========================================================================
  it("8. suppressed_by_rule matches the triggered rule", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["29881", "27447"],
      modifiers_present: {},
    });
    const result = validatePtp(input);

    for (const sc of result.suppressed_codes) {
      const matchingRule = result.rule_evaluations.find(
        (re) => re.rule_id === sc.suppressed_by_rule
      );
      expect(matchingRule).toBeDefined();
      expect(matchingRule!.trigger_matched).toBe(true);
    }
  });

  // =========================================================================
  // Test 9: ACC-03 semantic validation
  // =========================================================================
  it("9. produces output that passes ACC-03 validateCodingOutput()", () => {
    // Trigger R-3.1.1
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["29881", "27447"],
      modifiers_present: {},
    });
    const ptpResult = validatePtp(input);
    const fullOutput = buildTestCodingOutput(ptpResult);

    const validation = validateCodingOutput(fullOutput);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  // =========================================================================
  // Test 10: Laterality not_specified = same joint (conservative)
  // =========================================================================
  it("10. treats not_specified laterality as same joint (conservative)", () => {
    const input = makeInput({
      laterality: "not_specified",
      cpt_codes_submitted: ["29881", "27447"],
      modifiers_present: {},
    });
    const result = validatePtp(input);

    const r311 = result.rule_evaluations.find((re) => re.rule_id === "R-3.1.1");
    expect(r311!.trigger_matched).toBe(true);
  });

  // =========================================================================
  // Test 11: R-3.1.3 ignores laterality
  // =========================================================================
  it("11. R-3.1.3 fires regardless of laterality", () => {
    // Even with opposite sides, cast/fracture warn should fire
    const input = makeInput({
      laterality: "bilateral",
      cpt_codes_submitted: ["27752", "29515"],
      modifiers_present: { "27752": ["-RT"], "29515": ["-LT"] },
    });
    const result = validatePtp(input);

    const r313 = result.rule_evaluations.find((re) => re.rule_id === "R-3.1.3");
    expect(r313!.trigger_matched).toBe(true);
  });

  // =========================================================================
  // Test 12: getCodeLaterality unit tests
  // =========================================================================
  it("12. getCodeLaterality resolves per-code modifier over top-level", () => {
    const input = makeInput({
      laterality: "left",
      cpt_codes_submitted: ["29881", "27447"],
      modifiers_present: { "29881": ["-RT"] },
    });

    // Code with -RT modifier overrides top-level "left"
    expect(getCodeLaterality("29881", input)).toBe("right");
    // Code without modifier falls back to top-level
    expect(getCodeLaterality("27447", input)).toBe("left");

    // -50 modifier → bilateral
    const input2 = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["29881"],
      modifiers_present: { "29881": ["-50"] },
    });
    expect(getCodeLaterality("29881", input2)).toBe("bilateral");
  });

  // =========================================================================
  // Test 13: isSameJoint unit tests
  // =========================================================================
  it("13. isSameJoint matrix: R+R=T, R+L=F, bilateral+any=T, not_specified+any=T", () => {
    // Same side
    expect(isSameJoint("right", "right")).toBe(true);
    expect(isSameJoint("left", "left")).toBe(true);

    // Different sides
    expect(isSameJoint("right", "left")).toBe(false);
    expect(isSameJoint("left", "right")).toBe(false);

    // Bilateral = always same
    expect(isSameJoint("bilateral", "right")).toBe(true);
    expect(isSameJoint("bilateral", "left")).toBe(true);
    expect(isSameJoint("right", "bilateral")).toBe(true);
    expect(isSameJoint("bilateral", "bilateral")).toBe(true);

    // Not specified = conservative, same
    expect(isSameJoint("not_specified", "right")).toBe(true);
    expect(isSameJoint("not_specified", "left")).toBe(true);
    expect(isSameJoint("right", "not_specified")).toBe(true);
    expect(isSameJoint("not_specified", "not_specified")).toBe(true);
  });

  // =========================================================================
  // Test 14: ACC-02 structured_fields adapter (ACC02-001)
  // =========================================================================
  it("14. accepts full ACC-02 structured_fields via adapter (ACC02-001)", () => {
    const structuredFields = {
      laterality: "right",
      patient_type: "established",
      setting: "outpatient",
      payer_type: "commercial",
      global_period_status: "none",
      global_period_surgery_date: null,
      global_period_surgery_cpt: null,
      units_of_service: { "27447": 1, "29881": 1 },
      modifiers_present: {},
      cpt_codes_submitted: ["29881", "27447"],
      icd10_codes: ["M17.11"],
      physician_id: "PHY-001",
    };

    const input = fromStructuredFields(structuredFields);
    const result = validatePtp(input);

    const r311 = result.rule_evaluations.find((re) => re.rule_id === "R-3.1.1");
    expect(r311).toBeDefined();
    expect(r311!.trigger_matched).toBe(true);
    expect(r311!.suppressed_code).toBe("29881");
    expect(result.suppressed_codes).toHaveLength(1);
    expect(result.suppressed_codes[0].cpt_code).toBe("29881");
  });
});
