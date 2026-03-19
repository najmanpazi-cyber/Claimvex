# ACC-01 Final v1

**Status:** Final v1
**Owner:** Execution Board
**Scope:** Orthopedics v1 Beta
**Created:** 2026-02-28
**Finalized:** 2026-02-28
**Rule Edition Anchors:**
- NCCI PTP Edits: CMS Q1 2026 (effective 2026-01-01)
- MUE Values: CMS Q1 2026 (effective 2026-01-01)
- CPT Code Set: AMA CPT 2026
- ICD-10-CM: FY2026 (effective 2025-10-01)
- CMS MPFS (wRVU, global periods): CY 2026 Final Rule

---

## Revision Summary

Changes from ACC-01 Draft → ACC-01 Final v1:

- **Change 1 — Corrected over-absolute MUE payer claims.** Section 4.1 no longer states MUE is universally identical across all commercial payers. MUE is now defined as a hard adjudication constraint for Medicare and a conservative default ceiling for commercial, with payer-configurable override when a documented commercial policy sets different unit limits. Added a commercial payer variability note.
- **Change 2 — Standardized action semantics.** Added Section 3.0 (Action Semantics) defining exact behavior, `clean_claim_ready` effect, and confidence effect for `block`, `force-review`, and `warn`. Audited all 18 rules for consistency: Rule 3.1.2 changed from `warn` (with `"error"` type) to `block` per NCCI bundling intent. Rule 3.1.4 `block` description cleaned to remove ambiguous `"error"` warning reference. Rules 3.5.3 and 3.5.5 `warn` descriptions cleaned to remove confidence-reduction language that conflicted with `warn` semantics.
- **Change 3 — Aligned ACC-02 scenario minimums with execution board.** Section 6.1 now targets 100+ scenarios total. Per-domain minimums (84 floor) are preserved as domain floors. Added distribution constraint and weighting guidance toward higher-severity domains.
- **Change 4 — Tightened jurisdiction/policy-sensitive statements.** MAC-variable behavior in Sections 3, 4.2, and 4.3 is now explicitly tagged `[MAC-variable — needs policy confirmation]`. Universal wording like "Medicare rejects -59" replaced with jurisdiction-acknowledging phrasing. All safe defaults labeled `Conservative default pending payer/MAC policy confirmation`.
- **Change 5 — Preserved strengths.** Version anchors, scope/out-of-scope tables, severity tiers, taxonomy rankings, deterministic rule structure, edge-case set, payer weighting, and open decisions are unchanged. Acceptance criteria updated to reference new Action Semantics subsection and 100+ scenario target.

---

## 1. Scope Definition (Orthopedics v1)

### 1.1 In-Scope Workflows

| Workflow | CPT Range | Examples |
|----------|-----------|----------|
| Knee arthroscopy | 29870–29887, +27358 | Meniscectomy, meniscus repair, chondroplasty, loose body removal |
| Shoulder arthroscopy | 29805–29828 | Rotator cuff repair, SLAP repair, acromioplasty, biceps tenodesis |
| Hip arthroscopy | 29860–29863 | Diagnostic, chondroplasty, synovectomy |
| Ankle arthroscopy | 29894–29898 | Loose body removal, debridement |
| Joint replacement (primary) | 27130, 27447, 23472 | THA, TKA, total shoulder |
| Joint replacement (revision) | 27132, 27134, 27486, 27487, 23473 | Revision THA, revision TKA, revision shoulder |
| Fracture care | 25600–25609, 27750–27759 | Distal radius (closed/ORIF), tibial shaft |
| Ligament repair/reconstruction | 27405–27429 | ACL repair, ACL reconstruction, collateral |
| Tendon repair | 23410–23412, 27380–27381, 27650–27652 | Rotator cuff open, patellar tendon, Achilles |
| Foot/ankle correction | 28285, 28296 | Hammertoe, bunionectomy |
| Joint injections | 20600–20611 | Small/intermediate/major joint, with/without US guidance |
| Trigger point injections | 20550–20553 | Tendon sheath, tendon origin, trigger points |
| Casting/splinting | 29505–29550 | Long leg splint, short leg splint, strapping |
| E/M with orthopedic procedure | 99202–99215 | Same-day E/M with -25, decision-for-surgery with -57 |

**Payer scope:** Commercial/private insurance (primary), Medicare (secondary).

**Supported context fields:** Specialty, laterality, patient type, setting, payer type, global period status, units of service.

### 1.2 Explicit Out-of-Scope (Beta)

| Exclusion | Reason |
|-----------|--------|
| Spine surgery (22xxx, 630xx) | Separate specialty in ClaimVex; own accuracy spec planned |
| Pain management (ESI, facet, RFA, SCS) | Separate specialty; distinct billing rules |
| Sports medicine (PRP, biologics, concussion) | Separate specialty with experimental-coverage nuances |
| Medicaid payer logic | State-variable rules; deferred to v2 |
| Workers' Compensation | Separate fee schedules and authorization workflows |
| Inpatient-only procedures | Beta targets office/outpatient and ASC settings |
| Pediatric orthopedics | Age-specific code variants and growth-plate considerations deferred |
| Trauma registry coding | Facility-side trauma activation and registry coding excluded |
| DME coding (L-codes, E-codes) | Durable medical equipment out of scope |
| Anesthesia coding (00xxx) | Separate domain |
| Assistant surgeon billing (-80, -82) | Included in modifier reference but not actively validated |
| Multi-surgeon coding (-62) | Complex inter-provider rules deferred |

---

## 2. Denial-Risk Taxonomy (Ranked)

### 2.1 Severity Tier Definitions

| Tier | Definition | Consequence |
|------|-----------|-------------|
| **Critical** | Claim denied on first pass with no appeal pathway, or triggers fraud/abuse audit flag | Full payment loss; potential OIG/RAC audit exposure |
| **High** | Claim denied on first pass but recoverable on appeal with documentation | Payment delay 60–180 days; administrative cost $25–50/appeal |
| **Medium** | Claim paid but at reduced rate, or triggers post-payment audit risk | Partial revenue loss; recoupment risk on retrospective review |
| **Low** | No immediate denial but creates audit trail inconsistency or documentation gap | Compliance risk on pattern analysis; no immediate revenue impact |

### 2.2 Ranked Failure Modes

| Rank | Risk Domain | Failure Mode | Severity | Likelihood (Ortho) | Diagnosis Grouping Notes |
|------|-------------|-------------|----------|--------------------|-|
| 1 | **NCCI PTP** | Arthroscopy billed with open procedure on same joint, same session, without modifier | Critical | High | Degenerative (TKA + diagnostic scope) and trauma (ORIF + scope) equally affected |
| 2 | **Modifier 59/X** | -59 used on Medicare claim instead of -XE/-XS/-XP/-XU | High | High | Universal across all groupings; many MACs auto-reject -59 in favor of X-modifiers |
| 3 | **Global Period** | E/M billed within 90-day global without -24/-79 modifier | Critical | High | Joint replacement (90-day global) most affected; fracture care (90-day) second |
| 4 | **Documentation** | Missing laterality on unilateral MSK procedure | High | Very High | Universal — every arthroscopy, injection, fracture, and replacement requires -LT/-RT |
| 5 | **MUE** | Units exceed MUE limit (e.g., >1 unit for TKA on single claim line) | Critical | Medium | Joint replacement and arthroscopy (MUE=1 per side); injections (MUE varies) |
| 6 | **NCCI PTP** | Joint injection (20610) billed same day as arthroscopy of same joint | High | Medium | Degenerative knee most common (injection + scope same visit) |
| 7 | **Modifier 59/X** | -59/X modifier applied without documentation of distinct anatomic site, encounter, or service | Critical | Medium | Bilateral cases and multi-compartment arthroscopy |
| 8 | **Global Period** | E/M with -25 on same day as 0-day global procedure without separately documented MDM | High | High | Joint injections (0-day global) most affected |
| 9 | **Documentation** | Missing approach/technique for fracture care (closed vs. open vs. percutaneous) | High | Medium | Trauma grouping — code selection depends entirely on approach |
| 10 | **Global Period** | -57 omitted on E/M day-of or day-before major surgery (90-day global) | High | Medium | Joint replacement — decision-for-surgery E/M without -57 bundles into global |
| 11 | **NCCI PTP** | Cast/splint application billed separately with fracture care code | Medium | Medium | Trauma — casting included in fracture management CPT |
| 12 | **MUE** | Bilateral procedure billed as 2 units on single line instead of -50 or separate lines with -LT/-RT | High | Medium | Joint injections and arthroscopy; payer format requirements differ |
| 13 | **Documentation** | ICD-10 laterality mismatch with CPT modifier (right procedure, left diagnosis) | Critical | Low | Universal — crossed laterality is a never event |
| 14 | **Documentation** | Rule-out/suspected diagnosis coded in outpatient setting | High | Low | Post-imaging follow-ups before confirmed diagnosis |
| 15 | **Modifier 59/X** | Diagnostic arthroscopy (29870/29805/29860) billed separately alongside surgical arthroscopy of same joint | Critical | Low | Diagnostic scope is always bundled into surgical scope per NCCI |

---

## 3. Deterministic Rule Intent per Domain

### 3.0 Action Semantics

All rules in this section use exactly one of three action types. The table below defines the exact behavior contract for each.

| Action Type | Behavior | `clean_claim_ready` | Confidence Effect |
|-------------|----------|---------------------|-------------------|
| **block** | Halts claim processing. User cannot submit without resolving. | Set to `false` | Set to `low` |
| **force-review** | Does not auto-pass. Requires explicit user confirmation or review step before proceeding. | Remains unchanged until user acts | Set to `medium` (unless already `low`) |
| **warn** | Informational only. Non-blocking. Displayed to user but does not prevent submission. | No change | No change |

Every rule below conforms to exactly one of these types. No rule may combine behaviors across types (e.g., a `warn` must not set `clean_claim_ready: false`; a `block` must always set it).

### 3.1 NCCI PTP Conflicts

#### Rule 3.1.1 — Arthroscopy + Open Procedure, Same Joint

- **Trigger:** Primary CPT is an arthroscopy code (298xx) AND another CPT in the same response is an open procedure code on the same anatomic joint, same session
- **Expected behavior:** Flag the conflict. Do not output both codes without a modifier override and explicit justification.
- **Action type:** **Block** — set `clean_claim_ready: false`, set confidence to `low`
- **User-facing message:** "Arthroscopy and open surgery on the same joint in the same session are bundled under NCCI. The arthroscopy is included in the open procedure. If these were truly distinct services (e.g., different compartments), modifier -59 or -XS is required with documentation."

#### Rule 3.1.2 — Joint Injection + Arthroscopy, Same Joint, Same Day

- **Trigger:** Joint injection code (20600–20611) AND arthroscopy code (298xx) targeting the same joint on the same date of service
- **Expected behavior:** Suppress the injection code. The injection is bundled into the arthroscopy per NCCI and cannot be billed separately for the same joint.
- **Action type:** **Block** — set `clean_claim_ready: false`, set confidence to `low`
- **User-facing message:** "Joint injection is bundled with arthroscopy of the same joint on the same day per NCCI. The injection cannot be billed separately unless performed on a different joint (use -XS with documentation of the distinct joint)."

#### Rule 3.1.3 — Cast/Splint Application + Fracture Care

- **Trigger:** Casting/splinting code (29xxx casting range) AND fracture care code (255xx–277xx) in same response
- **Expected behavior:** Suppress the cast/splint code. Display informational warning to user.
- **Action type:** **Warn** — add `warnings[]` entry with type `"warning"`
- **User-facing message:** "Cast/splint application is included in the fracture care code and is not separately billable. Remove the casting code unless it was for a different anatomic site."

#### Rule 3.1.4 — Diagnostic Arthroscopy + Surgical Arthroscopy, Same Joint

- **Trigger:** Diagnostic arthroscopy code (29870, 29805, 29860) AND any surgical arthroscopy code for the same joint
- **Expected behavior:** Suppress the diagnostic code from output. Set `clean_claim_ready: false`.
- **Action type:** **Block** — set `clean_claim_ready: false`, set confidence to `low`
- **User-facing message:** "Diagnostic arthroscopy is always included in surgical arthroscopy of the same joint. Do not bill separately."

### 3.2 MUE Unit Limits

#### Rule 3.2.1 — Unit Exceeds MUE

- **Trigger:** Reported units for any CPT exceed its published MUE value (MAI = 1, 2, or 3 depending on code)
- **Expected behavior:** Compare units against MUE table. Flag when units exceed the MUE. For Medicare, this is a hard adjudication constraint. For commercial, apply as conservative default unless a documented payer policy allows higher units (see Section 4.1).
- **Action type:** **Block** — set `clean_claim_ready: false`, set confidence to `low`
- **User-facing message:** "Units of service ({units}) for CPT {code} exceed the MUE limit of {mue_limit}. For Medicare, claims exceeding MUE are auto-denied. For commercial payers, this limit is applied as a conservative default. Verify the unit count and consider whether separate lines with modifiers are appropriate."

**Key MUE values for orthopedic beta scope:**

| CPT | MUE (MAI) | Notes |
|-----|-----------|-------|
| 27447 (TKA) | 1 (3) | Per side; bilateral = separate lines with -LT/-RT or -50 |
| 27130 (THA) | 1 (3) | Per side |
| 29881 (meniscectomy) | 1 (2) | Per knee; bilateral = -50 or -LT/-RT |
| 29827 (RCR arthroscopic) | 1 (3) | Per shoulder |
| 20610 (major joint injection) | 1 (2) | Per joint; multiple joints = multiple lines |
| 25607 (ORIF distal radius) | 1 (3) | Per fracture |

*(MAI key: 1 = claim line, 2 = date of service, 3 = date of service per physician)*

#### Rule 3.2.2 — Near-Threshold MUE Warning

- **Trigger:** Reported units equal the MUE value exactly (not exceeding)
- **Expected behavior:** Informational note that units are at the MUE ceiling.
- **Action type:** **Warn** — add `warnings[]` entry with type `"info"`
- **User-facing message:** "Units for CPT {code} are at the MUE maximum ({mue_limit}). Ensure documentation supports each unit billed."

### 3.3 Modifier 59/X (XE/XS/XP/XU) Misuse

#### Rule 3.3.1 — Medicare: -59 Used Instead of X-Modifier

- **Trigger:** Payer = Medicare AND modifier -59 is suggested
- **Expected behavior:** Replace -59 with the most specific X-modifier (XE/XS/XP/XU) based on context. Many MACs reject -59 in favor of X-modifiers `[MAC-variable — needs policy confirmation]`.
- **Action type:** **Force-review** — apply the X-modifier, add `payer_note` explaining the substitution, set confidence to `medium` (unless already `low`)
- **User-facing message:** "Many Medicare MACs require NCCI subset modifiers (-XE, -XS, -XP, -XU) instead of -59. We've applied -{x_modifier} based on the documentation. Verify this is the correct distinction before submitting."

**Selection logic for X-modifier:**
- **XS** (separate structure): Different anatomic site/joint — most common in orthopedics
- **XE** (separate encounter): Different time of day / AM-PM split
- **XP** (separate practitioner): Different physician performed the service
- **XU** (unusual non-overlapping): Service doesn't overlap with typical components — use as fallback

#### Rule 3.3.2 — Modifier 59/X Without Supporting Documentation

- **Trigger:** -59 or X-modifier is suggested but clinical input does not contain language supporting distinct service (no mention of different site, different encounter, different structure)
- **Expected behavior:** Flag as unsupported.
- **Action type:** **Block** — set `clean_claim_ready: false`, add to `missing_information[]`, set confidence to `low`
- **User-facing message:** "Modifier -{modifier} requires documentation proving the service was distinct (different anatomic site, separate encounter, or separate structure). The current documentation does not clearly support this distinction."

#### Rule 3.3.3 — Commercial: -59 Acceptable but X-Modifier Preferred

- **Trigger:** Payer = Commercial AND modifier -59 is suggested
- **Expected behavior:** Accept -59 but include guidance note.
- **Action type:** **Warn** — add `payer_note` on the modifier
- **User-facing message:** "Commercial payers accept -59, but -XS/-XE/-XP/-XU provides more specificity and reduces audit risk. Consider using the more specific modifier."

### 3.4 Global Period Logic (24/25/57)

#### Rule 3.4.1 — E/M Within Active 90-Day Global, No Modifier

- **Trigger:** `global_period` context indicates patient is within an active 90-day global period AND an E/M code (992xx) is suggested without -24, -25, or -79
- **Expected behavior:** Block E/M or require modifier selection.
- **Action type:** **Block** — set `clean_claim_ready: false`, set confidence to `low`
- **User-facing message:** "This patient is within a 90-day global period. E/M services require a modifier: -24 (unrelated E/M), -79 (unrelated procedure), -78 (return to OR for complication), or -58 (staged procedure). Select the appropriate modifier."

#### Rule 3.4.2 — Same-Day E/M + 0-Day Global Procedure Without -25

- **Trigger:** E/M code AND a procedure with 0-day global period (injections: 20600–20611, 20550–20553) on the same date, without modifier -25 on the E/M
- **Expected behavior:** Require -25 or suppress the E/M. Requires explicit user confirmation.
- **Action type:** **Force-review** — suggest -25, flag documentation requirement, set confidence to `medium` (unless already `low`)
- **User-facing message:** "Billing E/M on the same day as a 0-day global procedure requires modifier -25. Documentation must show the E/M was significant and separately identifiable from the procedure's standard pre/post work."

#### Rule 3.4.3 — Decision-for-Surgery E/M Without -57

- **Trigger:** E/M code on the same day as (or day before) a major surgery (90-day global period) AND -57 is not applied
- **Expected behavior:** Suggest -57. Requires explicit user confirmation. Note: day-before acceptance varies by payer `[MAC-variable — needs policy confirmation]`.
- **Action type:** **Force-review** — suggest -57, explain requirement, set confidence to `medium` (unless already `low`)
- **User-facing message:** "E/M on the day of or day before major surgery (90-day global) typically requires modifier -57 to indicate the visit included the decision for surgery. Without -57, the E/M is included in the surgical global. Note: day-before -57 acceptance varies by payer — verify with the specific payer."

#### Rule 3.4.4 — Procedure Within Active Global Period Without -58/-78/-79

- **Trigger:** A procedure code is suggested AND `global_period` context indicates an active global period from a prior surgery, AND no global-period modifier (-58, -78, -79) is applied
- **Expected behavior:** Block or require modifier.
- **Action type:** **Block** — set `clean_claim_ready: false`, set confidence to `low`
- **User-facing message:** "A procedure during an active global period requires a modifier: -58 (staged/planned), -78 (unplanned return to OR for complication), or -79 (unrelated procedure). Without one, the claim will be denied as included in the prior surgery's global."

### 3.5 Documentation Sufficiency

#### Rule 3.5.1 — Missing Laterality

- **Trigger:** Procedure is unilateral MSK (any arthroscopy, joint injection, fracture care, joint replacement, tendon repair) AND laterality is "Not specified" in context AND clinical input does not contain "left," "right," "bilateral," "LT," "RT," "-50"
- **Expected behavior:** Add to `missing_information[]`, set `clean_claim_ready: false`.
- **Action type:** **Block** — set `clean_claim_ready: false`, set confidence to `low`
- **User-facing message:** "Laterality (left, right, or bilateral) is required for this procedure. Claims without laterality modifiers (-LT, -RT, or -50) will be denied."

#### Rule 3.5.2 — ICD-10 Laterality Mismatch

- **Trigger:** CPT modifier is -RT but ICD-10 code contains a left-side laterality character (or vice versa)
- **Expected behavior:** Flag contradiction.
- **Action type:** **Block** — set `clean_claim_ready: false`, set confidence to `low`
- **User-facing message:** "ICD-10 laterality does not match the CPT modifier. Right-side procedure must pair with right-side diagnosis codes. Correct before submission."

#### Rule 3.5.3 — Missing Approach/Technique (Fracture Care)

- **Trigger:** Fracture care CPT is suggested AND clinical input does not specify approach (closed treatment, open treatment, percutaneous, manipulation)
- **Expected behavior:** Flag missing information. Add to `missing_information[]`.
- **Action type:** **Warn** — add to `missing_information[]`
- **User-facing message:** "Fracture care coding requires the treatment approach (closed, closed with manipulation, open/ORIF, percutaneous). Document the approach to confirm code selection."

#### Rule 3.5.4 — Outpatient Rule-Out Diagnosis

- **Trigger:** Setting = outpatient/office AND ICD-10 code description or clinical input contains "rule out," "suspected," "probable," "possible," "likely"
- **Expected behavior:** Replace with sign/symptom code, flag the substitution.
- **Action type:** **Block** — set `clean_claim_ready: false`, replace diagnosis, add warning, set confidence to `low`
- **User-facing message:** "Outpatient coding rules prohibit rule-out/suspected diagnoses. Code the confirmed condition or the presenting sign/symptom instead."

#### Rule 3.5.5 — Missing Anatomic Specificity

- **Trigger:** Clinical input describes a procedure but lacks specific anatomic site (e.g., "knee injection" without specifying which joint compartment, or "fracture" without bone/location)
- **Expected behavior:** Flag documentation gap. Add to `missing_information[]`.
- **Action type:** **Warn** — add to `missing_information[]`
- **User-facing message:** "Documentation should specify the exact anatomic site (e.g., 'medial meniscus, right knee' rather than 'knee'). More specific documentation supports more specific — and higher-reimbursing — codes."

---

## 4. Commercial-First vs Medicare-Second Handling

### 4.1 Universal Logic (All Payers)

These rules apply regardless of payer and are never overridden:

| Rule | Rationale |
|------|-----------|
| NCCI PTP column-1/column-2 edits (procedure bundling) | NCCI is the national standard; commercial payers adopt these edits |
| Laterality requirement for unilateral MSK procedures | Universal anatomic documentation requirement |
| ICD-10 laterality must match CPT laterality | Clinical accuracy; not payer-specific |
| Outpatient rule-out prohibition | ICD-10 Official Guidelines Section IV applies to all payers |
| Add-on code requires its primary code | CPT definitional requirement |
| Diagnostic arthroscopy bundled into surgical arthroscopy | NCCI universal; no payer override |
| Global period days (0/10/90) per CPT code | CMS-assigned; commercial payers adopt the same global periods |

**MUE Unit Limits — Payer-Differentiated Handling:**

- **Medicare:** MUE is a hard adjudication constraint. Claims exceeding MUE are auto-denied at the claim line level with no manual review.
- **Commercial:** Use CMS MUE values as a conservative default ceiling, but allow payer-configurable override where a documented commercial payer policy sets different unit limits. When a commercial payer's published policy explicitly permits units above the CMS MUE for a specific code, the payer-specific limit takes precedence.

Commercial payer behavior may vary; policy confirmation is required for payer-specific exceptions. When no commercial payer policy is documented, apply CMS MUE values as the safe default.

### 4.2 Payer-Configurable Logic

| Rule | Commercial Behavior | Medicare Behavior | Implementation |
|------|--------------------|--------------------|----------------|
| **Modifier -59 vs X-modifiers** | -59 accepted; X-modifiers optional but preferred | Many MACs reject -59 in favor of XE/XS/XP/XU `[MAC-variable — needs policy confirmation]` | When payer = Medicare, auto-substitute -59 → most-specific X-modifier. When payer = Commercial, accept -59 with informational note. |
| **-25 documentation threshold** | Payer-variable; some require separate note section, most accept inline documentation | Strict: E/M must document MDM or time that is clearly above and beyond the procedure's pre/post work. RAC audit target. | When payer = Medicare, require explicit documentation of separate MDM. When payer = Commercial, warn but do not block. |
| **-57 timing** | Some commercial payers accept -57 only on day-of surgery `[MAC-variable — needs policy confirmation]` | Medicare generally accepts -57 on day-of or day-before major surgery, though MAC interpretation may vary `[MAC-variable — needs policy confirmation]` | When payer = Commercial, flag if -57 is day-before (potential denial). When payer = Medicare, accept day-before but note MAC variability. |
| **Bilateral billing format** | Most accept -50 on single line | Some MACs prefer separate lines with -LT/-RT; others accept -50 at 150% `[MAC-variable — needs policy confirmation]` | When payer = Medicare, add `payer_note`: "Verify MAC preference for bilateral format (-50 vs separate lines with -LT/-RT)." |
| **E/M level support** | MDM or total time accepted | MDM or total time accepted, but MDM documentation requirements are stricter per CMS audit guidelines | When payer = Medicare, add info warning about MDM documentation rigor. |

### 4.3 Known Divergence Points

**Modifier documentation requirements differ:**

| Modifier | Commercial Documentation | Medicare Documentation | Override/Appeal Implication |
|----------|------------------------|----------------------|---------------------------|
| -25 | Inline documentation of separate E/M generally sufficient | Separate identifiable MDM documentation required; auditors look for distinct problem beyond the procedure indication | Medicare denials for -25 are appealable but require chart note showing separate MDM. High administrative cost (~$40/appeal). |
| -59 | Accepted with operative note showing distinct service | Many MACs do not accept -59; must use XE/XS/XP/XU `[MAC-variable — needs policy confirmation]`. Even where accepted, requires documentation of *which* distinction applies. | Medicare -59 denials are auto-adjudicated; appeal requires resubmission with correct X-modifier. |
| -22 | Requires operative note documenting increased complexity | Requires operative note + comparison to typical case; some MACs require additional letter `[MAC-variable — needs policy confirmation]` | Appeal success rate ~40% for Medicare; commercial varies by payer. |
| -50 | Single line with -50 generally accepted | MAC-variable: some require two lines with -LT/-RT at 100%+100%; others accept -50 at 150% `[MAC-variable — needs policy confirmation]` | Format denial — resubmit in correct format. No clinical appeal needed. |

**Safe defaults when payer is unknown or "Not specified":**
- Use X-modifiers over -59 — *Conservative default pending payer/MAC policy confirmation*
- Require laterality documentation — *Universal requirement, not payer-dependent*
- Apply Medicare-level -25 documentation threshold — *Conservative default pending payer/MAC policy confirmation*
- Flag bilateral format ambiguity for user to verify with payer — *Conservative default pending payer/MAC policy confirmation*

---

## 5. Documentation Sufficiency (Beta-Scoped)

### 5.1 Deterministic Documentation Checklist

These are binary (present/absent) checks on the clinical input text. No clinical judgment is required — only pattern detection.

#### Joint Replacement (TKA 27447, THA 27130, TSA 23472)

| Required Element | Detection Pattern | If Missing |
|-----------------|-------------------|------------|
| Laterality | "left" / "right" / "bilateral" / "LT" / "RT" | Block: missing_information |
| Joint specified | "knee" / "hip" / "shoulder" | Block: missing_information |
| Primary vs. revision | "primary" / "revision" / "redo" / "conversion" | Warn: affects code selection (27447 vs 27486/27487) |
| Diagnosis | Any ICD-10 reference or clinical indication (OA, AVN, fracture, RA) | Warn: medical necessity |
| Setting | "inpatient" / "outpatient" / "ASC" | Warn: affects payment; TKA/THA now outpatient-eligible |

#### Arthroscopy (Knee, Shoulder, Hip, Ankle)

| Required Element | Detection Pattern | If Missing |
|-----------------|-------------------|------------|
| Laterality | "left" / "right" / "bilateral" | Block |
| Joint specified | "knee" / "shoulder" / "hip" / "ankle" | Block |
| Procedure performed | "meniscectomy" / "repair" / "debridement" / "chondroplasty" / "loose body" / "acromioplasty" / "RCR" / "SLAP" | Warn: determines specific arthroscopy code |
| Compartment/structure | "medial" / "lateral" / "anterior" / "posterior" / "supraspinatus" / "labrum" | Warn: affects code specificity |

#### Fracture Care

| Required Element | Detection Pattern | If Missing |
|-----------------|-------------------|------------|
| Laterality | "left" / "right" | Block |
| Bone/location | "radius" / "tibia" / "fibula" / "humerus" / "femur" / "metatarsal" / "phalanx" | Block |
| Approach | "closed" / "open" / "ORIF" / "percutaneous" / "IM nail" / "plate" / "screws" | Block: approach determines code |
| Manipulation | "with manipulation" / "without manipulation" / "reduced" / "manipulated" | Warn: for closed treatment variants |
| Fragment count (distal radius) | "2 fragment" / "3 fragment" / "4 fragment" / "comminuted" | Warn: determines 25607 vs 25608 vs 25609 |

#### Joint Injections

| Required Element | Detection Pattern | If Missing |
|-----------------|-------------------|------------|
| Laterality | "left" / "right" / "bilateral" | Block |
| Joint size/name | "finger" / "toe" / "wrist" / "elbow" / "ankle" / "knee" / "shoulder" / "hip" | Block: determines small/intermediate/major |
| Guidance method | "ultrasound" / "US" / "fluoroscopy" / "blind" / "palpation" | Warn: determines with/without guidance code |

### 5.2 Missing-Info Prompt Templates

These are the user-facing prompts displayed in the `missing_information[]` array when documentation gaps are detected.

| Gap | Prompt |
|-----|--------|
| Laterality | "Which side was the procedure performed on? (Left, Right, or Bilateral)" |
| Anatomic site | "Which joint or bone was involved? (e.g., right knee, left distal radius)" |
| Approach (fracture) | "What treatment approach was used? (Closed, closed with manipulation, open/ORIF, percutaneous)" |
| Procedure detail (arthroscopy) | "What was the surgical procedure? (e.g., partial medial meniscectomy, rotator cuff repair)" |
| Guidance method (injection) | "Was imaging guidance used for the injection? (Ultrasound, fluoroscopy, or none)" |
| Primary vs. revision (arthroplasty) | "Is this a primary or revision joint replacement?" |
| Setting | "Where was this procedure performed? (Office, ASC, outpatient hospital, inpatient)" |
| Confirmed diagnosis | "What is the confirmed diagnosis? (Avoid 'rule-out' or 'suspected' — code the confirmed condition or presenting symptom)" |
| Fragment count (distal radius ORIF) | "How many fragments were treated? (2, 3, or 4+ fragments)" |
| Medical necessity | "What is the clinical indication for this procedure? (e.g., osteoarthritis, meniscal tear, displaced fracture)" |

---

## 6. ACC-02 Test Pack Blueprint Input

### 6.1 Minimum Scenario Count per Risk Domain

| Risk Domain | Minimum Scenarios | Rationale |
|-------------|-------------------|-----------|
| NCCI PTP conflicts | 20 | 4 rule types × 5 procedure families (knee, shoulder, hip, ankle, fracture) |
| MUE unit limits | 12 | 6 high-volume codes × 2 scenarios each (at-limit, over-limit) |
| Modifier 59/X misuse | 16 | 4 modifier types × 2 payers × 2 valid/invalid |
| Global period logic | 16 | 4 modifier types (24/25/57/58-78-79) × 2 payers × 2 global durations (0-day, 90-day) |
| Documentation sufficiency | 20 | 5 procedure families × 4 gap types (laterality, approach, specificity, diagnosis) |

**Per-domain floor total: 84 scenarios**

Execution target for ACC-02 is **100+ scenarios**. The per-domain minimums above are floors — no risk domain may have fewer than its defined minimum. Additional scenarios should be distributed across domains to reach the 100+ total, weighted toward domains with higher severity and likelihood rankings from Section 2.2.

**Distribution constraint:** No risk domain may have fewer than its defined minimum; total must be ≥100.

### 6.2 Required Edge-Case Coverage

#### Same-Day Different Physician

- Scenario: Two orthopedic surgeons each perform a procedure on the same patient, same day, same joint
- Test: Modifier -XP should be suggested; -66 (team surgery) should not be used unless documentation supports
- Minimum: 2 scenarios (one valid XP, one invalid where same physician)

#### Bilateral vs Distinct Anatomic Site

- Scenario A: Same procedure on both knees (bilateral → -50 or -LT/-RT)
- Scenario B: Different procedure on left knee vs right knee (distinct → -59/XS)
- Scenario C: Same-joint multi-compartment (medial + lateral meniscectomy → single code 29880, NOT two 29881s)
- Minimum: 4 scenarios

#### Global-Period Overlap

- Scenario A: Patient 3 weeks post-TKA presents for unrelated shoulder problem (E/M with -24)
- Scenario B: Patient 2 weeks post-TKA, return to OR for wound complication (-78)
- Scenario C: Patient 6 weeks post-TKA, planned manipulation under anesthesia (-58)
- Scenario D: E/M same day as joint injection (0-day global + -25)
- Scenario E: Decision-for-surgery E/M day-before TKA (-57)
- Minimum: 6 scenarios

#### Unit Overage and Near-Threshold MUE

- Scenario A: TKA billed with 2 units on single line (exceeds MUE=1) → block
- Scenario B: Bilateral TKA — 1 unit each line with -LT/-RT (valid)
- Scenario C: Joint injection billed with 2 units for 2 different joints (valid if separate lines)
- Scenario D: Joint injection billed with 2 units on single line for same joint (exceeds MUE)
- Minimum: 4 scenarios

#### Missing Laterality / Approach / Anatomic Specificity

- Scenario A: "Knee arthroscopy, meniscectomy" — no laterality → block
- Scenario B: "Distal radius fracture treatment" — no approach → block
- Scenario C: "Shoulder injection" — no guidance specified → warn
- Scenario D: "Joint replacement" — no joint specified → block
- Scenario E: "Right knee surgery" — no procedure detail → warn, low confidence
- Minimum: 6 scenarios

### 6.3 Payer Weighting Guidance

| Payer | Test Weight | Rationale |
|-------|-----------|-----------|
| Commercial/Private | 60% of scenarios | Primary payer target; most beta users |
| Medicare | 35% of scenarios | Secondary target; strictest rules, highest audit risk |
| Payer Not Specified | 5% of scenarios | Test safe-default behavior (should apply Medicare-strict rules) |

Each risk-domain scenario should be tested against at least 2 payer configurations where payer behavior diverges (modifier 59/X, -25 threshold, bilateral format).

### 6.4 Complexity Tiers

| Tier | Definition | Distribution | Examples |
|------|-----------|-------------|----------|
| **Simple** | Single procedure, single diagnosis, clear laterality, no global period conflict | 40% | Right knee injection with OA diagnosis; left TKA primary with osteoarthritis |
| **Moderate** | Single procedure with modifier complexity OR two related procedures OR global period context | 40% | Same-day E/M + knee injection (-25); bilateral shoulder injections (-50); arthroscopy + chondroplasty add-on |
| **Complex** | Multiple procedures with bundling/unbundling, global period overlap, payer-specific modifier logic, or multi-code coordination | 20% | Knee arthroscopy (meniscectomy + chondroplasty + loose body) within TKA global period on Medicare; bilateral ORIF distal radius with different fragment counts per side |

---

## 7. ACC-01 Acceptance Criteria (Go/No-Go)

Each criterion must be independently verifiable. ACC-01 passes when all items are checked.

| # | Criterion | Verification Method |
|---|-----------|-------------------|
| 1 | All 5 risk domains (NCCI PTP, MUE, Modifier 59/X, Global Period, Documentation Sufficiency) have at least one deterministic rule with trigger, behavior, action type, and user message defined | Section 3 review — count rules per domain |
| 2 | Every rule has exactly one action type (`block`, `warn`, or `force-review`) consistent with the Action Semantics contract defined in Section 3.0 | Section 3.0 definition + Section 3 rule audit — no rule has ambiguous, missing, or cross-type behavior |
| 3 | Every `block` rule sets `clean_claim_ready: false` and confidence to `low` per Section 3.0 contract | Section 3 review — cross-reference each `block` rule against Action Semantics |
| 4 | Severity tiers (Critical/High/Medium/Low) are defined with denial/audit consequences | Section 2.1 review |
| 5 | Every failure mode in the taxonomy (Section 2.2) maps to at least one rule in Section 3 | Cross-reference taxonomy rows to rules |
| 6 | Commercial vs Medicare handling explicitly covers: -59 vs X-modifier, -25 threshold, -57 timing, bilateral format, E/M documentation level | Section 4.2 table — all 5 items present |
| 7 | Safe defaults are defined for when payer is unknown, each labeled with confirmation status | Section 4.3 "Safe defaults" — all items labeled |
| 8 | Documentation checklists cover all 4 in-scope procedure families: replacement, arthroscopy, fracture, injection | Section 5.1 — 4 checklists present |
| 9 | Every documentation check is binary (present/absent) — no clinical judgment required | Section 5.1 review — all checks are pattern-based |
| 10 | Missing-info prompt templates are provided for every gap type in the checklists | Section 5.2 — cross-reference with 5.1 gaps |
| 11 | ACC-02 blueprint specifies per-domain minimum floors (≥84) and execution target (≥100) with distribution constraint | Section 6.1 — table, target statement, and constraint present |
| 12 | All 5 required edge cases are covered in ACC-02 blueprint with minimum scenario counts | Section 6.2 — all 5 subsections present |
| 13 | Rule references are version-anchored to specific NCCI/MUE editions and CPT/ICD-10 years | Header "Rule Edition Anchors" |
| 14 | Out-of-scope boundaries explicitly exclude spine, pain management, sports medicine, Medicaid, workers' comp | Section 1.2 table |
| 15 | No rule requires AI/LLM judgment to evaluate — all triggers are deterministic on structured fields or keyword patterns | Sections 3 and 5 review |
| 16 | MUE handling differentiates Medicare (hard constraint) from commercial (conservative default with payer-configurable override) | Section 4.1 MUE paragraph |
| 17 | All MAC-variable behaviors are tagged `[MAC-variable — needs policy confirmation]` | Sections 3, 4.2, 4.3 review |

---

## 8. Open Decisions / Policy Confirmations Needed

| # | Item | Status | Impact if Unresolved |
|---|------|--------|---------------------|
| 1 | **NCCI PTP data source**: Will we license CMS NCCI PTP edit files directly, or use a third-party API (e.g., Codify, AAPC)? Licensing determines how frequently we can update and whether we can redistribute. | Needs policy confirmation | Cannot implement deterministic PTP checks without data source |
| 2 | **MUE data source**: Same as above — CMS publishes MUE quarterly, but integrating requires either direct file parsing or a licensed API. | Needs policy confirmation | Cannot implement unit-limit checks without data source |
| 3 | **MAC-specific bilateral format rules**: Medicare bilateral billing format (-50 vs -LT/-RT on separate lines) varies by MAC jurisdiction. Do we maintain a MAC lookup table, or always warn and defer to the user? | Needs policy confirmation | Affects Rule 3.3 and Section 4.2 bilateral handling |
| 4 | **-25 documentation threshold**: The line between "separately identifiable" and "part of the procedure" is inherently clinical. For beta, do we block-on-missing-documentation or warn-only? Current spec says force-review. | Needs policy confirmation | Determines aggressiveness of -25 enforcement |
| 5 | **Global period tracking**: ClaimVex currently receives global period status as a user-provided context field. Should we build a session-based global period tracker (remembering prior surgeries), or rely on user input for beta? | Needs policy confirmation | Affects reliability of Rules 3.4.1 and 3.4.4 |
| 6 | **Commercial payer coverage policies**: Commercial payers have their own coverage policies (equivalent to Medicare LCDs). Do we integrate any commercial payer policy databases in v1, or treat all commercial payers as a single rule set? | Needs policy confirmation | Scope of payer-configurable logic |
| 7 | **Rule override workflow**: When a deterministic rule fires a `block`, can the user override it with an attestation (e.g., "I have documentation supporting this")? If so, do we log the override for compliance? | Needs policy confirmation | UX and compliance implications |
| 8 | **Diagnosis grouping divergence**: Trauma fracture care has different documentation requirements (mechanism of injury, fragment count) vs. degenerative joint disease (failed conservative treatment, duration). Do we implement separate documentation checklists per grouping now, or defer sub-grouping to v2? | Needs policy confirmation | Affects Section 5.1 checklist granularity |
| 9 | **Confidence threshold for clean_claim_ready**: If the AI model returns confidence = "low," should `clean_claim_ready` always be `false` regardless of whether deterministic rules pass? | Needs policy confirmation | Defines interaction between AI confidence and deterministic rules |
| 10 | **Audit trail / logging requirements**: Should every rule evaluation (pass/fail) be logged server-side for compliance audit trail, or is client-side logging sufficient for beta? | Needs policy confirmation | Affects architecture of rule engine and storage requirements |
| 11 | **Commercial payer MUE overrides**: When a commercial payer's published policy permits units above the CMS MUE for a specific code, what is the required evidence standard to activate the override (e.g., payer contract, published policy PDF, fee schedule)? | Needs policy confirmation | Affects Section 4.1 MUE override implementation |
