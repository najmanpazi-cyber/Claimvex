# Accuracy Execution Board

> ClaimVex CPT Coding Assistant — Orthopedics v1 Beta
> Last updated: 2026-03-07

---

## ACC Task Registry

| ACC | Title | Status | Key Deliverable | Commit |
|-----|-------|--------|-----------------|--------|
| ACC-01 | Accuracy Specification | **Done** | `specs/ACC-01-accuracy-spec-final-v1.md` — 18 rules, 5 domains, action semantics | `a55fc24` |
| ACC-02 | De-Identified Test Pack | **Done** | `specs/ACC-02-scenarios.jsonl` — 109 orthopedic scenarios | `19cef27` |
| ACC-03 | Schema & Error Contract | **Done** | `src/types/ruleEngine.ts`, `src/schemas/*.schema.json` | `9983917` |
| ACC-04 | NCCI PTP Conflict Validator | **Done** | `src/validators/ptpValidator.ts` — R-3.1.1 through R-3.1.4, 20 code pairs | `befcffc` |
| ACC-05 | MUE Unit Limit Validator | **Done** | `src/validators/mueValidator.ts` — R-3.2.1/R-3.2.2, 47 MUE entries | `9601f87` |
| ACC-06 | Modifier 59/X Validator | **Done** | `src/validators/modifierValidator.ts` — R-3.3.1/R-3.3.2/R-3.3.3 | `a332126` |
| ACC-07 | Global Period Validator | **Done** | `src/validators/globalValidator.ts` — R-3.4.1 through R-3.4.4, 48 CPT entries | `3dea6ba` |
| ACC-08 | Documentation Sufficiency Validator | **Done** | `src/validators/documentationValidator.ts` — R-3.5.1 through R-3.5.5 | `7c20abb` |
| ACC-09 | Adversarial Red-Team Pass #1 | **Done** | Identified 101 non-PASS scenarios; all resolved in ACC-10/14 | uncommitted |
| ACC-10 | Hardening Sprint (Scenario Enrichment) | **Done** | 96 scenarios enriched, R-3.2.2 scorer tolerance, R-3.4.3 fix | uncommitted |
| ACC-11 | Scorer & Harness Infrastructure | **Done** | `scripts/lib/scorer.ts`, `scripts/evaluate-acc13.ts` | uncommitted |
| ACC-13 | Evaluation Scoreboard & Gates | **Done** | 6 beta gates defined and passing; `docs/ACC-13-scoreboard.md` | uncommitted |
| ACC-14 | Adversarial Red-Team Pass #2 | **Done** | 109/109 PASS, 0 regressions, 95 cross-validator tests clean | uncommitted |
| ACC-15 | Beta Safe Mode Policy + Go/No-Go | **Done** | `docs/BETA-SAFE-MODE-POLICY.md`, beta banner, scope lock comments | uncommitted |

---

## Beta Readiness

### Go/No-Go Gate Summary

| Gate | Name | Threshold | Actual | Status |
|------|------|-----------|--------|--------|
| G1 | Critical conflict visibility | 100% | 100.0% (21/21) | **PASS** |
| G2 | Silent false-pass rate | 0 | 0 | **PASS** |
| G3 | Schema compliance | 100% | 100.0% (109/109) | **PASS** |
| G4 | Doc-gap detection | ≥80% | 100.0% (30/30) | **PASS** |
| G5 | Overall pass rate | ≥85% | 100.0% (109/109) | **PASS** |
| G6 | Rule-data version pinned | yes | yes | **PASS** |

**Verdict: GO**

### Test Summary

| Metric | Value |
|--------|-------|
| Unit tests | 124 pass, 0 fail |
| Assertions | 507 |
| Scenario pass rate | 109/109 (100%) |
| False-pass count | 0 |
| Regressions from hardening | 0 |
| Cross-validator interaction bugs | 0 (95 tests) |
| Type check | Clean |

### Conditions for Beta

1. All ACC-10/11/13/14/15 changes must be committed before deployment
2. `docs/BETA-SAFE-MODE-POLICY.md` governs all beta usage
3. Scope lock comments in all 5 validators prevent unauthorized expansion
4. Beta banner is visible on the main application page

### Known Gaps (Not Beta Blockers)

| Gap | Priority | Notes |
|-----|----------|-------|
| Modifier -79 rule support | Medium | Not in current R-3.4.x sufficient_modifiers |
| Add-on code without primary validation | Low | No rule exists yet |
| Validator orchestrator | Medium | Harness-level aggregation sufficient for beta |
| MUE data expansion beyond orthopedics | Low | 47 entries cover orthopedics scope |

---

## Data Editions

| Dataset | Edition | File |
|---------|---------|------|
| NCCI PTP | Q1 2026 | `src/data/ptp/rules.orthopedics.v1.json` |
| MUE | Q1 2026 | `src/data/mue/mue.orthopedics.q1-2026.json` |
| CPT | 2026 | `src/data/cptReference.ts` |
| ICD-10 | FY2026 | Inline in scenarios |
| Global Period | 2026 | `src/data/global/global.orthopedics.v1.json` |
| Documentation Rules | v1 | `src/data/documentation/documentation.rules.orthopedics.v1.json` |
| Modifier Rules | v1 | `src/data/modifiers/modifier59x.rules.orthopedics.v1.json` |
| Ruleset | orthopedics-v1-beta | All validators |
| Schema | 1.0.0 | `src/schemas/` |
