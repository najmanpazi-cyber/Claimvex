# ACC-03: Schema & Error Contract

**Status:** Final v1
**Owner:** Execution Board
**Scope:** Orthopedics v1 Beta
**Created:** 2026-02-28
**Schema Version:** 1.0.0
**Depends on:** ACC-01 (accuracy spec), ACC-02 (test pack)

---

## 1. Schema Field Reference

### 1.1 `DeterministicCodingOutput` (top-level)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `suggested_codes` | `SuggestedCode[]` | Yes | CPT codes recommended for billing |
| `suppressed_codes` | `SuppressedCode[]` | Yes | CPT codes removed by deterministic rules |
| `modifiers` | `ModifierEntry[]` | Yes | Modifiers applied or recommended |
| `diagnoses` | `DiagnosisEntry[]` | Yes | ICD-10 diagnosis codes |
| `missing_information` | `string[]` | Yes | User-facing prompts for documentation gaps |
| `warnings` | `DeterministicWarning[]` | Yes | Non-blocking warnings and informational notes |
| `force_review_items` | `ForceReviewItem[]` | Yes | Items requiring explicit user review |
| `force_review_pending` | `boolean` | Yes | True if any `force_review_items` are unresolved |
| `clean_claim_ready` | `boolean` | Yes | True only when no block rules fired and no pending reviews |
| `confidence` | `"high" \| "medium" \| "low"` | Yes | Overall confidence after rule evaluation |
| `rule_evaluations` | `RuleEvaluation[]` | Yes | Per-rule evaluation results |
| `payer_context_applied` | `PayerContextApplied` | Yes | Payer context used during evaluation |
| `version_metadata` | `VersionMetadata` | Yes | Edition anchors and schema version |

### 1.2 `SuggestedCode`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cpt_code` | `string` | Yes | CPT code |
| `description` | `string` | Yes | Code description |

### 1.3 `SuppressedCode`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cpt_code` | `string` | Yes | Suppressed CPT code |
| `description` | `string` | Yes | Code description |
| `suppressed_by_rule` | `RuleId` | Yes | Rule that suppressed this code |
| `reason` | `string` | Yes | Suppression reason |

### 1.4 `ModifierEntry`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Modifier code (e.g., "-59", "-XS") |
| `description` | `string` | Yes | Modifier description |
| `applied_by_rule` | `RuleId \| null` | Yes | Rule that applied this modifier, or null |

### 1.5 `DiagnosisEntry`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `icd10_code` | `string` | Yes | ICD-10-CM code |
| `description` | `string` | Yes | Diagnosis description |

### 1.6 `DeterministicWarning`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"warning" \| "info"` | Yes | Warning severity (never "error") |
| `rule_id` | `string` | Yes | Rule that generated this warning |
| `message` | `string` | Yes | User-facing warning message |
| `code_context` | `string \| null` | Yes | Related CPT code, or null |

### 1.7 `ForceReviewItem`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rule_id` | `RuleId` | Yes | Rule that requires review |
| `message` | `string` | Yes | Review prompt |
| `code_context` | `string[]` | Yes | Related CPT codes |
| `resolved` | `boolean` | Yes | Whether user has resolved this item |

### 1.8 `RuleEvaluation`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rule_id` | `RuleId` | Yes | One of 18 rule IDs (R-3.1.1 through R-3.5.5) |
| `domain` | `RuleDomain` | Yes | PTP, MUE, MODIFIER, GLOBAL, or DOC_SUFFICIENCY |
| `action_type` | `ActionType` | Yes | block, force-review, or warn |
| `severity` | `SeverityTier` | Yes | Critical, High, Medium, or Low |
| `trigger_matched` | `boolean` | Yes | Whether this rule's condition was met |
| `message_user` | `string` | Yes | User-facing explanation |
| `message_internal` | `string` | Yes | Developer-facing explanation |
| `evidence_fields` | `string[]` | Yes | Input fields used in evaluation |
| `missing_info_keys` | `string[]` | Yes | Missing input fields |
| `payer_note` | `string \| null` | Yes | Payer-specific note |
| `suppressed_code` | `string \| null` | Yes | CPT suppressed by this rule |
| `payer_context` | `string \| null` | Yes | Payer context that influenced eval |
| `policy_anchor` | `string \| null` | Yes | Policy/guideline reference |

### 1.9 `PayerContextApplied`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payer_type` | `"commercial" \| "medicare" \| "unknown"` | Yes | Payer classification |
| `safe_defaults_used` | `boolean` | Yes | True if conservative defaults were applied |

### 1.10 `VersionMetadata`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ncci_ptp_edition` | `string` | Yes | e.g., "Q1 2026" |
| `mue_edition` | `string` | Yes | e.g., "Q1 2026" |
| `cpt_edition` | `string` | Yes | e.g., "AMA CPT 2026" |
| `icd10_edition` | `string` | Yes | e.g., "FY2026" |
| `ruleset_version` | `string` | Yes | Semver, e.g., "1.0.0" |
| `schema_version` | `string` | Yes | Semver, e.g., "1.0.0" |
| `generated_at` | `string` | Yes | ISO 8601 timestamp |

---

## 2. Action Semantics Contract

Per ACC-01 Section 3.0, every rule uses exactly one action type:

| Action Type | Behavior | `clean_claim_ready` | `confidence` Effect |
|-------------|----------|---------------------|---------------------|
| **block** | Halts claim processing. User must resolve before submission. | Set to `false` | Set to `"low"` |
| **force-review** | Requires explicit user confirmation. Does not auto-pass. | Unchanged until user acts | Set to `"medium"` (unless already `"low"`) |
| **warn** | Informational only. Non-blocking. | No change | No change |

### Rule-to-Action Mapping

| Rule ID | Domain | Action | Severity |
|---------|--------|--------|----------|
| R-3.1.1 | PTP | block | Critical |
| R-3.1.2 | PTP | block | High |
| R-3.1.3 | PTP | warn | Medium |
| R-3.1.4 | PTP | block | Critical |
| R-3.2.1 | MUE | block | Critical |
| R-3.2.2 | MUE | warn | Low |
| R-3.3.1 | MODIFIER | force-review | High |
| R-3.3.2 | MODIFIER | block | Critical |
| R-3.3.3 | MODIFIER | warn | Low |
| R-3.4.1 | GLOBAL | block | Critical |
| R-3.4.2 | GLOBAL | force-review | High |
| R-3.4.3 | GLOBAL | force-review | High |
| R-3.4.4 | GLOBAL | block | High |
| R-3.5.1 | DOC_SUFFICIENCY | block | High |
| R-3.5.2 | DOC_SUFFICIENCY | block | Critical |
| R-3.5.3 | DOC_SUFFICIENCY | warn | High |
| R-3.5.4 | DOC_SUFFICIENCY | block | High |
| R-3.5.5 | DOC_SUFFICIENCY | warn | Low |

---

## 3. Derived Field Logic

### `confidence`
- Starts at `"high"`.
- Any triggered **block** rule sets it to `"low"`.
- Any triggered **force-review** rule sets it to `"medium"` (unless already `"low"`).
- **warn** rules do not affect confidence.

### `clean_claim_ready`
- Starts at `true`.
- Any triggered **block** rule sets it to `false`.
- `force_review_pending: true` sets it to `false`.
- **warn** rules do not affect it.

### `force_review_pending`
- Computed: `force_review_items.some(item => !item.resolved)`.
- Must match actual state — validator enforces consistency.

---

## 4. Version Metadata & Edition Anchors

Every output must include `version_metadata` with these editions:

| Field | Current Value | Source |
|-------|---------------|--------|
| `ncci_ptp_edition` | "Q1 2026" | CMS NCCI PTP Edits, effective 2026-01-01 |
| `mue_edition` | "Q1 2026" | CMS MUE Values, effective 2026-01-01 |
| `cpt_edition` | "AMA CPT 2026" | AMA CPT Code Set 2026 |
| `icd10_edition` | "FY2026" | ICD-10-CM FY2026, effective 2025-10-01 |
| `ruleset_version` | "1.0.0" | ClaimVex rule engine version |
| `schema_version` | "1.0.0" | This schema contract version |

---

## 5. Schema Versioning Policy

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Breaking: field removed, type changed, enum value removed | **Major** (2.0.0) | Removing `payer_note` from `RuleEvaluation` |
| Additive: new optional field, new enum value, new rule ID | **Minor** (1.1.0) | Adding `R-3.6.1` to `RuleId` |
| Fix: documentation, description, non-behavioral | **Patch** (1.0.1) | Fixing a typo in a message template |

Consumers should check `schema_version` and handle unknown fields gracefully for minor bumps.

---

## 6. Migration Guide

### Current State
The existing `CodingResult` interface in `src/types/coding.ts` is the active API contract used by the UI and edge function.

### Migration Roadmap

| Phase | Ticket | Action |
|-------|--------|--------|
| **1. Define** | ACC-03 (this) | Create `DeterministicCodingOutput` types, schemas, validators |
| **2. Adapt** | ACC-04 | Implement rule evaluation logic producing `RuleEvaluation[]` |
| **3. Adopt** | ACC-05+ | Edge function returns `DeterministicCodingOutput`; UI consumes it |
| **4. Remove** | TBD | Deprecate and remove `CodingResult` after full adoption |

During Phase 2-3, both types coexist. The edge function may return a combined response or map between them. No breaking changes to `CodingResult` are made until Phase 4.

---

## 7. Validation Error Codes

### Structural Errors (from Zod)

Prefixed with `STRUCTURAL_`. These indicate the data does not match the expected shape.

### Semantic Errors

| Code | Severity | Description |
|------|----------|-------------|
| `SEMANTIC_BLOCK_CLEAN_CONTRADICTION` | Error | Block rule fired but `clean_claim_ready` is `true` |
| `SEMANTIC_BLOCK_CONFIDENCE_CONTRADICTION` | Error | Block rule fired but `confidence` is not `"low"` |
| `SEMANTIC_FORCE_REVIEW_CONFIDENCE_CONTRADICTION` | Error | Force-review fired but `confidence` is `"high"` |
| `SEMANTIC_FORCE_REVIEW_PENDING_MISMATCH` | Error | `force_review_pending` doesn't match items state |
| `SEMANTIC_PENDING_REVIEW_CLEAN_CONTRADICTION` | Error | `force_review_pending` is true but `clean_claim_ready` is true |
| `SEMANTIC_SUPPRESSED_REF_UNTRIGGERED` | Error | Suppressed code references a non-triggered rule |
| `SEMANTIC_WARNING_REF_UNTRIGGERED` | Warning | Warning references a non-triggered rule |
| `SEMANTIC_RULE_DOMAIN_MISMATCH` | Error | Rule's domain doesn't match canonical mapping |
| `SEMANTIC_RULE_ACTION_MISMATCH` | Error | Rule's action_type doesn't match canonical mapping |
| `SEMANTIC_SUPPRESSED_WITHOUT_TRIGGER` | Error | `suppressed_code` set but `trigger_matched` is false |
| `SEMANTIC_MISSING_INFO_WITHOUT_TRIGGER` | Error | `missing_info_keys` non-empty but `trigger_matched` is false |

---

## 8. Examples

### 8.1 Complete Valid Output (Clean Claim)

```json
{
  "suggested_codes": [
    { "cpt_code": "29881", "description": "Knee arthroscopy, meniscectomy" }
  ],
  "suppressed_codes": [],
  "modifiers": [
    { "code": "-RT", "description": "Right side", "applied_by_rule": null }
  ],
  "diagnoses": [
    { "icd10_code": "M23.311", "description": "Other meniscus derangements, right knee" }
  ],
  "missing_information": [],
  "warnings": [],
  "force_review_items": [],
  "force_review_pending": false,
  "clean_claim_ready": true,
  "confidence": "high",
  "rule_evaluations": [
    {
      "rule_id": "R-3.1.1",
      "domain": "PTP",
      "action_type": "block",
      "severity": "Critical",
      "trigger_matched": false,
      "message_user": "",
      "message_internal": "",
      "evidence_fields": ["cpt_primary"],
      "missing_info_keys": [],
      "payer_note": null,
      "suppressed_code": null,
      "payer_context": null,
      "policy_anchor": "NCCI PTP Q1 2026"
    }
  ],
  "payer_context_applied": {
    "payer_type": "commercial",
    "safe_defaults_used": false
  },
  "version_metadata": {
    "ncci_ptp_edition": "Q1 2026",
    "mue_edition": "Q1 2026",
    "cpt_edition": "AMA CPT 2026",
    "icd10_edition": "FY2026",
    "ruleset_version": "1.0.0",
    "schema_version": "1.0.0",
    "generated_at": "2026-02-28T12:00:00Z"
  }
}
```

### 8.2 Output with Block Rule + Expected Validator Errors

If a block rule fires but `clean_claim_ready` remains `true`:

```json
{
  "clean_claim_ready": true,
  "confidence": "high",
  "rule_evaluations": [
    {
      "rule_id": "R-3.1.1",
      "trigger_matched": true,
      "action_type": "block"
    }
  ]
}
```

Validator returns:
```json
{
  "valid": false,
  "errors": [
    {
      "path": "clean_claim_ready",
      "code": "SEMANTIC_BLOCK_CLEAN_CONTRADICTION",
      "message": "A block rule fired but clean_claim_ready is true."
    },
    {
      "path": "confidence",
      "code": "SEMANTIC_BLOCK_CONFIDENCE_CONTRADICTION",
      "message": "A block rule fired but confidence is \"high\"."
    }
  ],
  "warnings": []
}
```
