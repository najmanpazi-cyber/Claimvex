// ACC-08: Documentation Sufficiency Validator
// Deterministic, stateless validator for documentation sufficiency rules.
// Covers ACC-01 rules R-3.5.1 (block), R-3.5.2 (block), R-3.5.3 (warn),
// R-3.5.4 (block), R-3.5.5 (warn).

import type {
  RuleId,
  RuleEvaluation,
  SuppressedCode,
  DeterministicWarning,
  ForceReviewItem,
  SeverityTier,
} from "@/types/ruleEngine";
import { RULE_DOMAIN_MAP, RULE_ACTION_MAP } from "@/utils/validateRuleEvaluation";
import documentationData from "@/data/documentation/documentation.rules.orthopedics.v1.json";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export type Laterality = "left" | "right" | "bilateral" | "not_specified";
export type PayerType = "commercial" | "medicare" | "unknown";
export type Setting = "office" | "outpatient" | "ASC" | "inpatient";

export interface DocumentationValidatorInput {
  laterality: Laterality;
  payer_type: PayerType;
  cpt_codes_submitted: string[];
  modifiers_present: Record<string, string[]>;
  icd10_codes: string[];
  setting: Setting;
  diagnosis_text: string | null;
  anatomic_site: string | null;
  approach: string | null;
}

export interface DocumentationFinding {
  cpt_code: string;
  rule_id: string;
  check_type: "laterality" | "icd_laterality_match" | "approach" | "rule_out_dx" | "anatomic_specificity";
  required: boolean;
  present: boolean;
  status: "sufficient" | "insufficient" | "unknown";
  missing_info_keys: string[];
  prompt_text: string | null;
}

export interface DocumentationValidationResult {
  rule_evaluations: RuleEvaluation[];
  suppressed_codes: SuppressedCode[];
  warnings: DeterministicWarning[];
  force_review_items: ForceReviewItem[];
  documentation_findings: DocumentationFinding[];
  missing_information: string[];
}

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

interface DocumentationRuleConfig {
  rule_id: string;
  description: string;
  action: string;
  severity: string;
  domain: string;
  missing_info_keys: string[];
  prompt_template: string;
  policy_anchor: string;
  laterality_modifiers?: string[];
  em_code_ranges?: { start: string; end: string }[];
  outpatient_settings?: string[];
}

const rules = documentationData.rules as DocumentationRuleConfig[];
const icd10LateralityTable = documentationData.icd10_laterality_table as Record<string, string>;
const fractureCptCodes = new Set(documentationData.fracture_cpt_codes as string[]);
const ruleOutKeywords = documentationData.rule_out_keywords as string[];
const injectionMinorCodes = new Set(documentationData.injection_minor_procedure_codes as string[]);
const genericSitePatterns = (documentationData.generic_site_patterns as string[]).map(
  (p) => new RegExp(p, "i")
);

const DOC_RULE_IDS: RuleId[] = ["R-3.5.1", "R-3.5.2", "R-3.5.3", "R-3.5.4", "R-3.5.5"];

const SEVERITY_MAP: Record<string, SeverityTier> = {
  "R-3.5.1": "Critical",
  "R-3.5.2": "Critical",
  "R-3.5.3": "Medium",
  "R-3.5.4": "High",
  "R-3.5.5": "Medium",
};

const USER_MESSAGES: Record<string, string> = {
  "R-3.5.1": "Laterality (left, right, or bilateral) is required for this procedure. Claims without laterality modifiers (-LT, -RT, or -50) will be denied.",
  "R-3.5.2": "ICD-10 laterality does not match the CPT modifier. Correct laterality before submission.",
  "R-3.5.3": "Fracture care coding requires the treatment approach (closed, closed with manipulation, open/ORIF, percutaneous). Document the approach to confirm code selection.",
  "R-3.5.4": "Outpatient coding rules prohibit rule-out/suspected diagnoses. Code the confirmed condition or the presenting sign/symptom instead.",
  "R-3.5.5": "Documentation should specify the exact anatomic site for accurate code selection.",
};

const POLICY_ANCHORS: Record<string, string> = {};
for (const rule of rules) {
  POLICY_ANCHORS[rule.rule_id] = rule.policy_anchor;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isEmCode(code: string): boolean {
  const num = parseInt(code, 10);
  if (isNaN(num)) return false;
  const rule351 = rules.find((r) => r.rule_id === "R-3.5.1");
  if (!rule351?.em_code_ranges) return false;
  for (const range of rule351.em_code_ranges) {
    if (num >= parseInt(range.start, 10) && num <= parseInt(range.end, 10)) return true;
  }
  return false;
}

function normalizeModifier(mod: string): string {
  return mod.replace(/^-/, "").toUpperCase();
}

export function getEffectiveLaterality(input: DocumentationValidatorInput): Laterality {
  if (input.laterality !== "not_specified") return input.laterality;

  // Scan all modifiers for laterality
  for (const mods of Object.values(input.modifiers_present)) {
    for (const mod of mods) {
      const normalized = normalizeModifier(mod);
      if (normalized === "RT") return "right";
      if (normalized === "LT") return "left";
      if (normalized === "50") return "bilateral";
    }
  }

  return "not_specified";
}

type IcdLaterality = "left" | "right" | "bilateral" | "unspecified" | "not_applicable";

function getIcd10Laterality(code: string): { laterality: IcdLaterality; inTable: boolean } {
  const entry = icd10LateralityTable[code];
  if (!entry) return { laterality: "unspecified", inTable: false };
  return { laterality: entry as IcdLaterality, inTable: true };
}

function isOutpatientSetting(setting: string): boolean {
  const rule354 = rules.find((r) => r.rule_id === "R-3.5.4");
  if (!rule354?.outpatient_settings) return false;
  return rule354.outpatient_settings.includes(setting);
}

function findRuleOutKeyword(text: string): string | null {
  for (const keyword of ruleOutKeywords) {
    // Escape special regex characters in keyword, then apply word-boundary match
    const escaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text)) return keyword;
  }
  return null;
}

function isGenericSite(site: string): boolean {
  return genericSitePatterns.some((p) => p.test(site.trim()));
}

// ---------------------------------------------------------------------------
// ACC-02 structured_fields adapter
// ---------------------------------------------------------------------------

export function fromStructuredFields(sf: {
  laterality: string;
  payer_type: string;
  cpt_codes_submitted: string[];
  modifiers_present: Record<string, string[]>;
  icd10_codes: string[];
  setting: string;
  patient_type?: string;
  physician_id?: string;
  diagnosis_text?: string | null;
  anatomic_site?: string | null;
  approach?: string | null;
  [key: string]: unknown;
}): DocumentationValidatorInput {
  const validLateralities: Laterality[] = ["left", "right", "bilateral", "not_specified"];
  const laterality = validLateralities.includes(sf.laterality as Laterality)
    ? (sf.laterality as Laterality)
    : "not_specified";

  const payer_type =
    sf.payer_type === "commercial" || sf.payer_type === "medicare"
      ? (sf.payer_type as PayerType)
      : "unknown";

  const validSettings: Setting[] = ["office", "outpatient", "ASC", "inpatient"];
  const setting = validSettings.includes(sf.setting as Setting)
    ? (sf.setting as Setting)
    : "office";

  return {
    laterality,
    payer_type,
    cpt_codes_submitted: sf.cpt_codes_submitted,
    modifiers_present: sf.modifiers_present,
    icd10_codes: sf.icd10_codes,
    setting,
    diagnosis_text: sf.diagnosis_text ?? null,
    anatomic_site: sf.anatomic_site ?? null,
    approach: sf.approach ?? null,
  };
}

// ---------------------------------------------------------------------------
// Rule evaluation builders
// ---------------------------------------------------------------------------

function buildTriggeredEvaluation(
  ruleId: RuleId,
  evidenceFields: string[],
  missingInfoKeys: string[],
): RuleEvaluation {
  return {
    rule_id: ruleId,
    domain: RULE_DOMAIN_MAP[ruleId],
    action_type: RULE_ACTION_MAP[ruleId],
    severity: SEVERITY_MAP[ruleId],
    trigger_matched: true,
    message_user: USER_MESSAGES[ruleId],
    message_internal: rules.find((r) => r.rule_id === ruleId)!.description,
    evidence_fields: evidenceFields,
    missing_info_keys: missingInfoKeys,
    payer_note: null,
    suppressed_code: null,
    payer_context: null,
    policy_anchor: POLICY_ANCHORS[ruleId],
  };
}

function buildPassEvaluation(ruleId: RuleId): RuleEvaluation {
  return {
    rule_id: ruleId,
    domain: RULE_DOMAIN_MAP[ruleId],
    action_type: RULE_ACTION_MAP[ruleId],
    severity: SEVERITY_MAP[ruleId],
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

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function validateDocumentation(input: DocumentationValidatorInput): DocumentationValidationResult {
  const findings: DocumentationFinding[] = [];
  const warnings: DeterministicWarning[] = [];
  const missingInformation: string[] = [];

  const effectiveLat = getEffectiveLaterality(input);

  // Track rule triggers
  let trigger351 = false;
  let trigger352 = false;
  let trigger353 = false;
  let trigger354 = false;
  let trigger355 = false;

  const evidence351: string[] = [];
  const evidence352: string[] = [];
  const evidence353: string[] = [];
  const evidence354: string[] = [];
  const evidence355: string[] = [];

  const ruleConfig351 = rules.find((r) => r.rule_id === "R-3.5.1")!;
  const ruleConfig353 = rules.find((r) => r.rule_id === "R-3.5.3")!;
  const ruleConfig354 = rules.find((r) => r.rule_id === "R-3.5.4")!;
  const ruleConfig355 = rules.find((r) => r.rule_id === "R-3.5.5")!;

  // --- R-3.5.1: Missing Laterality ---
  for (const code of input.cpt_codes_submitted) {
    if (isEmCode(code)) continue;

    if (effectiveLat === "not_specified") {
      trigger351 = true;
      evidence351.push(`CPT ${code} requires laterality but laterality is "not_specified"`);
      if (evidence351.length === 1) {
        evidence351.push("No laterality modifier (-LT, -RT, -50) found on any submitted code");
      }

      findings.push({
        cpt_code: code,
        rule_id: "R-3.5.1",
        check_type: "laterality",
        required: true,
        present: false,
        status: "insufficient",
        missing_info_keys: ["laterality"],
        prompt_text: ruleConfig351.prompt_template,
      });
    }
  }

  if (trigger351 && !missingInformation.includes(ruleConfig351.prompt_template)) {
    missingInformation.push(ruleConfig351.prompt_template);
  }

  // --- R-3.5.2: ICD-10 Laterality Mismatch ---
  if (effectiveLat !== "not_specified") {
    const ruleConfig352 = rules.find((r) => r.rule_id === "R-3.5.2")!;

    for (const icdCode of input.icd10_codes) {
      const { laterality: icdLat, inTable } = getIcd10Laterality(icdCode);

      if (!inTable) {
        warnings.push({
          type: "info",
          rule_id: "R-3.5.2",
          message: `ICD-10 ${icdCode} not in laterality reference — skipping mismatch check`,
          code_context: icdCode,
        });
        continue;
      }

      if (icdLat === "not_applicable" || icdLat === "unspecified") continue;
      if (icdLat === "bilateral") continue;
      if (effectiveLat === "bilateral") continue;

      if (icdLat !== effectiveLat) {
        trigger352 = true;
        const promptText = ruleConfig352.prompt_template
          .replace("{icd_code}", icdCode)
          .replace("{icd_laterality}", icdLat)
          .replace("{cpt_laterality}", effectiveLat);

        evidence352.push(
          `ICD-10 ${icdCode} laterality="${icdLat}" contradicts CPT laterality="${effectiveLat}"`
        );

        findings.push({
          cpt_code: icdCode,
          rule_id: "R-3.5.2",
          check_type: "icd_laterality_match",
          required: true,
          present: false,
          status: "insufficient",
          missing_info_keys: [],
          prompt_text: promptText,
        });

        if (!missingInformation.includes(promptText)) {
          missingInformation.push(promptText);
        }
      }
    }
  }

  // --- R-3.5.3: Missing Approach for Fracture Care ---
  for (const code of input.cpt_codes_submitted) {
    if (!fractureCptCodes.has(code)) continue;

    if (input.approach === null) {
      trigger353 = true;
      evidence353.push(`Fracture CPT ${code} submitted without approach specification`);

      findings.push({
        cpt_code: code,
        rule_id: "R-3.5.3",
        check_type: "approach",
        required: true,
        present: false,
        status: "insufficient",
        missing_info_keys: ["approach"],
        prompt_text: ruleConfig353.prompt_template,
      });
    }
  }

  if (trigger353 && !missingInformation.includes(ruleConfig353.prompt_template)) {
    missingInformation.push(ruleConfig353.prompt_template);
  }

  // --- R-3.5.4: Outpatient Rule-Out / Probable / Suspected Diagnosis ---
  if (isOutpatientSetting(input.setting)) {
    if (input.diagnosis_text !== null) {
      const matchedKeyword = findRuleOutKeyword(input.diagnosis_text);
      if (matchedKeyword !== null) {
        trigger354 = true;
        evidence354.push(`diagnosis_text contains rule-out keyword "${matchedKeyword}"`);
        evidence354.push(`setting="${input.setting}" is outpatient-equivalent`);

        findings.push({
          cpt_code: input.cpt_codes_submitted[0] ?? "N/A",
          rule_id: "R-3.5.4",
          check_type: "rule_out_dx",
          required: true,
          present: false,
          status: "insufficient",
          missing_info_keys: ["confirmed_diagnosis"],
          prompt_text: ruleConfig354.prompt_template,
        });

        if (!missingInformation.includes(ruleConfig354.prompt_template)) {
          missingInformation.push(ruleConfig354.prompt_template);
        }
      }
    } else {
      // diagnosis_text is null — can't evaluate
      findings.push({
        cpt_code: input.cpt_codes_submitted[0] ?? "N/A",
        rule_id: "R-3.5.4",
        check_type: "rule_out_dx",
        required: true,
        present: false,
        status: "unknown",
        missing_info_keys: [],
        prompt_text: null,
      });
    }
  }

  // --- R-3.5.5: Missing Anatomic Specificity ---
  for (const code of input.cpt_codes_submitted) {
    if (isEmCode(code)) continue;

    if (input.anatomic_site === null) {
      trigger355 = true;
      evidence355.push(`CPT ${code} requires anatomic specificity but anatomic_site is null`);

      findings.push({
        cpt_code: code,
        rule_id: "R-3.5.5",
        check_type: "anatomic_specificity",
        required: true,
        present: false,
        status: "insufficient",
        missing_info_keys: ["anatomic_site"],
        prompt_text: ruleConfig355.prompt_template,
      });
    } else if (injectionMinorCodes.has(code) && isGenericSite(input.anatomic_site)) {
      trigger355 = true;
      evidence355.push(`CPT ${code} (injection) has generic anatomic_site="${input.anatomic_site}"`);

      findings.push({
        cpt_code: code,
        rule_id: "R-3.5.5",
        check_type: "anatomic_specificity",
        required: true,
        present: false,
        status: "insufficient",
        missing_info_keys: ["anatomic_site"],
        prompt_text: ruleConfig355.prompt_template,
      });
    }
  }

  if (trigger355 && !missingInformation.includes(ruleConfig355.prompt_template)) {
    missingInformation.push(ruleConfig355.prompt_template);
  }

  // --- Build rule evaluations ---
  const ruleEvaluations: RuleEvaluation[] = [
    trigger351
      ? buildTriggeredEvaluation("R-3.5.1", evidence351, ruleConfig351.missing_info_keys)
      : buildPassEvaluation("R-3.5.1"),
    trigger352
      ? buildTriggeredEvaluation("R-3.5.2", evidence352, [])
      : buildPassEvaluation("R-3.5.2"),
    trigger353
      ? buildTriggeredEvaluation("R-3.5.3", evidence353, ruleConfig353.missing_info_keys)
      : buildPassEvaluation("R-3.5.3"),
    trigger354
      ? buildTriggeredEvaluation("R-3.5.4", evidence354, ruleConfig354.missing_info_keys)
      : buildPassEvaluation("R-3.5.4"),
    trigger355
      ? buildTriggeredEvaluation("R-3.5.5", evidence355, ruleConfig355.missing_info_keys)
      : buildPassEvaluation("R-3.5.5"),
  ];

  return {
    rule_evaluations: ruleEvaluations,
    suppressed_codes: [],
    warnings,
    force_review_items: [],
    documentation_findings: findings,
    missing_information: missingInformation,
  };
}
