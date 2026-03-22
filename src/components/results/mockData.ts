import type { CodingResult } from "@/types/coding";
import type { DeterministicCodingOutput, RuleEvaluation, RuleId } from "@/types/ruleEngine";
import { ALL_RULE_IDS, RULE_DOMAIN_MAP, RULE_ACTION_MAP } from "@/utils/validateRuleEvaluation";
import { buildVersionMetadata } from "@/utils/versionMetadata";

// ---------------------------------------------------------------------------
// Legacy CodingResult mock (unchanged)
// ---------------------------------------------------------------------------

export const MOCK_RESULT: CodingResult = {
  add_on_codes: [],
  primary_code: {
    cpt_code: "27447",
    description: "Total knee arthroplasty",
    confidence: "high",
  },
  alternatives: [
    {
      cpt_code: "27446",
      description: "Arthroplasty, knee, condyle and plateau, medial OR lateral",
      why_consider: "If documentation indicates unicompartmental rather than total replacement",
    },
    {
      cpt_code: "27487",
      description: "Revision of total knee arthroplasty",
      why_consider: "If this is a revision of a prior arthroplasty rather than a primary procedure",
    },
  ],
  icd10_codes: [
    {
      code: "M17.11",
      description: "Primary osteoarthritis, right knee",
      necessity: "Severe osteoarthritis with failed conservative management justifies total knee arthroplasty",
    },
  ],
  modifiers: [
    {
      code: "-RT",
      name: "Right side",
      apply: true,
      reason: "Documentation specifies right knee procedure",
    },
  ],
  rationale:
    "Documentation describes a total knee arthroplasty on the right knee for a 68-year-old female with severe osteoarthritis after failed conservative treatment including physical therapy, NSAIDs, and corticosteroid injections. CPT 27447 is the specific code for total knee arthroplasty. M17.11 establishes medical necessity with laterality matching the -RT modifier. High confidence due to clear documentation of procedure, indication, and approach.",
  missing_information: [],
  warnings: [],
  clean_claim_ready: true,
};

// ---------------------------------------------------------------------------
// ACC-11: DeterministicCodingOutput mock helpers
// ---------------------------------------------------------------------------

function buildPassEvaluation(ruleId: RuleId): RuleEvaluation {
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

function buildAllEvaluations(
  overrides: Partial<Record<RuleId, Partial<RuleEvaluation>>> = {}
): RuleEvaluation[] {
  return ALL_RULE_IDS.map((ruleId) => {
    const base = buildPassEvaluation(ruleId);
    const override = overrides[ruleId];
    return override ? { ...base, ...override } : base;
  });
}

const BASE_VERSION_METADATA = buildVersionMetadata();

const BASE_PAYER_CONTEXT = {
  payer_type: "commercial" as const,
  safe_defaults_used: false,
};

// ---------------------------------------------------------------------------
// Mock 1: STATE_READY — clean, high confidence, no issues
// ---------------------------------------------------------------------------

export const MOCK_DETERMINISTIC_READY: DeterministicCodingOutput = {
  suggested_codes: [
    { cpt_code: "27447", description: "Total knee arthroplasty" },
  ],
  suppressed_codes: [],
  modifiers: [
    { code: "-RT", description: "Right side", applied_by_rule: null },
  ],
  diagnoses: [
    { icd10_code: "M17.11", description: "Primary osteoarthritis, right knee" },
  ],
  missing_information: [],
  warnings: [],
  force_review_items: [],
  force_review_pending: false,
  clean_claim_ready: true,
  confidence: "high",
  rule_evaluations: buildAllEvaluations(),
  payer_context_applied: BASE_PAYER_CONTEXT,
  version_metadata: BASE_VERSION_METADATA,
};

// ---------------------------------------------------------------------------
// Mock 2: STATE_REVIEW_REQUIRED — force_review_pending with checklist items
// ---------------------------------------------------------------------------

export const MOCK_DETERMINISTIC_REVIEW_PENDING: DeterministicCodingOutput = {
  suggested_codes: [
    { cpt_code: "99214", description: "Office visit, established patient, moderate complexity" },
    { cpt_code: "20610", description: "Arthrocentesis, major joint" },
  ],
  suppressed_codes: [],
  modifiers: [
    { code: "-25", description: "Significant, separately identifiable E/M service", applied_by_rule: "R-3.3.1" },
    { code: "-RT", description: "Right side", applied_by_rule: null },
  ],
  diagnoses: [
    { icd10_code: "M17.11", description: "Primary osteoarthritis, right knee" },
  ],
  missing_information: [],
  warnings: [],
  force_review_items: [
    {
      rule_id: "R-3.4.2",
      message: "E/M code 99214 billed same day as minor procedure 20610. Confirm that the E/M service is separately identifiable.",
      code_context: ["99214", "20610"],
      resolved: false,
    },
    {
      rule_id: "R-3.3.1",
      message: "Modifier -59 applied to 20610. Verify documentation supports distinct procedure.",
      code_context: ["20610"],
      resolved: false,
    },
  ],
  force_review_pending: true,
  clean_claim_ready: true,
  confidence: "medium",
  rule_evaluations: buildAllEvaluations({
    "R-3.3.1": {
      trigger_matched: true,
      severity: "High",
      message_user: "Modifier -59 applied to 20610. Verify documentation supports distinct procedure.",
      message_internal: "R-3.3.1: modifier 59 applied, documentation review required",
    },
    "R-3.4.2": {
      trigger_matched: true,
      severity: "High",
      message_user: "E/M code 99214 billed same day as minor procedure 20610.",
      message_internal: "R-3.4.2: E/M with minor procedure, confirm separately identifiable",
    },
  }),
  payer_context_applied: BASE_PAYER_CONTEXT,
  version_metadata: BASE_VERSION_METADATA,
};

// ---------------------------------------------------------------------------
// Mock 3: STATE_REVIEW_REQUIRED — medium confidence, NO checklist items
// ---------------------------------------------------------------------------

export const MOCK_DETERMINISTIC_REVIEW_MEDIUM: DeterministicCodingOutput = {
  suggested_codes: [
    { cpt_code: "29881", description: "Knee arthroscopy, meniscectomy" },
  ],
  suppressed_codes: [],
  modifiers: [
    { code: "-RT", description: "Right side", applied_by_rule: null },
  ],
  diagnoses: [
    { icd10_code: "M23.311", description: "Other meniscus derangements, right knee" },
  ],
  missing_information: [],
  warnings: [
    {
      type: "warning",
      rule_id: "R-3.5.3",
      message: "Fracture approach/technique not documented. Consider adding approach details.",
      code_context: "29881",
    },
  ],
  force_review_items: [],
  force_review_pending: false,
  clean_claim_ready: true,
  confidence: "medium",
  rule_evaluations: buildAllEvaluations({
    "R-3.4.3": {
      trigger_matched: true,
      severity: "High",
      message_user: "E/M code billed with major surgery. Decision for surgery modifier -57 may be required.",
      message_internal: "R-3.4.3: force-review for E/M with major surgery",
    },
  }),
  payer_context_applied: BASE_PAYER_CONTEXT,
  version_metadata: BASE_VERSION_METADATA,
};

// ---------------------------------------------------------------------------
// Mock 4: STATE_BLOCKED — explicit block rules
// ---------------------------------------------------------------------------

export const MOCK_DETERMINISTIC_BLOCKED: DeterministicCodingOutput = {
  suggested_codes: [
    { cpt_code: "29881", description: "Knee arthroscopy, meniscectomy" },
  ],
  suppressed_codes: [
    {
      cpt_code: "29877",
      description: "Knee arthroscopy, debridement/shaving",
      suppressed_by_rule: "R-3.1.1",
      reason: "Bundled into 29881 per NCCI PTP edits. Cannot bill separately.",
    },
  ],
  modifiers: [
    { code: "-RT", description: "Right side", applied_by_rule: null },
  ],
  diagnoses: [
    { icd10_code: "M23.311", description: "Other meniscus derangements, right knee" },
  ],
  missing_information: ["Laterality not documented for ICD-10 code M23.311"],
  warnings: [],
  force_review_items: [],
  force_review_pending: false,
  clean_claim_ready: false,
  confidence: "low",
  rule_evaluations: buildAllEvaluations({
    "R-3.1.1": {
      trigger_matched: true,
      severity: "Critical",
      message_user: "CPT 29877 is bundled into 29881 per NCCI PTP edits. Cannot bill both codes together.",
      message_internal: "R-3.1.1: PTP conflict 29881/29877, column 1 code suppressed",
      suppressed_code: "29877",
      policy_anchor: "NCCI PTP Q1 2026, pair (29881, 29877)",
    },
    "R-3.5.1": {
      trigger_matched: true,
      severity: "High",
      message_user: "Laterality not specified. Unilateral orthopedic procedures require laterality documentation.",
      message_internal: "R-3.5.1: missing laterality for unilateral procedure",
    },
  }),
  payer_context_applied: BASE_PAYER_CONTEXT,
  version_metadata: BASE_VERSION_METADATA,
};

// ---------------------------------------------------------------------------
// Mock 5: STATE_BLOCKED — clean_claim_ready=false but NO explicit block rules
// (fallback blocked scenario)
// ---------------------------------------------------------------------------

export const MOCK_DETERMINISTIC_BLOCKED_FALLBACK: DeterministicCodingOutput = {
  suggested_codes: [
    { cpt_code: "27447", description: "Total knee arthroplasty" },
  ],
  suppressed_codes: [],
  modifiers: [],
  diagnoses: [
    { icd10_code: "M17.9", description: "Osteoarthritis of knee, unspecified" },
  ],
  missing_information: [],
  warnings: [],
  force_review_items: [],
  force_review_pending: false,
  clean_claim_ready: false,
  confidence: "low",
  rule_evaluations: buildAllEvaluations(),
  payer_context_applied: { payer_type: "unknown", safe_defaults_used: true },
  version_metadata: BASE_VERSION_METADATA,
};
