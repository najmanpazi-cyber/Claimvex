# ACC-08: Documentation Sufficiency Validator

**Status:** Final v1
**Owner:** Execution Board
**Scope:** Orthopedics v1 Beta — deterministic documentation sufficiency guardrails
**Depends on:** ACC-01 (rules R-3.5.1–R-3.5.5), ACC-02 (scenarios ACC02-065–ACC02-084, cross-domain), ACC-03 (schema contract)
**Created:** 2026-02-28

---

## 1. Overview

ACC-08 implements a stateless, deterministic validator for documentation sufficiency rules. It checks structured fields for laterality, ICD-10 laterality consistency, fracture approach, rule-out diagnosis language, and anatomic specificity.

What it does:
- Blocks missing laterality for procedure codes (R-3.5.1)
- Blocks ICD-10 laterality contradicting CPT laterality (R-3.5.2)
- Warns on fracture care without approach specification (R-3.5.3)
- Blocks outpatient rule-out/suspected diagnosis language (R-3.5.4)
- Warns on missing anatomic specificity (R-3.5.5)

What it does NOT do:
- Free-text NLP or clinical reasoning
- Infer laterality from ICD-10 codes not in the lookup table
- Produce force_review_items (all rules are block or warn)
- Suppress codes
- Validate modifier medical necessity

---

## 2. Rule Coverage Matrix

| Rule | Description | Action | Severity | Trigger |
|------|-------------|--------|----------|---------|
| R-3.5.1 | Missing laterality | block | Critical | Non-E/M CPT + no laterality field or modifier |
| R-3.5.2 | ICD-10 laterality mismatch | block | Critical | ICD-10 laterality contradicts CPT laterality |
| R-3.5.3 | Missing fracture approach | warn | Medium | Fracture CPT + null approach |
| R-3.5.4 | Outpatient rule-out diagnosis | block | High | Outpatient + rule-out keyword in diagnosis_text |
| R-3.5.5 | Missing anatomic specificity | warn | Medium | Non-E/M CPT + null/generic anatomic_site |

---

## 3. Input / Output Interfaces

### Input: `DocumentationValidatorInput`

```typescript
interface DocumentationValidatorInput {
  laterality: "left" | "right" | "bilateral" | "not_specified";
  payer_type: "commercial" | "medicare" | "unknown";
  cpt_codes_submitted: string[];
  modifiers_present: Record<string, string[]>;
  icd10_codes: string[];
  setting: "office" | "outpatient" | "ASC" | "inpatient";
  diagnosis_text: string | null;
  anatomic_site: string | null;
  approach: string | null;
}
```

The `fromStructuredFields()` adapter defaults:
- `diagnosis_text` → `null` (no text to evaluate)
- `anatomic_site` → `null` (conservative — triggers R-3.5.5)
- `approach` → `null` (conservative — triggers R-3.5.3 for fracture codes)
- `payer_type: "not_specified"` → `"unknown"`

### Output: `DocumentationValidationResult`

```typescript
interface DocumentationValidationResult {
  rule_evaluations: RuleEvaluation[];          // Exactly 5 (R-3.5.1–R-3.5.5)
  suppressed_codes: SuppressedCode[];          // Always empty
  warnings: DeterministicWarning[];            // Info warnings (unknown ICD-10 codes)
  force_review_items: ForceReviewItem[];       // Always empty
  documentation_findings: DocumentationFinding[];
  missing_information: string[];               // User-facing prompts
}
```

### DocumentationFinding

```typescript
interface DocumentationFinding {
  cpt_code: string;
  rule_id: string;
  check_type: "laterality" | "icd_laterality_match" | "approach" | "rule_out_dx" | "anatomic_specificity";
  required: boolean;
  present: boolean;
  status: "sufficient" | "insufficient" | "unknown";
  missing_info_keys: string[];
  prompt_text: string | null;
}
```

---

## 4. Effective Laterality Resolution

Laterality is resolved from multiple sources (priority order):

1. `laterality` field value (if not "not_specified")
2. Modifiers on ANY submitted CPT: `-RT` → right, `-LT` → left, `-50` → bilateral

If neither source provides laterality, `effective_laterality = "not_specified"`.

---

## 5. ICD-10 Laterality Lookup

38 ICD-10 codes mapped to laterality in the reference table. Unknown codes are treated as `"unspecified"` and skipped with an info warning.

Comparison rules:
- `not_applicable` or `unspecified` → skip
- `bilateral` ICD-10 → compatible with any CPT laterality
- `bilateral` CPT → compatible with any ICD-10 laterality
- Otherwise: must match exactly

---

## 6. Fracture Care Codes

10 fracture CPT codes require approach specification:

| CPT | Description |
|-----|-------------|
| 25600–25609 | Distal radius fracture treatments |
| 27750–27759 | Tibial shaft fracture treatments |
| 28470 | Metatarsal fracture treatment |

---

## 7. Rule-Out Keyword Detection

14 keywords/phrases checked with case-insensitive whole-word matching:

`rule out`, `rule-out`, `ruleout`, `suspected`, `suspect`, `probable`, `probably`, `possible`, `possibly`, `questionable`, `consistent with`, `likely`, `cannot exclude`, `to exclude`

Only triggers in outpatient-equivalent settings: `office`, `outpatient`, `ASC`. Inpatient settings are exempt (ICD-10 guidelines allow rule-out coding for inpatient).

---

## 8. Anatomic Specificity Check

- **All non-E/M codes:** null `anatomic_site` → triggers R-3.5.5
- **Injection codes (20610, 20611, 20605, 20553):** additionally checked against generic patterns (`^joint$`, `^the knee$`, etc.)
- **Other procedure codes:** CPT code itself provides sufficient anatomic context — only null check applies

---

## 9. Multi-Rule Interaction

All 5 rules are independent and always evaluated:

- **R-3.5.1 + R-3.5.2:** Cannot both trigger for the same case. R-3.5.1 fires when laterality is unknown; R-3.5.2 requires known laterality to compare. Mutually exclusive by design.
- **R-3.5.1 + R-3.5.5:** Can co-trigger when both laterality and anatomic site are missing.
- **R-3.5.1 + R-3.5.3 + R-3.5.5:** Triple trigger possible for fracture codes missing laterality, approach, and site.
- **R-3.5.4:** Independent — checks diagnosis text, not code properties.

---

## 10. Test Coverage Summary

20 test cases in `src/test/validators/documentationValidator.test.ts`:

| # | Test | Key Assertion |
|---|------|---------------|
| 1 | Missing laterality (ACC02-065) | R-3.5.1 block, missing_info_keys=["laterality"] |
| 2 | Laterality from modifier | R-3.5.1 pass — -RT provides laterality |
| 3 | Laterality from field | R-3.5.1 pass — field value used |
| 4 | E/M code exempt | R-3.5.1 skip — 99214 doesn't require laterality |
| 5 | Right CPT vs left ICD-10 (ACC02-070) | R-3.5.2 block, prompt includes mismatch |
| 6 | Left CPT vs right ICD-10 (ACC02-071) | R-3.5.2 block |
| 7 | Matching laterality | R-3.5.2 pass |
| 8 | Unknown ICD-10 code | R-3.5.2 skip, info warning emitted |
| 9 | Fracture without approach (ACC02-074) | R-3.5.3 warn, missing_info_keys=["approach"] |
| 10 | Fracture with approach | R-3.5.3 pass |
| 11 | Non-fracture code | R-3.5.3 skip |
| 12 | "Rule out" in outpatient (ACC02-078) | R-3.5.4 block, missing_info_keys=["confirmed_diagnosis"] |
| 13 | Inpatient exempt | R-3.5.4 skip |
| 14 | Null diagnosis_text | R-3.5.4 skip, finding status="unknown" |
| 15 | Null anatomic_site (ACC02-082) | R-3.5.5 warn, missing_info_keys=["anatomic_site"] |
| 16 | Specific anatomic_site | R-3.5.5 pass |
| 17 | Triple trigger (ACC02-083) | R-3.5.1 + R-3.5.3 + R-3.5.5 all fire |
| 18 | R-3.5.1 + R-3.5.2 mutual exclusion | R-3.5.1 fires, R-3.5.2 skips |
| 19 | Adapter defaults | Conservative defaults verified |
| 20 | ACC-03 compliance | Block + warn both pass validateCodingOutput() |

---

## 11. Known Limitations

1. **ICD-10 laterality table is beta-scoped:** Only 38 codes mapped. Unknown codes are skipped with a warning.
2. **No free-text NLP:** Documentation checks use structured fields only.
3. **Generic site patterns are limited:** 8 regex patterns for injection codes. Edge cases may pass through.
4. **Rule-out keyword matching is English-only:** No support for other languages.
5. **No severity graduation:** R-3.5.4 blocks equally for "possible" and "rule out" despite different clinical certainty levels.

---

## 12. Dependencies

- **ACC-12 (Orchestrator):** Will coordinate documentation findings with other validator results.
- **Upstream parsers:** `diagnosis_text`, `anatomic_site`, and `approach` fields must be populated by clinical note parsing or structured data entry.

---

## 13. File Inventory

| File | Purpose |
|------|---------|
| `src/data/documentation/documentation.rules.orthopedics.v1.json` | Rule configs + reference data (38 ICD-10 entries, 10 fracture codes, 14 keywords) |
| `src/validators/documentationValidator.ts` | Core validator logic |
| `src/utils/applyDocumentationValidation.ts` | Integration wrapper + test utility |
| `src/test/validators/documentationValidator.test.ts` | 20 test cases |
| `docs/ACC-08-DOCUMENTATION-VALIDATOR.md` | This document |
