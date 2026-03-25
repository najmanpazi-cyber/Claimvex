// ACC-07: Global Period Validator
// Deterministic, stateless validator for global period rules.
// Covers ACC-01 rules R-3.4.1 (block), R-3.4.2 (force-review),
// R-3.4.3 (force-review), R-3.4.4 (block).
// BETA SCOPE: Orthopedics v1 only. Do not expand specialty scope without explicit ACC approval.

import type {
  RuleId,
  RuleEvaluation,
  SuppressedCode,
  DeterministicWarning,
  ForceReviewItem,
  SeverityTier,
} from "@/types/ruleEngine";
import { RULE_DOMAIN_MAP, RULE_ACTION_MAP } from "@/utils/validateRuleEvaluation";
import globalCptData from "@/data/global/global.orthopedics.v1.json";
import globalRulesData from "@/data/global/global.rules.orthopedics.v1.json";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export type GlobalStatus = "none" | "active_0" | "active_10" | "active_90";

export interface GlobalValidatorInput {
  laterality: string;
  payer_type: "commercial" | "medicare" | "unknown";
  cpt_codes_submitted: string[];
  modifiers_present: Record<string, string[]>;
  patient_type: string;
  setting: string;
  physician_id: string;
  global_period_status: GlobalStatus;
  global_period_surgery_date: string | null;
  global_period_surgery_cpt: string | null;
  encounter_date: string;
  prior_surgery_related: boolean;
  decision_for_surgery_documented: boolean;
  em_separately_identifiable: boolean;
}

export interface GlobalFinding {
  cpt_code: string;
  is_em_code: boolean;
  procedure_global_days: 0 | 10 | 90 | null;
  active_global_status: GlobalStatus;
  days_since_surgery: number | null;
  required_modifier: "24" | "25" | "57" | "58" | "78" | "79" | null;
  submitted_modifiers: string[];
  modifier_status: "present" | "missing" | "not_applicable";
  relationship_assessment: "related" | "unrelated" | "unknown";
  payer_handling: "medicare_strict" | "commercial_standard" | "unknown_conservative";
  status: "valid" | "needs_review" | "blocked" | "not_applicable";
}

export interface GlobalValidationResult {
  rule_evaluations: RuleEvaluation[];
  suppressed_codes: SuppressedCode[];
  warnings: DeterministicWarning[];
  force_review_items: ForceReviewItem[];
  global_findings: GlobalFinding[];
}

interface GlobalCptEntry {
  cpt_code: string;
  global_days: number;
  description: string;
  category: string;
}

interface GlobalRuleConfig {
  rule_id: string;
  action: string;
  description: string;
  trigger_global_status: string[];
  trigger_code_type: string;
  sufficient_modifiers: string[];
  payer_note: string;
  missing_info_keys: string[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const globalCptMap = new Map<string, GlobalCptEntry>();
for (const entry of globalCptData as GlobalCptEntry[]) {
  globalCptMap.set(entry.cpt_code, entry);
}

const globalRules: GlobalRuleConfig[] = globalRulesData as GlobalRuleConfig[];

const GLOBAL_RULE_IDS: RuleId[] = ["R-3.4.1", "R-3.4.2", "R-3.4.3", "R-3.4.4"];

const SEVERITY_MAP: Record<string, SeverityTier> = {
  "R-3.4.1": "Critical",
  "R-3.4.2": "High",
  "R-3.4.3": "High",
  "R-3.4.4": "High",
};

const RULE_DESCRIPTIONS: Record<string, { user: string; internal: string }> = {
  "R-3.4.1": {
    user: "E/M visit during 90-day global period requires modifier -24 (unrelated) or -25 (separately identifiable). Without it, the E/M is included in the surgical package.",
    internal: "E/M code billed during active 90-day global without -24/-25/-79 modifier.",
  },
  "R-3.4.2": {
    user: "E/M billed same day as a procedure requires modifier -25 if it is separately identifiable. Document the distinct E/M service.",
    internal: "Same-day E/M + procedure without -25 modifier on E/M code.",
  },
  "R-3.4.3": {
    user: "E/M billed with major surgery (90-day global) requires modifier -57 if the E/M represents the decision for surgery.",
    internal: "E/M + major surgery same day without -57 modifier. Decision-for-surgery documentation not confirmed.",
  },
  "R-3.4.4": {
    user: "Procedure during an active global period requires modifier -58 (staged), -78 (return to OR), or -79 (unrelated) to indicate relationship to prior surgery.",
    internal: "Procedure during active global period without -58/-78/-79 modifier.",
  },
};

const POLICY_ANCHOR = "CMS Global Surgery Policy Q1 2026";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isEmCode(code: string): boolean {
  const num = parseInt(code, 10);
  if (isNaN(num)) return false;
  if (num >= 99202 && num <= 99215) return true;
  if (num >= 99221 && num <= 99236) return true;
  if (num >= 99281 && num <= 99285) return true;
  if (num >= 99241 && num <= 99255) return true;
  return false;
}

export function daysSinceSurgery(surgeryDate: string, encounterDate: string): number | null {
  const surgery = new Date(surgeryDate + "T00:00:00");
  const encounter = new Date(encounterDate + "T00:00:00");
  if (isNaN(surgery.getTime()) || isNaN(encounter.getTime())) return null;
  const diffMs = encounter.getTime() - surgery.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function isMajorSurgery(code: string): boolean {
  const entry = globalCptMap.get(code);
  return entry?.category === "major_surgery" || (entry?.global_days === 90) || false;
}

function isProcedureCode(code: string): boolean {
  return !isEmCode(code);
}

function normalizeModifier(mod: string): string {
  return mod.replace(/^-/, "").toUpperCase();
}

function codeHasAnyModifier(code: string, modifiers: string[], input: GlobalValidatorInput): boolean {
  const codeMods = input.modifiers_present[code];
  if (!codeMods) return false;
  const normalized = codeMods.map(normalizeModifier);
  return modifiers.some((m) => normalized.includes(m.toUpperCase()));
}

function getPayerHandling(payerType: "commercial" | "medicare" | "unknown"): GlobalFinding["payer_handling"] {
  if (payerType === "medicare") return "medicare_strict";
  if (payerType === "commercial") return "commercial_standard";
  return "unknown_conservative";
}

function getGlobalDays(code: string): 0 | 10 | 90 | null {
  const entry = globalCptMap.get(code);
  if (!entry) return null;
  const d = entry.global_days;
  if (d === 0 || d === 10 || d === 90) return d;
  return null;
}

// ---------------------------------------------------------------------------
// ACC-02 structured_fields adapter
// ---------------------------------------------------------------------------

const VALID_GLOBAL_STATUSES: Record<string, GlobalStatus> = {
  none: "none",
  active_0: "active_0",
  active_0day: "active_0",
  active_10: "active_10",
  active_10day: "active_10",
  active_90: "active_90",
  active_90day: "active_90",
};

export function fromStructuredFields(sf: {
  laterality: string;
  payer_type: string;
  cpt_codes_submitted: string[];
  modifiers_present: Record<string, string[]>;
  patient_type: string;
  setting: string;
  physician_id: string;
  global_period_status: string;
  global_period_surgery_date: string | null;
  global_period_surgery_cpt: string | null;
  encounter_date?: string;
  prior_surgery_related?: boolean;
  decision_for_surgery_documented?: boolean;
  em_separately_identifiable?: boolean;
  [key: string]: unknown;
}): GlobalValidatorInput {
  return {
    laterality: sf.laterality,
    payer_type: (sf.payer_type === "commercial" || sf.payer_type === "medicare")
      ? sf.payer_type : "unknown",
    cpt_codes_submitted: sf.cpt_codes_submitted,
    modifiers_present: sf.modifiers_present,
    patient_type: sf.patient_type,
    setting: sf.setting,
    physician_id: sf.physician_id,
    global_period_status: VALID_GLOBAL_STATUSES[sf.global_period_status] ?? "none",
    global_period_surgery_date: sf.global_period_surgery_date,
    global_period_surgery_cpt: sf.global_period_surgery_cpt,
    encounter_date: sf.encounter_date ?? new Date().toISOString().split("T")[0],
    prior_surgery_related: sf.prior_surgery_related ?? true,
    decision_for_surgery_documented: sf.decision_for_surgery_documented ?? false,
    em_separately_identifiable: sf.em_separately_identifiable ?? false,
  };
}

// ---------------------------------------------------------------------------
// Rule evaluation builders
// ---------------------------------------------------------------------------

function buildTriggeredEvaluation(
  ruleId: RuleId,
  evidenceFields: string[],
  missingInfoKeys: string[],
  payerNote: string | null,
  payerType: "commercial" | "medicare" | "unknown"
): RuleEvaluation {
  const desc = RULE_DESCRIPTIONS[ruleId];
  return {
    rule_id: ruleId,
    domain: RULE_DOMAIN_MAP[ruleId],
    action_type: RULE_ACTION_MAP[ruleId],
    severity: SEVERITY_MAP[ruleId],
    trigger_matched: true,
    message_user: desc.user,
    message_internal: desc.internal,
    evidence_fields: evidenceFields,
    missing_info_keys: missingInfoKeys,
    payer_note: payerNote,
    suppressed_code: null,
    payer_context: `Payer: ${payerType}`,
    policy_anchor: POLICY_ANCHOR,
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

export function validateGlobal(input: GlobalValidatorInput): GlobalValidationResult {
  const findings: GlobalFinding[] = [];
  const warnings: DeterministicWarning[] = [];
  const forceReviewItems: ForceReviewItem[] = [];

  const emCodes = input.cpt_codes_submitted.filter(isEmCode);
  const procedureCodes = input.cpt_codes_submitted.filter(isProcedureCode);
  const payerHandling = getPayerHandling(input.payer_type);

  const days = input.global_period_surgery_date
    ? daysSinceSurgery(input.global_period_surgery_date, input.encounter_date)
    : null;

  const isActive90 = input.global_period_status === "active_90";
  const isActiveGlobal = input.global_period_status !== "none";

  // Warn if date computation conflicts with status
  if (isActive90 && days !== null && days > 90) {
    warnings.push({
      type: "info",
      rule_id: "R-3.4.1",
      message: `Global period status is active_90 but computed days since surgery is ${days} (> 90). Trusting authoritative status field.`,
      code_context: input.global_period_surgery_cpt,
    });
  }

  const relationship: GlobalFinding["relationship_assessment"] =
    input.prior_surgery_related ? "related" : "unrelated";

  // Track rule triggers
  let trigger341 = false;
  let trigger342 = false;
  let trigger343 = false;
  let trigger344 = false;

  const evidence341: string[] = [];
  const evidence342: string[] = [];
  const evidence343: string[] = [];
  const evidence344: string[] = [];

  const ruleConfig341 = globalRules.find((r) => r.rule_id === "R-3.4.1")!;
  const ruleConfig342 = globalRules.find((r) => r.rule_id === "R-3.4.2")!;
  const ruleConfig343 = globalRules.find((r) => r.rule_id === "R-3.4.3")!;
  const ruleConfig344 = globalRules.find((r) => r.rule_id === "R-3.4.4")!;

  // --- R-3.4.1: E/M during 90-day global without modifier ---
  if (isActive90) {
    for (const emCode of emCodes) {
      const hasSufficientMod = codeHasAnyModifier(emCode, ruleConfig341.sufficient_modifiers, input);

      if (!hasSufficientMod && input.prior_surgery_related) {
        trigger341 = true;
        evidence341.push(`E/M ${emCode} during active_90 for ${input.global_period_surgery_cpt}`);
        evidence341.push(`global_period_surgery_date: ${input.global_period_surgery_date}`);
        if (days !== null) evidence341.push(`days_since_surgery: ${days}`);
        evidence341.push(`prior_surgery_related: ${input.prior_surgery_related}`);

        findings.push({
          cpt_code: emCode,
          is_em_code: true,
          procedure_global_days: input.global_period_surgery_cpt ? getGlobalDays(input.global_period_surgery_cpt) : null,
          active_global_status: input.global_period_status,
          days_since_surgery: days,
          required_modifier: "24",
          submitted_modifiers: input.modifiers_present[emCode] ?? [],
          modifier_status: "missing",
          relationship_assessment: relationship,
          payer_handling: payerHandling,
          status: "blocked",
        });
      } else {
        findings.push({
          cpt_code: emCode,
          is_em_code: true,
          procedure_global_days: input.global_period_surgery_cpt ? getGlobalDays(input.global_period_surgery_cpt) : null,
          active_global_status: input.global_period_status,
          days_since_surgery: days,
          required_modifier: null,
          submitted_modifiers: input.modifiers_present[emCode] ?? [],
          modifier_status: hasSufficientMod ? "present" : "not_applicable",
          relationship_assessment: relationship,
          payer_handling: payerHandling,
          status: "valid",
        });
      }
    }
  }

  // --- R-3.4.2: Same-day E/M + procedure without -25 ---
  if (emCodes.length > 0 && procedureCodes.length > 0) {
    for (const emCode of emCodes) {
      // Skip if already has -25
      if (codeHasAnyModifier(emCode, ruleConfig342.sufficient_modifiers, input)) continue;

      trigger342 = true;
      evidence342.push(`E/M ${emCode} same day as procedure(s): ${procedureCodes.join(", ")}`);
      evidence342.push(`em_separately_identifiable: ${input.em_separately_identifiable}`);

      // Message varies based on whether separate identifiability is documented
      const msg342 = input.em_separately_identifiable
        ? `E/M code ${emCode} billed same day as procedure ${procedureCodes[0]}. E/M is separately identifiable but modifier -25 is missing. Add -25 before submission.`
        : `E/M code ${emCode} billed same day as procedure ${procedureCodes[0]}. Modifier -25 required if E/M is separately identifiable.`;

      forceReviewItems.push({
        rule_id: "R-3.4.2",
        message: msg342,
        code_context: [emCode, procedureCodes[0]],
        resolved: false,
      });

      // Add finding if not already added by R-3.4.1
      const existingFinding = findings.find((f) => f.cpt_code === emCode);
      if (!existingFinding) {
        findings.push({
          cpt_code: emCode,
          is_em_code: true,
          procedure_global_days: null,
          active_global_status: input.global_period_status,
          days_since_surgery: days,
          required_modifier: "25",
          submitted_modifiers: input.modifiers_present[emCode] ?? [],
          modifier_status: "missing",
          relationship_assessment: relationship,
          payer_handling: payerHandling,
          status: "needs_review",
        });
      }
    }
  }

  // --- R-3.4.3: Decision-for-surgery E/M without -57 ---
  const majorSurgeryCodes = procedureCodes.filter(isMajorSurgery);
  if (emCodes.length > 0 && majorSurgeryCodes.length > 0) {
    for (const emCode of emCodes) {
      if (codeHasAnyModifier(emCode, ruleConfig343.sufficient_modifiers, input)) continue;

      trigger343 = true;
      evidence343.push(`E/M ${emCode} same day as major surgery: ${majorSurgeryCodes.join(", ")}`);
      evidence343.push(`decision_for_surgery_documented: ${input.decision_for_surgery_documented}`);

      // Message varies based on whether decision documentation exists
      const msg343 = input.decision_for_surgery_documented
        ? `E/M code ${emCode} billed with major surgery ${majorSurgeryCodes[0]}. Decision for surgery is documented but modifier -57 is missing. Add -57 before submission.`
        : `E/M code ${emCode} billed with major surgery ${majorSurgeryCodes[0]}. If E/M represents decision for surgery, modifier -57 is required.`;

      forceReviewItems.push({
        rule_id: "R-3.4.3",
        message: msg343,
        code_context: [emCode, majorSurgeryCodes[0]],
        resolved: false,
      });

      const existingFinding = findings.find((f) => f.cpt_code === emCode);
      if (!existingFinding) {
        findings.push({
          cpt_code: emCode,
          is_em_code: true,
          procedure_global_days: null,
          active_global_status: input.global_period_status,
          days_since_surgery: days,
          required_modifier: "57",
          submitted_modifiers: input.modifiers_present[emCode] ?? [],
          modifier_status: "missing",
          relationship_assessment: relationship,
          payer_handling: payerHandling,
          status: "needs_review",
        });
      }
    }
  }

  // --- R-3.4.4: Procedure during active global without modifier ---
  if (isActiveGlobal) {
    for (const procCode of procedureCodes) {
      const hasSufficientMod = codeHasAnyModifier(procCode, ruleConfig344.sufficient_modifiers, input);

      if (!hasSufficientMod) {
        trigger344 = true;
        evidence344.push(`Procedure ${procCode} during ${input.global_period_status} for ${input.global_period_surgery_cpt}`);
        evidence344.push(`global_period_surgery_date: ${input.global_period_surgery_date}`);
        if (days !== null) evidence344.push(`days_since_surgery: ${days}`);

        findings.push({
          cpt_code: procCode,
          is_em_code: false,
          procedure_global_days: getGlobalDays(procCode),
          active_global_status: input.global_period_status,
          days_since_surgery: days,
          required_modifier: "58",
          submitted_modifiers: input.modifiers_present[procCode] ?? [],
          modifier_status: "missing",
          relationship_assessment: relationship,
          payer_handling: payerHandling,
          status: "blocked",
        });
      } else {
        findings.push({
          cpt_code: procCode,
          is_em_code: false,
          procedure_global_days: getGlobalDays(procCode),
          active_global_status: input.global_period_status,
          days_since_surgery: days,
          required_modifier: null,
          submitted_modifiers: input.modifiers_present[procCode] ?? [],
          modifier_status: "present",
          relationship_assessment: relationship,
          payer_handling: payerHandling,
          status: "valid",
        });
      }
    }
  }

  // Warn for unknown global days
  for (const code of input.cpt_codes_submitted) {
    if (!isEmCode(code) && !globalCptMap.has(code)) {
      warnings.push({
        type: "info",
        rule_id: "R-3.4.4",
        message: `Global period days unknown for CPT ${code}. Unable to assess global period impact.`,
        code_context: code,
      });
    }
  }

  // --- Build rule evaluations ---
  const ruleEvaluations: RuleEvaluation[] = [];

  if (trigger341) {
    ruleEvaluations.push(buildTriggeredEvaluation("R-3.4.1", evidence341, ruleConfig341.missing_info_keys, ruleConfig341.payer_note, input.payer_type));
  } else {
    ruleEvaluations.push(buildPassEvaluation("R-3.4.1"));
  }

  if (trigger342) {
    ruleEvaluations.push(buildTriggeredEvaluation("R-3.4.2", evidence342, ruleConfig342.missing_info_keys, ruleConfig342.payer_note, input.payer_type));
  } else {
    ruleEvaluations.push(buildPassEvaluation("R-3.4.2"));
  }

  if (trigger343) {
    ruleEvaluations.push(buildTriggeredEvaluation("R-3.4.3", evidence343, ruleConfig343.missing_info_keys, ruleConfig343.payer_note, input.payer_type));
  } else {
    ruleEvaluations.push(buildPassEvaluation("R-3.4.3"));
  }

  if (trigger344) {
    ruleEvaluations.push(buildTriggeredEvaluation("R-3.4.4", evidence344, ruleConfig344.missing_info_keys, ruleConfig344.payer_note, input.payer_type));
  } else {
    ruleEvaluations.push(buildPassEvaluation("R-3.4.4"));
  }

  return {
    rule_evaluations: ruleEvaluations,
    suppressed_codes: [],
    warnings,
    force_review_items: forceReviewItems,
    global_findings: findings,
  };
}
