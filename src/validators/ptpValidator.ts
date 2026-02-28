// ACC-04: NCCI PTP Conflict Validator
// Deterministic, stateless validator for PTP (Procedure-to-Procedure) bundling rules.
// Covers ACC-01 rules R-3.1.1 through R-3.1.4.

import type {
  RuleId,
  RuleEvaluation,
  SuppressedCode,
  DeterministicWarning,
  SeverityTier,
} from "@/types/ruleEngine";
import { RULE_DOMAIN_MAP, RULE_ACTION_MAP } from "@/utils/validateRuleEvaluation";
import { CPT_REFERENCE } from "@/data/cptReference";
import ptpPairsData from "@/data/ptp/rules.orthopedics.v1.json";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PtpValidatorInput {
  laterality: string;
  cpt_codes_submitted: string[];
  modifiers_present: Record<string, string[]>;
  payer_type: "commercial" | "medicare" | "unknown";
}

export interface PtpValidationResult {
  rule_evaluations: RuleEvaluation[];
  suppressed_codes: SuppressedCode[];
  warnings: DeterministicWarning[];
}

export interface PtpPairEntry {
  column1_code: string;
  column2_code: string;
  rule_id: string;
  category: string;
  joint_category: string;
  description: string;
}

interface PtpConflict {
  pair: PtpPairEntry;
  submitted_column1: string;
  submitted_column2: string;
  same_joint: boolean;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ptpPairs: PtpPairEntry[] = ptpPairsData as PtpPairEntry[];

const PTP_RULE_IDS: RuleId[] = ["R-3.1.1", "R-3.1.2", "R-3.1.3", "R-3.1.4"];

const SEVERITY_MAP: Record<string, SeverityTier> = {
  "R-3.1.1": "Critical",
  "R-3.1.2": "High",
  "R-3.1.3": "Medium",
  "R-3.1.4": "Critical",
};

const RULE_DESCRIPTIONS: Record<string, { user: string; internal: string }> = {
  "R-3.1.1": {
    user: "Arthroscopy code is bundled into the open/major procedure on the same joint and cannot be billed separately.",
    internal: "NCCI PTP column-1/column-2 conflict: arthroscopy + open procedure, same joint.",
  },
  "R-3.1.2": {
    user: "Injection code is bundled into the arthroscopy on the same joint and cannot be billed separately.",
    internal: "NCCI PTP column-1/column-2 conflict: injection + arthroscopy, same joint.",
  },
  "R-3.1.3": {
    user: "Cast/splint application is typically included in fracture care. Review documentation if billed separately.",
    internal: "NCCI PTP advisory: cast/splint + fracture care co-presence detected.",
  },
  "R-3.1.4": {
    user: "Diagnostic arthroscopy is bundled into surgical arthroscopy on the same joint and cannot be billed separately.",
    internal: "NCCI PTP column-1/column-2 conflict: diagnostic + surgical arthroscopy, same joint.",
  },
};

const POLICY_ANCHOR = "NCCI PTP Edits Q1 2026";

// ---------------------------------------------------------------------------
// ACC-02 structured_fields adapter
// ---------------------------------------------------------------------------

export function fromStructuredFields(sf: {
  laterality: string;
  cpt_codes_submitted: string[];
  modifiers_present: Record<string, string[]>;
  payer_type: string;
  [key: string]: unknown;
}): PtpValidatorInput {
  return {
    laterality: sf.laterality,
    cpt_codes_submitted: sf.cpt_codes_submitted,
    modifiers_present: sf.modifiers_present,
    payer_type: (sf.payer_type === "commercial" || sf.payer_type === "medicare")
      ? sf.payer_type : "unknown",
  };
}

// ---------------------------------------------------------------------------
// Laterality helpers
// ---------------------------------------------------------------------------

export function getCodeLaterality(code: string, input: PtpValidatorInput): string {
  const modifiers = input.modifiers_present[code];
  if (modifiers) {
    for (const mod of modifiers) {
      const clean = mod.replace(/^-/, "").toUpperCase();
      if (clean === "RT") return "right";
      if (clean === "LT") return "left";
      if (clean === "50") return "bilateral";
    }
  }
  return input.laterality;
}

export function isSameJoint(lat1: string, lat2: string): boolean {
  if (lat1 === "bilateral" || lat2 === "bilateral") return true;
  if (lat1 === "not_specified" || lat2 === "not_specified") return true;
  return lat1 === lat2;
}

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

export function findPtpConflicts(input: PtpValidatorInput): PtpConflict[] {
  const conflicts: PtpConflict[] = [];
  const codes = input.cpt_codes_submitted;

  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      const codeA = codes[i];
      const codeB = codes[j];

      for (const pair of ptpPairs) {
        let submittedCol1: string | null = null;
        let submittedCol2: string | null = null;

        // Bidirectional match
        if (codeA === pair.column1_code && codeB === pair.column2_code) {
          submittedCol1 = codeA;
          submittedCol2 = codeB;
        } else if (codeB === pair.column1_code && codeA === pair.column2_code) {
          submittedCol1 = codeB;
          submittedCol2 = codeA;
        }

        if (!submittedCol1 || !submittedCol2) continue;

        // R-3.1.3 (cast/fracture) fires on co-presence regardless of laterality
        if (pair.rule_id === "R-3.1.3") {
          conflicts.push({
            pair,
            submitted_column1: submittedCol1,
            submitted_column2: submittedCol2,
            same_joint: true,
          });
          continue;
        }

        // All other PTP rules require same-joint determination
        const lat1 = getCodeLaterality(submittedCol1, input);
        const lat2 = getCodeLaterality(submittedCol2, input);
        const sameJoint = isSameJoint(lat1, lat2);

        if (sameJoint) {
          conflicts.push({
            pair,
            submitted_column1: submittedCol1,
            submitted_column2: submittedCol2,
            same_joint: true,
          });
        }
      }
    }
  }

  return conflicts;
}

// ---------------------------------------------------------------------------
// Build rule evaluations
// ---------------------------------------------------------------------------

function getCptDescription(code: string): string {
  const info = CPT_REFERENCE[code];
  return info?.descriptor ?? `CPT ${code}`;
}

function buildTriggeredEvaluation(
  ruleId: RuleId,
  conflicts: PtpConflict[]
): RuleEvaluation {
  const desc = RULE_DESCRIPTIONS[ruleId];
  const evidenceFields: string[] = [];

  for (const c of conflicts) {
    evidenceFields.push(
      `${c.submitted_column1}+${c.submitted_column2} (${c.pair.joint_category})`
    );
  }

  const suppressedCode =
    RULE_ACTION_MAP[ruleId] === "block" ? conflicts[0].pair.column2_code : null;

  return {
    rule_id: ruleId,
    domain: RULE_DOMAIN_MAP[ruleId],
    action_type: RULE_ACTION_MAP[ruleId],
    severity: SEVERITY_MAP[ruleId],
    trigger_matched: true,
    message_user: desc.user,
    message_internal: desc.internal,
    evidence_fields: evidenceFields,
    missing_info_keys: [],
    payer_note: null,
    suppressed_code: suppressedCode,
    payer_context: null,
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

export function validatePtp(input: PtpValidatorInput): PtpValidationResult {
  const conflicts = findPtpConflicts(input);

  // Group conflicts by rule_id
  const conflictsByRule: Record<string, PtpConflict[]> = {};
  for (const c of conflicts) {
    const rid = c.pair.rule_id;
    if (!conflictsByRule[rid]) conflictsByRule[rid] = [];
    conflictsByRule[rid].push(c);
  }

  const ruleEvaluations: RuleEvaluation[] = [];
  const suppressedCodes: SuppressedCode[] = [];
  const warnings: DeterministicWarning[] = [];
  const suppressedSet = new Set<string>();

  for (const ruleId of PTP_RULE_IDS) {
    const ruleConflicts = conflictsByRule[ruleId];
    if (ruleConflicts && ruleConflicts.length > 0) {
      const evaluation = buildTriggeredEvaluation(ruleId, ruleConflicts);
      ruleEvaluations.push(evaluation);

      if (RULE_ACTION_MAP[ruleId] === "block") {
        // Suppress column2 codes from all conflicts for this rule
        for (const c of ruleConflicts) {
          const code = c.pair.column2_code;
          if (!suppressedSet.has(code)) {
            suppressedSet.add(code);
            suppressedCodes.push({
              cpt_code: code,
              description: getCptDescription(code),
              suppressed_by_rule: ruleId,
              reason: RULE_DESCRIPTIONS[ruleId].internal,
            });
          }
        }
      } else if (RULE_ACTION_MAP[ruleId] === "warn") {
        // Warn rules produce warnings, no suppression
        for (const c of ruleConflicts) {
          warnings.push({
            type: "warning",
            rule_id: ruleId,
            message: `${RULE_DESCRIPTIONS[ruleId].user} Codes: ${c.submitted_column1} + ${c.submitted_column2}.`,
            code_context: `${c.submitted_column1}+${c.submitted_column2}`,
          });
        }
      }
    } else {
      ruleEvaluations.push(buildPassEvaluation(ruleId));
    }
  }

  return { rule_evaluations: ruleEvaluations, suppressed_codes: suppressedCodes, warnings };
}
