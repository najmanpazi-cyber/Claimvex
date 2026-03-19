# Beta Safe Mode Policy

> **ClaimVex Accuracy Layer — Orthopedics v1 Beta**
> Effective: 2026-03-07
> Owner: Execution Board
> Status: Active

---

## 1. What This Beta Covers

This beta release covers **orthopedic CPT coding validation only**. The system checks claims for five types of billing issues:

1. **Procedure-to-Procedure (PTP) bundling conflicts** — flags when two codes should not be billed together
2. **Medically Unlikely Edits (MUE) unit limits** — flags when units exceed CMS maximums
3. **Modifier 59/X guardrails** — flags when modifier use needs clinical justification
4. **Global period violations** — flags when procedures fall within a prior surgery's global period
5. **Documentation sufficiency gaps** — flags when required documentation elements are missing

The system evaluates claims against **18 deterministic rules** (R-3.1.1 through R-3.5.5) defined in the ACC-01 Accuracy Specification.

---

## 2. What This Beta Does NOT Cover

- **Non-orthopedic specialties** — no rules exist for cardiology, neurology, general surgery, etc.
- **E/M level selection** — the system does not recommend or validate E/M code levels
- **ICD-10 code selection** — the system does not recommend diagnosis codes
- **Payer-specific contract terms** — rules reflect CMS/NCCI national policy, not individual payer contracts
- **State Medicaid variations** — state-specific billing rules are not included
- **Real-time eligibility or prior authorization** — the system does not check insurance status

---

## 3. How Outputs Should Be Used

All outputs from this beta are **decision-support only**. They are not final billing determinations.

- **Block actions**: The system has high confidence that the claim has a billing conflict. A qualified coder should review and resolve the conflict before submission.
- **Force-review actions**: The system has identified a pattern that requires human clinical judgment. A qualified coder must review and make the final determination.
- **Warn actions**: The system has flagged an informational finding. No action is required, but the coder should be aware.
- **Clean claim ready = true**: No blocking issues were found by the rules in scope. This does NOT mean the claim is guaranteed to be paid — it means the automated checks passed.

**No output from this system should be submitted to a payer without human review.**

---

## 4. Known Limitations

1. **Rule coverage is finite.** The 18 rules cover the most common orthopedic bundling, unit, modifier, global period, and documentation issues. Edge cases outside these rules will not be flagged.

2. **PTP data covers 20 code pairs.** The NCCI PTP edit file contains thousands of pairs; this beta includes the 20 most clinically relevant orthopedic pairs. Unlisted pairs will not trigger a conflict.

3. **MUE data covers 47 CPT codes.** Only orthopedic codes with MUE limits are included. Other codes pass through without unit validation.

4. **Global period data covers 48 CPT codes.** Only orthopedic procedures with 0-day, 10-day, or 90-day global periods are included.

5. **Modifier -79 (unrelated procedure in global period) is not in the current rule set.** The global period validator does not yet recognize -79 as an override modifier.

6. **Add-on code validation does not exist.** The system does not check whether add-on codes are billed with an appropriate primary code.

7. **The system requires structured input fields.** Accuracy depends on correct values for anatomic site, laterality, payer type, approach, and documentation indicators. Garbage in, garbage out.

---

## 5. Accuracy Baselines

These numbers represent the system's performance against a curated test pack of 109 de-identified orthopedic billing scenarios (ACC-02 Test Pack v1).

| Metric | Value | Meaning |
|--------|-------|---------|
| Overall pass rate | 109/109 (100%) | Every scenario produced the correct output |
| False-pass rate | 0/109 (0%) | No scenario was incorrectly marked clean when it should have been blocked or reviewed |
| False-fail rate | 0/109 (0%) | No clean scenario was incorrectly blocked |
| Schema compliance | 109/109 (100%) | Every output conforms to the defined schema |
| Critical conflict visibility | 21/21 (100%) | Every PTP block scenario correctly surfaced the conflict |
| Documentation gap detection | 30/30 (100%) | Every documentation-domain scenario was correctly evaluated |

These baselines were established on 2026-03-07 and are locked for the beta period. Any code change that degrades these numbers below the gate thresholds (G1–G6) will block deployment.

---

## 6. What Triggers a Scope Change

The following changes require explicit ACC approval before implementation:

- Adding rules for a new specialty (e.g., cardiology, neurology)
- Adding new rule IDs beyond R-3.1.1 through R-3.5.5
- Changing the action type (block/force-review/warn) of an existing rule
- Expanding PTP, MUE, or global period data beyond orthopedics
- Modifying the clean_claim_ready derivation logic
- Changing confidence level semantics

Minor changes that do NOT require ACC approval:
- Bug fixes that improve accuracy without changing rule semantics
- Adding test scenarios to the ACC-02 test pack
- Updating CMS data editions (e.g., Q2 2026 MUE refresh) within orthopedics scope

---

## 7. Feedback and Issue Reporting

During the beta period:

- **Accuracy issues** (wrong block, missed conflict, incorrect output): Report to the Execution Board with the claim scenario details. These are treated as P1 and will be triaged within 24 hours.
- **Feature requests** (new specialty, new rule type): Log for post-beta evaluation. These will not be addressed during the beta period.
- **UI/UX issues** (display bugs, unclear messaging): Report through normal channels.

All accuracy issues reported during beta will be added to the ACC-02 test pack as regression tests before any fix is deployed.
