import { describe, it, expect } from "vitest";
import {
  validateDocumentation,
  fromStructuredFields,
  getEffectiveLaterality,
  type DocumentationValidatorInput,
} from "@/validators/documentationValidator";
import { buildTestCodingOutput } from "@/utils/applyDocumentationValidation";
import { validateCodingOutput } from "@/utils/validateCodingOutput";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<DocumentationValidatorInput> = {}): DocumentationValidatorInput {
  return {
    laterality: "right",
    payer_type: "commercial",
    cpt_codes_submitted: [],
    modifiers_present: {},
    icd10_codes: ["M17.11"],
    setting: "office",
    diagnosis_text: null,
    anatomic_site: "right medial knee joint",
    approach: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Documentation Sufficiency Validator — ACC-08", () => {
  // =========================================================================
  // Test 1: R-3.5.1 block — missing laterality (ACC02-065 pattern)
  // =========================================================================
  it("1. blocks when laterality is missing for procedure code (R-3.5.1)", () => {
    const input = makeInput({
      laterality: "not_specified",
      cpt_codes_submitted: ["29881"],
      modifiers_present: {},
      icd10_codes: ["M23.20"],
      anatomic_site: "right knee medial compartment",
    });
    const result = validateDocumentation(input);

    const r351 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.1");
    expect(r351).toBeDefined();
    expect(r351!.trigger_matched).toBe(true);
    expect(r351!.action_type).toBe("block");
    expect(r351!.severity).toBe("Critical");
    expect(r351!.missing_info_keys).toContain("laterality");
    expect(r351!.policy_anchor).toBe("CMS-1500 guidelines, CPT laterality modifier requirements");

    const latFindings = result.documentation_findings.filter((f) => f.rule_id === "R-3.5.1");
    expect(latFindings).toHaveLength(1);
    expect(latFindings[0].cpt_code).toBe("29881");
    expect(latFindings[0].status).toBe("insufficient");
    expect(latFindings[0].missing_info_keys).toContain("laterality");

    expect(result.missing_information).toContain("Specify laterality: left, right, or bilateral");
  });

  // =========================================================================
  // Test 2: R-3.5.1 pass — laterality from modifier
  // =========================================================================
  it("2. passes when laterality is derived from modifier (R-3.5.1)", () => {
    const input = makeInput({
      laterality: "not_specified",
      cpt_codes_submitted: ["27447"],
      modifiers_present: { "27447": ["-RT"] },
      anatomic_site: "right knee",
    });
    const result = validateDocumentation(input);

    const r351 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.1");
    expect(r351!.trigger_matched).toBe(false);

    expect(getEffectiveLaterality(input)).toBe("right");
  });

  // =========================================================================
  // Test 3: R-3.5.1 pass — laterality from field
  // =========================================================================
  it("3. passes when laterality is specified in field (R-3.5.1)", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["20610"],
      modifiers_present: {},
      anatomic_site: "right medial knee joint",
    });
    const result = validateDocumentation(input);

    const r351 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.1");
    expect(r351!.trigger_matched).toBe(false);
  });

  // =========================================================================
  // Test 4: R-3.5.1 skip — E/M code does not require laterality
  // =========================================================================
  it("4. does not trigger R-3.5.1 for E/M codes", () => {
    const input = makeInput({
      laterality: "not_specified",
      cpt_codes_submitted: ["99214"],
      modifiers_present: {},
    });
    const result = validateDocumentation(input);

    const r351 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.1");
    expect(r351!.trigger_matched).toBe(false);

    const latFindings = result.documentation_findings.filter((f) => f.rule_id === "R-3.5.1");
    expect(latFindings).toHaveLength(0);
  });

  // =========================================================================
  // Test 5: R-3.5.2 block — right TKA with left ICD-10 (ACC02-070)
  // =========================================================================
  it("5. blocks on ICD-10 laterality mismatch: right CPT vs left ICD-10 (R-3.5.2)", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["27447"],
      modifiers_present: { "27447": ["-RT"] },
      icd10_codes: ["M17.12"],
      anatomic_site: "right knee",
    });
    const result = validateDocumentation(input);

    const r352 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.2");
    expect(r352).toBeDefined();
    expect(r352!.trigger_matched).toBe(true);
    expect(r352!.action_type).toBe("block");
    expect(r352!.severity).toBe("Critical");

    const mismatchFindings = result.documentation_findings.filter((f) => f.rule_id === "R-3.5.2");
    expect(mismatchFindings).toHaveLength(1);
    expect(mismatchFindings[0].cpt_code).toBe("M17.12");
    expect(mismatchFindings[0].status).toBe("insufficient");
    expect(mismatchFindings[0].prompt_text).toContain("M17.12");
    expect(mismatchFindings[0].prompt_text).toContain("left");
    expect(mismatchFindings[0].prompt_text).toContain("right");
  });

  // =========================================================================
  // Test 6: R-3.5.2 block — left injection with right ICD-10 (ACC02-071)
  // =========================================================================
  it("6. blocks on left CPT vs right ICD-10 mismatch (R-3.5.2)", () => {
    const input = makeInput({
      laterality: "left",
      cpt_codes_submitted: ["20610"],
      modifiers_present: { "20610": ["-LT"] },
      icd10_codes: ["M75.111"],
      anatomic_site: "left shoulder subacromial bursa",
    });
    const result = validateDocumentation(input);

    const r352 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.2");
    expect(r352!.trigger_matched).toBe(true);

    expect(result.documentation_findings.find((f) => f.rule_id === "R-3.5.2")!.prompt_text).toContain(
      "M75.111"
    );
  });

  // =========================================================================
  // Test 7: R-3.5.2 pass — matching laterality
  // =========================================================================
  it("7. passes when ICD-10 laterality matches CPT laterality (R-3.5.2)", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["27447"],
      modifiers_present: { "27447": ["-RT"] },
      icd10_codes: ["M17.11"],
      anatomic_site: "right knee",
    });
    const result = validateDocumentation(input);

    const r352 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.2");
    expect(r352!.trigger_matched).toBe(false);

    expect(result.documentation_findings.filter((f) => f.rule_id === "R-3.5.2")).toHaveLength(0);
  });

  // =========================================================================
  // Test 8: R-3.5.2 skip — ICD-10 not in lookup table
  // =========================================================================
  it("8. skips R-3.5.2 for ICD-10 not in lookup table and emits warning", () => {
    const input = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["27447"],
      modifiers_present: { "27447": ["-RT"] },
      icd10_codes: ["M99.99"],
      anatomic_site: "right knee",
    });
    const result = validateDocumentation(input);

    const r352 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.2");
    expect(r352!.trigger_matched).toBe(false);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].rule_id).toBe("R-3.5.2");
    expect(result.warnings[0].message).toContain("M99.99");
    expect(result.warnings[0].message).toContain("not in laterality reference");
  });

  // =========================================================================
  // Test 9: R-3.5.3 warn — fracture code without approach (ACC02-074)
  // =========================================================================
  it("9. warns for fracture code without approach (R-3.5.3)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["25600"],
      modifiers_present: { "25600": ["-RT"] },
      icd10_codes: ["S52.501A"],
      approach: null,
      anatomic_site: "right distal radius",
    });
    const result = validateDocumentation(input);

    const r353 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.3");
    expect(r353).toBeDefined();
    expect(r353!.trigger_matched).toBe(true);
    expect(r353!.action_type).toBe("warn");
    expect(r353!.severity).toBe("Medium");
    expect(r353!.missing_info_keys).toContain("approach");

    const approachFindings = result.documentation_findings.filter((f) => f.rule_id === "R-3.5.3");
    expect(approachFindings).toHaveLength(1);
    expect(approachFindings[0].cpt_code).toBe("25600");
    expect(approachFindings[0].status).toBe("insufficient");

    expect(result.missing_information).toContain(
      "Specify fracture treatment approach: closed, closed with manipulation, open, or percutaneous"
    );
  });

  // =========================================================================
  // Test 10: R-3.5.3 pass — fracture code with approach
  // =========================================================================
  it("10. does not trigger R-3.5.3 when approach is provided", () => {
    const input = makeInput({
      cpt_codes_submitted: ["25600"],
      modifiers_present: { "25600": ["-RT"] },
      icd10_codes: ["S52.501A"],
      approach: "closed",
      anatomic_site: "right distal radius",
    });
    const result = validateDocumentation(input);

    const r353 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.3");
    expect(r353!.trigger_matched).toBe(false);
  });

  // =========================================================================
  // Test 11: R-3.5.3 skip — non-fracture code
  // =========================================================================
  it("11. does not trigger R-3.5.3 for non-fracture codes", () => {
    const input = makeInput({
      cpt_codes_submitted: ["27447"],
      modifiers_present: { "27447": ["-RT"] },
      approach: null,
      anatomic_site: "right knee",
    });
    const result = validateDocumentation(input);

    const r353 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.3");
    expect(r353!.trigger_matched).toBe(false);

    expect(result.documentation_findings.filter((f) => f.rule_id === "R-3.5.3")).toHaveLength(0);
  });

  // =========================================================================
  // Test 12: R-3.5.4 block — "rule out" in outpatient (ACC02-078)
  // =========================================================================
  it("12. blocks outpatient rule-out diagnosis (R-3.5.4)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214"],
      icd10_codes: ["M23.211"],
      setting: "office",
      diagnosis_text: "Assessed to rule out medial meniscal tear",
    });
    const result = validateDocumentation(input);

    const r354 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.4");
    expect(r354).toBeDefined();
    expect(r354!.trigger_matched).toBe(true);
    expect(r354!.action_type).toBe("block");
    expect(r354!.severity).toBe("High");
    expect(r354!.missing_info_keys).toContain("confirmed_diagnosis");

    const dxFindings = result.documentation_findings.filter((f) => f.rule_id === "R-3.5.4");
    expect(dxFindings).toHaveLength(1);
    expect(dxFindings[0].status).toBe("insufficient");
    expect(dxFindings[0].missing_info_keys).toContain("confirmed_diagnosis");

    expect(result.missing_information).toContain(
      "Outpatient setting requires confirmed diagnosis — replace rule-out language with confirmed condition or presenting symptom code"
    );
  });

  // =========================================================================
  // Test 13: R-3.5.4 pass — inpatient exempt
  // =========================================================================
  it("13. does not trigger R-3.5.4 for inpatient setting", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214"],
      setting: "inpatient",
      diagnosis_text: "Suspected fracture",
    });
    const result = validateDocumentation(input);

    const r354 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.4");
    expect(r354!.trigger_matched).toBe(false);

    // No findings for R-3.5.4 in inpatient
    expect(result.documentation_findings.filter((f) => f.rule_id === "R-3.5.4")).toHaveLength(0);
  });

  // =========================================================================
  // Test 14: R-3.5.4 skip — null diagnosis_text
  // =========================================================================
  it("14. does not trigger R-3.5.4 when diagnosis_text is null (finding status=unknown)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["99214"],
      setting: "office",
      diagnosis_text: null,
    });
    const result = validateDocumentation(input);

    const r354 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.4");
    expect(r354!.trigger_matched).toBe(false);

    const dxFindings = result.documentation_findings.filter((f) => f.rule_id === "R-3.5.4");
    expect(dxFindings).toHaveLength(1);
    expect(dxFindings[0].status).toBe("unknown");
  });

  // =========================================================================
  // Test 15: R-3.5.5 warn — null anatomic_site (ACC02-082 pattern)
  // =========================================================================
  it("15. warns when anatomic_site is null for procedure code (R-3.5.5)", () => {
    const input = makeInput({
      cpt_codes_submitted: ["20610"],
      modifiers_present: { "20610": ["-RT"] },
      anatomic_site: null,
    });
    const result = validateDocumentation(input);

    const r355 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.5");
    expect(r355).toBeDefined();
    expect(r355!.trigger_matched).toBe(true);
    expect(r355!.action_type).toBe("warn");
    expect(r355!.severity).toBe("Medium");
    expect(r355!.missing_info_keys).toContain("anatomic_site");

    const siteFindings = result.documentation_findings.filter((f) => f.rule_id === "R-3.5.5");
    expect(siteFindings).toHaveLength(1);
    expect(siteFindings[0].cpt_code).toBe("20610");
    expect(siteFindings[0].status).toBe("insufficient");

    expect(result.missing_information).toContain(
      "Specify anatomic site with sufficient detail for code selection"
    );
  });

  // =========================================================================
  // Test 16: R-3.5.5 pass — specific anatomic_site
  // =========================================================================
  it("16. does not trigger R-3.5.5 when anatomic_site is specific", () => {
    const input = makeInput({
      cpt_codes_submitted: ["20610"],
      modifiers_present: { "20610": ["-RT"] },
      anatomic_site: "right medial knee joint",
    });
    const result = validateDocumentation(input);

    const r355 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.5");
    expect(r355!.trigger_matched).toBe(false);
  });

  // =========================================================================
  // Test 17: Triple trigger — R-3.5.1 + R-3.5.3 + R-3.5.5 (ACC02-083)
  // =========================================================================
  it("17. triggers R-3.5.1 + R-3.5.3 + R-3.5.5 for fracture with no laterality/approach/site", () => {
    const input = makeInput({
      laterality: "not_specified",
      cpt_codes_submitted: ["25600"],
      modifiers_present: {},
      icd10_codes: ["T14.8"],
      setting: "inpatient",
      approach: null,
      anatomic_site: null,
    });
    const result = validateDocumentation(input);

    const r351 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.1");
    const r353 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.3");
    const r355 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.5");
    expect(r351!.trigger_matched).toBe(true);
    expect(r353!.trigger_matched).toBe(true);
    expect(r355!.trigger_matched).toBe(true);

    // R-3.5.2 skipped (no CPT-side laterality) and R-3.5.4 depends on setting
    const r352 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.2");
    expect(r352!.trigger_matched).toBe(false);

    // 3 findings — one per rule for CPT 25600
    const ruleIds = result.documentation_findings
      .filter((f) => f.cpt_code === "25600")
      .map((f) => f.rule_id)
      .sort();
    expect(ruleIds).toEqual(["R-3.5.1", "R-3.5.3", "R-3.5.5"]);

    // All 3 missing info types present
    const allMissingKeys = result.documentation_findings.flatMap((f) => f.missing_info_keys);
    expect(allMissingKeys).toContain("laterality");
    expect(allMissingKeys).toContain("approach");
    expect(allMissingKeys).toContain("anatomic_site");
  });

  // =========================================================================
  // Test 18: R-3.5.1 + R-3.5.2 don't both trigger
  // =========================================================================
  it("18. R-3.5.1 fires but R-3.5.2 skips when laterality is not_specified", () => {
    const input = makeInput({
      laterality: "not_specified",
      cpt_codes_submitted: ["27447"],
      modifiers_present: {},
      icd10_codes: ["M17.12"],
      anatomic_site: "knee",
    });
    const result = validateDocumentation(input);

    // R-3.5.1: laterality not_specified → triggers
    const r351 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.1");
    expect(r351!.trigger_matched).toBe(true);

    // R-3.5.2: effectiveLat is "not_specified" → skips entirely
    const r352 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.2");
    expect(r352!.trigger_matched).toBe(false);

    // No mismatch findings
    expect(result.documentation_findings.filter((f) => f.rule_id === "R-3.5.2")).toHaveLength(0);
  });

  // =========================================================================
  // Test 19: Adapter — maps ACC-02 structured_fields correctly
  // =========================================================================
  it("19. adapter maps ACC-02 structured_fields with conservative defaults", () => {
    const structuredFields = {
      laterality: "not_specified",
      patient_type: "established",
      setting: "ASC",
      payer_type: "not_specified",
      global_period_status: "none",
      global_period_surgery_date: null,
      global_period_surgery_cpt: null,
      units_of_service: { "29881": 1 },
      modifiers_present: {},
      cpt_codes_submitted: ["29881"],
      icd10_codes: ["M23.20"],
      physician_id: "PHY-001",
    };

    const input = fromStructuredFields(structuredFields);

    // Verify defaults
    expect(input.laterality).toBe("not_specified");
    expect(input.payer_type).toBe("unknown");
    expect(input.setting).toBe("ASC");
    expect(input.diagnosis_text).toBeNull();
    expect(input.anatomic_site).toBeNull();
    expect(input.approach).toBeNull();

    // Should trigger R-3.5.1 (missing laterality)
    const result = validateDocumentation(input);
    const r351 = result.rule_evaluations.find((re) => re.rule_id === "R-3.5.1");
    expect(r351!.trigger_matched).toBe(true);
  });

  // =========================================================================
  // Test 20: ACC-03 compliance — block + warn both valid via validateCodingOutput
  // =========================================================================
  it("20. produces output that passes ACC-03 validateCodingOutput()", () => {
    // --- Block scenario: R-3.5.1 (missing laterality) ---
    const blockInput = makeInput({
      laterality: "not_specified",
      cpt_codes_submitted: ["29881"],
      modifiers_present: {},
      anatomic_site: "right knee medial compartment",
    });
    const blockResult = validateDocumentation(blockInput);
    const blockOutput = buildTestCodingOutput(blockResult, { payer_type: "commercial" });

    expect(blockOutput.clean_claim_ready).toBe(false);
    expect(blockOutput.confidence).toBe("low");
    expect(blockOutput.force_review_pending).toBe(false);

    const blockValidation = validateCodingOutput(blockOutput);
    expect(blockValidation.valid).toBe(true);
    expect(blockValidation.errors).toHaveLength(0);

    // --- Warn-only scenario: R-3.5.3 (missing approach) ---
    const warnInput = makeInput({
      laterality: "right",
      cpt_codes_submitted: ["25600"],
      modifiers_present: { "25600": ["-RT"] },
      icd10_codes: ["S52.501A"],
      approach: null,
      anatomic_site: "right distal radius",
    });
    const warnResult = validateDocumentation(warnInput);
    const warnOutput = buildTestCodingOutput(warnResult, { payer_type: "commercial" });

    expect(warnOutput.clean_claim_ready).toBe(true);
    expect(warnOutput.confidence).toBe("high");
    expect(warnOutput.force_review_pending).toBe(false);

    const warnValidation = validateCodingOutput(warnOutput);
    expect(warnValidation.valid).toBe(true);
    expect(warnValidation.errors).toHaveLength(0);
  });
});
