# ACC-02: De-Identified Test Pack v1

**Status:** Final v1
**Owner:** Execution Board
**Scope:** Orthopedics v1 Beta — pressures all 18 ACC-01 deterministic rules
**Created:** 2026-02-28
**Depends on:** ACC-01 Final v1 (specs/ACC-01-accuracy-spec-final-v1.md)
**Consumed by:** ACC-13 (Evaluation Harness), ACC-09 (Red-Team Pass), ACC-10 (Patch Sprint), ACC-14 (Regression)
**Canonical data:** `specs/ACC-02-scenarios.jsonl` (109 scenarios, all fields)

---

## 1. Scenario Distribution Table

### 1.1 By Domain × Payer × Complexity

**Total scenarios: 109** (≥100 ✓)

| Domain (primary) | COM | MCR | NS | Total (primary) | Cross-domain touches | Effective total |
|------------------|-----|-----|----|-----------------|---------------------|-----------------|
| PTP | 11 | 8 | 1 | 20 | +7 | 27 |
| MUE | 8 | 3 | 1 | 12 | +4 | 16 |
| MODIFIER | 7 | 8 | 1 | 16 | +5 | 21 |
| GLOBAL | 10 | 5 | 1 | 16 | +7 | 23 |
| DOC_SUFFICIENCY | 11 | 8 | 1 | 20 | +11 | 31 |
| CROSS_DOMAIN | 8 | 7 | 0 | 15 | — | 15 |
| CLEAN_PASS | 7 | 3 | 0 | 10 | — | 10 |
| **Totals** | **62** | **42** | **5** | **109** | | |

**Payer weight:** COM 57% / MCR 39% / NS 5% (target 60/35/5 — within tolerance, Medicare elevated because R-3.3.1 requires Medicare payer)

**Per-domain payer constraint check:** Each of the 5 risk domains has ≥2 Medicare and ≥1 Not-Specified ✓

| Complexity | Count | Pct | Target |
|-----------|-------|-----|--------|
| Simple | 43 | 39% | 40% |
| Moderate | 44 | 40% | 40% |
| Complex | 22 | 20% | 20% |

**All floors met:**
- PTP: 27 ≥ 20 ✓
- MUE: 16 ≥ 12 ✓
- MODIFIER: 21 ≥ 16 ✓
- GLOBAL: 23 ≥ 16 ✓
- DOC_SUFFICIENCY: 31 ≥ 20 ✓
- Cross-domain: 15 ≥ 15 ✓
- Clean pass: 10 ≥ 10 ✓
- Total: 109 ≥ 100 ✓

---

## 2. Coverage Matrix

### 2.1 ACC-01 Rule Coverage (all 18 rules)

| Rule | Description | Scenario IDs (primary + cross-domain) | Count |
|------|-------------|--------------------------------------|-------|
| R-3.1.1 | Arthroscopy + open, same joint | 001,002,003,004,005,085,090,092,099 | 9 |
| R-3.1.2 | Injection + arthroscopy, same joint | 006,007,008,009,010,086,093 | 7 |
| R-3.1.3 | Cast/splint + fracture care | 011,012,013,014,095 | 5 |
| R-3.1.4 | Diagnostic + surgical arthroscopy | 015,016,017,018,019,020,090 | 7 |
| R-3.2.1 | Unit exceeds MUE | 021,022,023,024,025,026,088,091,097,099 | 10 |
| R-3.2.2 | Near-threshold MUE | 027,028,029,030,031,032 | 6 |
| R-3.3.1 | Medicare -59 → X-modifier | 033,034,035,036,037,038,090,096,098 | 9 |
| R-3.3.2 | -59/X without documentation | 039,040,041,042,043,089,097 | 7 |
| R-3.3.3 | Commercial -59 acceptable | 044,045,046,047,048 | 5 |
| R-3.4.1 | E/M in 90-day global, no modifier | 049,050,051,052,087,092,098 | 7 |
| R-3.4.2 | E/M + 0-day global, no -25 | 053,054,055,056,086,094,096 | 7 |
| R-3.4.3 | Decision-for-surgery, no -57 | 057,058,059,060 | 4 |
| R-3.4.4 | Procedure in global, no modifier | 061,062,063,064,091 | 5 |
| R-3.5.1 | Missing laterality | 065,066,067,068,069,085,087,088,089,090,092,099 | 12 |
| R-3.5.2 | ICD-10 laterality mismatch | 070,071,072,073,092 | 5 |
| R-3.5.3 | Missing approach (fracture) | 074,075,076,077,095 | 5 |
| R-3.5.4 | Outpatient rule-out diagnosis | 078,079,080,081,093,098 | 6 |
| R-3.5.5 | Missing anatomic specificity | 082,083,084,094 | 4 |

**Rules with zero coverage: 0** ✓

### 2.2 Edge-Case Coverage

| Edge Case | Required | Actual | Scenario IDs |
|-----------|----------|--------|-------------|
| same_day_different_physician | ≥2 | 2 | 036, 037 |
| bilateral_vs_distinct | ≥4 | 5 | 005, 021, 044, 046, 100 |
| global_period_overlap | ≥6 | 8 | 049, 050, 057, 058, 061, 062, 087, 091 |
| mue_unit_threshold | ≥4 | 8 | 021, 022, 023, 025, 027, 028, 029, 031 |
| missing_documentation | ≥6 | 8 | 065, 066, 070, 074, 078, 082, 083, 084 |

All edge-case minimums met ✓

---

## 3. Top 15 High-Risk Scenarios

Selected by: (1) Critical severity, (2) cross-domain rule count, (3) payer divergence, (4) complex tier + edge tags.

| Priority | ID | Domains | Rules Hit | Action | Payer | Tier | Summary |
|----------|----|---------|-----------|--------|-------|------|---------|
| 1 | 092 | PTP+GLOBAL+DOC | R-3.1.1, R-3.4.1, R-3.5.2 | block | MCR | complex | Scope+open in 90-day global with ICD-10 laterality mismatch |
| 2 | 090 | PTP+MOD+DOC | R-3.1.4, R-3.3.1, R-3.5.1 | block | MCR | complex | Diag+surg scope, Medicare -59, missing laterality |
| 3 | 098 | GLOBAL+DOC+MOD | R-3.4.1, R-3.5.4, R-3.3.1 | block | MCR | complex | E/M in 90-day global, rule-out dx, Medicare -59 |
| 4 | 099 | PTP+MUE+DOC | R-3.1.1, R-3.2.1, R-3.5.1 | block | NS | complex | Scope+open, units exceed MUE, missing laterality |
| 5 | 097 | MUE+MOD | R-3.2.1, R-3.3.2 | block | COM | complex | Units exceed MUE + -59 without documentation |
| 6 | 091 | GLOBAL+MUE | R-3.4.4, R-3.2.1 | block | COM | complex | Procedure in 90-day global + units exceed MUE |
| 7 | 085 | PTP+DOC | R-3.1.1, R-3.5.1 | block | COM | complex | Scope+TKA same knee, missing laterality |
| 8 | 086 | PTP+GLOBAL | R-3.1.2, R-3.4.2 | block | MCR | complex | Injection+scope same joint + E/M without -25 |
| 9 | 093 | PTP+DOC | R-3.1.2, R-3.5.4 | block | COM | complex | Injection+scope + rule-out diagnosis |
| 10 | 089 | MOD+DOC | R-3.3.2, R-3.5.1 | block | COM | complex | -XS without documentation + missing laterality |
| 11 | 036 | MOD | R-3.3.1 | force-review | MCR | complex | Two physicians, -59 instead of -XP |
| 12 | 037 | MOD | R-3.3.2 | block | MCR | moderate | Same physician incorrectly claiming -XP |
| 13 | 061 | GLOBAL | R-3.4.4 | block | COM | complex | Knee scope during active 90-day TKA global |
| 14 | 021 | MUE | R-3.2.1 | block | COM | simple | TKA billed 2 units single line |
| 15 | 070 | DOC | R-3.5.2 | block | COM | moderate | Right TKA with left-side ICD-10 |

---

## 4. Full Scenario Catalog

Grouped by primary domain. All fields per ACC-02 schema. Canonical machine-readable data in `specs/ACC-02-scenarios.jsonl`.

Legend: `lat`=laterality, `pt`=patient_type, `set`=setting, `pay`=payer_type, `gp`=global_period_status, `gp_date`=surgery_date, `gp_cpt`=surgery_cpt, `phy`=physician_id

---

### 4.1 NCCI PTP (ACC02-001 through ACC02-020)

**ACC02-001** | PTP | arthroscopy_open_bundling | simple | COM
58yo F, R knee end-stage OA, arthroscopy + TKA same session
> Pt with severe R knee OA. Arthroscopic evaluation performed confirming tricompartmental disease. Proceeded to R total knee arthroplasty.
`lat:right pt:established set:outpatient pay:commercial gp:none units:{29881:1,27447:1} mods:{} cpts:[29881,27447] icd:[M17.11] phy:PHY-001`
→ R-3.1.1 | block | clean:F | conf:low | sup:[29881] | miss:[] | edge:[]
Block: knee arthroscopy bundled into TKA per NCCI. Suppress 29881.

**ACC02-002** | PTP | arthroscopy_open_bundling | moderate | MCR
71yo M, R shoulder massive rotator cuff tear, scope + open repair
> Medicare pt with chronic R shoulder pain. Arthroscopic exam showed massive RCR tear not amenable to arthroscopic repair. Converted to open rotator cuff repair.
`lat:right pt:established set:outpatient pay:medicare gp:none units:{29805:1,23412:1} mods:{} cpts:[29805,23412] icd:[M75.121] phy:PHY-001`
→ R-3.1.1 | block | clean:F | conf:low | sup:[29805] | miss:[] | edge:[]
Block: shoulder arthroscopy bundled into open RCR per NCCI. Suppress 29805.

**ACC02-003** | PTP | arthroscopy_open_bundling | moderate | COM
64yo F, L hip OA, scope + THA same session
> Pt with progressive L hip OA. Arthroscopic evaluation performed, confirmed severe articular cartilage loss. Proceeded to L total hip arthroplasty.
`lat:left pt:established set:outpatient pay:commercial gp:none units:{29860:1,27130:1} mods:{} cpts:[29860,27130] icd:[M16.12] phy:PHY-001`
→ R-3.1.1 | block | clean:F | conf:low | sup:[29860] | miss:[] | edge:[]
Block: hip arthroscopy bundled into THA per NCCI. Suppress 29860.

**ACC02-004** | PTP | arthroscopy_open_bundling | moderate | MCR
55yo M, R ankle loose body + open Achilles repair
> Medicare pt with R ankle impingement and chronic Achilles tendinopathy. Arthroscopic loose body removal followed by open Achilles repair same session.
`lat:right pt:established set:outpatient pay:medicare gp:none units:{29894:1,27650:1} mods:{} cpts:[29894,27650] icd:[M71.371,M76.61] phy:PHY-001`
→ R-3.1.1 | block | clean:F | conf:low | sup:[29894] | miss:[] | edge:[]
Block: ankle arthroscopy bundled into open Achilles repair per NCCI. Suppress 29894.

**ACC02-005** | PTP | arthroscopy_open_bundling_negative | complex | COM
52yo M, bilateral knees, R knee scope + L knee open ligament repair
> Pt with R knee medial meniscus tear and L knee chronic MCL instability. R knee arthroscopic meniscectomy and separate L knee open collateral ligament repair performed same day by same surgeon.
`lat:bilateral pt:established set:ASC pay:commercial gp:none units:{29881:1,27405:1} mods:{29881:["-RT"],27405:["-LT"]} cpts:[29881,27405] icd:[M23.211,M24.262] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[bilateral_vs_distinct]
Pass: different joints (R knee vs L knee), no PTP conflict.

**ACC02-006** | PTP | injection_arthroscopy_bundling | moderate | COM
49yo M, R knee OA, injection + arthroscopy same knee same day
> Pt with R knee OA. Corticosteroid injection into R knee joint followed by R knee arthroscopic debridement same encounter.
`lat:right pt:established set:ASC pay:commercial gp:none units:{20610:1,29877:1} mods:{} cpts:[20610,29877] icd:[M17.11] phy:PHY-001`
→ R-3.1.2 | block | clean:F | conf:low | sup:[20610] | miss:[] | edge:[]
Block: knee injection bundled into knee arthroscopy per NCCI. Suppress 20610.

**ACC02-007** | PTP | injection_arthroscopy_bundling | moderate | MCR
68yo F, L shoulder impingement, injection + scope same shoulder
> Medicare pt with L shoulder impingement syndrome. Intra-articular L shoulder injection and L shoulder arthroscopic subacromial decompression same session.
`lat:left pt:established set:outpatient pay:medicare gp:none units:{20610:1,29826:1} mods:{} cpts:[20610,29826] icd:[M75.102] phy:PHY-001`
→ R-3.1.2 | block | clean:F | conf:low | sup:[20610] | miss:[] | edge:[]
Block: shoulder injection bundled into shoulder arthroscopy per NCCI. Suppress 20610.

**ACC02-008** | PTP | injection_arthroscopy_bundling | simple | COM
57yo M, R hip OA, injection + hip scope same day
> Pt with R hip OA. R hip joint injection and R hip arthroscopic chondroplasty performed same encounter.
`lat:right pt:established set:ASC pay:commercial gp:none units:{20610:1,29862:1} mods:{} cpts:[20610,29862] icd:[M16.11] phy:PHY-001`
→ R-3.1.2 | block | clean:F | conf:low | sup:[20610] | miss:[] | edge:[]
Block: hip injection bundled into hip arthroscopy per NCCI. Suppress 20610.

**ACC02-009** | PTP | injection_arthroscopy_negative | simple | COM
45yo F, R knee injection + L shoulder scope, different joints
> Pt with R knee OA and L shoulder impingement. R knee corticosteroid injection and L shoulder arthroscopic acromioplasty same day.
`lat:bilateral pt:established set:ASC pay:commercial gp:none units:{20610:1,29826:1} mods:{20610:["-RT"],29826:["-LT"]} cpts:[20610,29826] icd:[M17.11,M75.102] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: injection and arthroscopy on different joints, no PTP bundling conflict.

**ACC02-010** | PTP | injection_arthroscopy_bundling | moderate | MCR
62yo M, L ankle effusion, injection + ankle scope same ankle
> Medicare pt with L ankle effusion and synovitis. L ankle aspiration/injection and L ankle arthroscopic synovectomy same session.
`lat:left pt:established set:outpatient pay:medicare gp:none units:{20605:1,29895:1} mods:{} cpts:[20605,29895] icd:[M71.072] phy:PHY-001`
→ R-3.1.2 | block | clean:F | conf:low | sup:[20605] | miss:[] | edge:[]
Block: ankle injection bundled into ankle arthroscopy per NCCI. Suppress 20605.

**ACC02-011** | PTP | cast_fracture_bundling | simple | COM
34yo M, R tibial shaft fracture, closed reduction + short leg splint
> Pt with R tibial shaft fracture. Closed reduction with manipulation performed. Short leg splint applied.
`lat:right pt:new set:outpatient pay:commercial gp:none units:{27752:1,29515:1} mods:{} cpts:[27752,29515] icd:[S82.101A] phy:PHY-001`
→ R-3.1.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: splint application included in fracture care code. Informational only.

**ACC02-012** | PTP | cast_fracture_bundling | simple | COM
28yo F, L distal radius fracture, ORIF + long leg splint (different site)
> Pt with L distal radius fracture s/p ORIF. Long leg splint also applied for concurrent lower extremity injury management.
`lat:left pt:new set:outpatient pay:commercial gp:none units:{25607:1,29505:1} mods:{} cpts:[25607,29505] icd:[S52.502A] phy:PHY-001`
→ R-3.1.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: cast/splint + fracture care triggers rule. Message notes remove unless different site.

**ACC02-013** | PTP | cast_fracture_bundling | simple | MCR
72yo F, R tibial shaft fracture, IM nail + long leg splint
> Medicare pt with R tibial shaft fracture treated with intramedullary nail. Long leg splint applied post-operatively.
`lat:right pt:new set:outpatient pay:medicare gp:none units:{27759:1,29505:1} mods:{} cpts:[27759,29505] icd:[S82.101A] phy:PHY-001`
→ R-3.1.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: splint included in fracture care per NCCI.

**ACC02-014** | PTP | cast_fracture_bundling | simple | NS
41yo M, R distal radius fracture, closed treatment + ankle strapping
> Pt with R distal radius fracture. Closed treatment without manipulation. Ankle strapping also applied for unrelated ankle sprain.
`lat:right pt:new set:office pay:not_specified gp:none units:{25600:1,29540:1} mods:{} cpts:[25600,29540] icd:[S52.501A,S93.401A] phy:PHY-001`
→ R-3.1.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: cast/splint + fracture triggers rule, but different anatomic sites.

**ACC02-015** | PTP | diagnostic_surgical_scope | simple | COM
38yo M, R knee, diagnostic scope + surgical meniscectomy
> Pt with R knee pain. Diagnostic arthroscopy performed, identified medial meniscus tear. Proceeded to partial medial meniscectomy same session.
`lat:right pt:established set:ASC pay:commercial gp:none units:{29870:1,29881:1} mods:{} cpts:[29870,29881] icd:[M23.211] phy:PHY-001`
→ R-3.1.4 | block | clean:F | conf:low | sup:[29870] | miss:[] | edge:[]
Block: diagnostic arthroscopy bundled into surgical arthroscopy. Suppress 29870.

**ACC02-016** | PTP | diagnostic_surgical_scope | moderate | MCR
66yo F, L shoulder, diagnostic scope + arthroscopic RCR
> Medicare pt with L shoulder pain. Diagnostic shoulder arthroscopy confirmed full-thickness supraspinatus tear. Proceeded to arthroscopic rotator cuff repair.
`lat:left pt:established set:outpatient pay:medicare gp:none units:{29805:1,29827:1} mods:{} cpts:[29805,29827] icd:[M75.122] phy:PHY-001`
→ R-3.1.4 | block | clean:F | conf:low | sup:[29805] | miss:[] | edge:[]
Block: diagnostic scope bundled into surgical scope. Suppress 29805.

**ACC02-017** | PTP | diagnostic_surgical_scope | simple | COM
50yo M, R hip, diagnostic scope + chondroplasty
> Pt with R hip pain and labral pathology. Diagnostic hip arthroscopy followed by arthroscopic chondroplasty of femoral head.
`lat:right pt:established set:ASC pay:commercial gp:none units:{29860:1,29862:1} mods:{} cpts:[29860,29862] icd:[M16.11] phy:PHY-001`
→ R-3.1.4 | block | clean:F | conf:low | sup:[29860] | miss:[] | edge:[]
Block: diagnostic hip scope bundled into surgical scope. Suppress 29860.

**ACC02-018** | PTP | diagnostic_surgical_scope | moderate | MCR
44yo F, R knee, diagnostic scope + meniscus repair
> Medicare pt with R knee locking. Diagnostic arthroscopy identified bucket-handle medial meniscus tear. Arthroscopic meniscus repair performed.
`lat:right pt:established set:ASC pay:medicare gp:none units:{29870:1,29882:1} mods:{} cpts:[29870,29882] icd:[M23.211] phy:PHY-001`
→ R-3.1.4 | block | clean:F | conf:low | sup:[29870] | miss:[] | edge:[]
Block: diagnostic scope bundled into surgical meniscus repair. Suppress 29870.

**ACC02-019** | PTP | diagnostic_surgical_scope | moderate | COM
59yo M, L shoulder, diagnostic scope + extensive debridement
> Pt with L shoulder adhesive capsulitis and impingement. Diagnostic scope followed by arthroscopic extensive debridement.
`lat:left pt:established set:ASC pay:commercial gp:none units:{29805:1,29823:1} mods:{} cpts:[29805,29823] icd:[M75.02] phy:PHY-001`
→ R-3.1.4 | block | clean:F | conf:low | sup:[29805] | miss:[] | edge:[]
Block: diagnostic scope bundled into surgical scope. Suppress 29805.

**ACC02-020** | PTP | arthroscopy_open_bundling | complex | MCR
69yo M, R knee loose body removal (scope) + open arthrotomy same knee
> Medicare pt with R knee OA and mechanical symptoms. Arthroscopic loose body removal followed by open arthrotomy for extensive synovectomy same session.
`lat:right pt:established set:outpatient pay:medicare gp:none units:{29874:1,27331:1} mods:{} cpts:[29874,27331] icd:[M17.11,M25.361] phy:PHY-001`
→ R-3.1.1 | block | clean:F | conf:low | sup:[29874] | miss:[] | edge:[]
Block: arthroscopy bundled into open arthrotomy per NCCI. Suppress 29874.

---

### 4.2 MUE Unit Limits (ACC02-021 through ACC02-032)

**ACC02-021** | MUE | mue_unit_overage | simple | COM
67yo F, bilateral TKA billed as 2 units on single line
> Pt with bilateral knee OA. Bilateral total knee arthroplasty performed. Billed as 27447 × 2 units on one claim line.
`lat:bilateral pt:established set:outpatient pay:commercial gp:none units:{27447:2} mods:{} cpts:[27447] icd:[M17.0] phy:PHY-001`
→ R-3.2.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[mue_unit_threshold,bilateral_vs_distinct]
Block: TKA units (2) exceed MUE limit (1). Use separate lines with -LT/-RT or -50.

**ACC02-022** | MUE | mue_unit_overage | simple | MCR
73yo M, bilateral THA billed as 2 units single line
> Medicare pt with bilateral hip OA. Bilateral THA performed. Billed as 27130 × 2 units on one claim line.
`lat:bilateral pt:established set:outpatient pay:medicare gp:none units:{27130:2} mods:{} cpts:[27130] icd:[M16.0] phy:PHY-001`
→ R-3.2.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[mue_unit_threshold]
Block: THA units (2) exceed MUE limit (1). Medicare auto-denies.

**ACC02-023** | MUE | mue_unit_overage | moderate | COM
42yo M, R knee meniscectomy billed 2 units
> Pt with R knee medial and lateral meniscus tears. Meniscectomy billed as 29881 × 2 units.
`lat:right pt:established set:ASC pay:commercial gp:none units:{29881:2} mods:{} cpts:[29881] icd:[M23.211,M23.261] phy:PHY-001`
→ R-3.2.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[mue_unit_threshold]
Block: meniscectomy units (2) exceed MUE (1). Medial + lateral = 29880 (single code), not 29881 × 2.

**ACC02-024** | MUE | mue_unit_overage | moderate | COM
58yo F, bilateral shoulder RCR billed 2 units single line
> Pt with bilateral rotator cuff tears. Arthroscopic RCR billed as 29827 × 2 units.
`lat:bilateral pt:established set:ASC pay:commercial gp:none units:{29827:2} mods:{} cpts:[29827] icd:[M75.120] phy:PHY-001`
→ R-3.2.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: RCR units (2) exceed MUE (1). Use separate lines with -LT/-RT.

**ACC02-025** | MUE | mue_unit_overage | simple | COM
55yo M, R knee + R shoulder injections billed as 2 units on single 20610 line
> Pt with R knee OA and R shoulder bursitis. Both major joint injections billed as 20610 × 2 units on single claim line.
`lat:right pt:established set:office pay:commercial gp:none units:{20610:2} mods:{} cpts:[20610] icd:[M17.11,M75.111] phy:PHY-001`
→ R-3.2.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[mue_unit_threshold]
Block: injection units (2) exceed MUE (1). Bill as separate lines per joint.

**ACC02-026** | MUE | mue_unit_overage | moderate | NS
48yo M, bilateral distal radius ORIF billed 2 units
> Pt with bilateral distal radius fractures. ORIF billed as 25607 × 2 units on single line.
`lat:bilateral pt:new set:outpatient pay:not_specified gp:none units:{25607:2} mods:{} cpts:[25607] icd:[S52.501A,S52.502A] phy:PHY-001`
→ R-3.2.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: ORIF units (2) exceed MUE (1). Use separate lines with -LT/-RT.

**ACC02-027** | MUE | mue_near_threshold | simple | COM
65yo F, R TKA, 1 unit (at MUE limit)
> Pt with R knee OA. R TKA performed. Billed as 27447 × 1 unit.
`lat:right pt:established set:outpatient pay:commercial gp:none units:{27447:1} mods:{27447:["-RT"]} cpts:[27447] icd:[M17.11] phy:PHY-001`
→ R-3.2.2 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[mue_unit_threshold]
Warn: units at MUE maximum. Informational only.

**ACC02-028** | MUE | mue_near_threshold | simple | MCR
74yo F, L THA, 1 unit
> Medicare pt with L hip OA. L THA performed. Billed as 27130 × 1 unit.
`lat:left pt:established set:outpatient pay:medicare gp:none units:{27130:1} mods:{27130:["-LT"]} cpts:[27130] icd:[M16.12] phy:PHY-001`
→ R-3.2.2 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[mue_unit_threshold]
Warn: units at MUE maximum. Informational only.

**ACC02-029** | MUE | mue_near_threshold | simple | COM
39yo M, R knee meniscectomy, 1 unit
> Pt with R knee medial meniscus tear. Arthroscopic partial medial meniscectomy. Billed 29881 × 1 unit.
`lat:right pt:established set:ASC pay:commercial gp:none units:{29881:1} mods:{29881:["-RT"]} cpts:[29881] icd:[M23.211] phy:PHY-001`
→ R-3.2.2 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[mue_unit_threshold]
Warn: units at MUE maximum. Informational only.

**ACC02-030** | MUE | mue_near_threshold | simple | MCR
61yo F, L shoulder arthroscopic RCR, 1 unit
> Medicare pt with L shoulder full-thickness supraspinatus tear. Arthroscopic RCR performed. Billed 29827 × 1.
`lat:left pt:established set:outpatient pay:medicare gp:none units:{29827:1} mods:{29827:["-LT"]} cpts:[29827] icd:[M75.122] phy:PHY-001`
→ R-3.2.2 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: units at MUE maximum. Informational only.

**ACC02-031** | MUE | mue_near_threshold | simple | COM
53yo M, R knee injection, 1 unit
> Pt with R knee OA. R knee corticosteroid injection performed. Billed 20610 × 1.
`lat:right pt:established set:office pay:commercial gp:none units:{20610:1} mods:{20610:["-RT"]} cpts:[20610] icd:[M17.11] phy:PHY-001`
→ R-3.2.2 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[mue_unit_threshold]
Warn: units at MUE maximum. Informational only.

**ACC02-032** | MUE | mue_near_threshold | simple | MCR
36yo F, L distal radius ORIF, 1 unit
> Medicare pt with L distal radius fracture, 3 fragments. Open reduction internal fixation performed. Billed 25608 × 1.
`lat:left pt:new set:outpatient pay:medicare gp:none units:{25608:1} mods:{25608:["-LT"]} cpts:[25608] icd:[S52.502A] phy:PHY-001`
→ R-3.2.2 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: units at MUE maximum. Informational only.

---

### 4.3 Modifier 59/X Misuse (ACC02-033 through ACC02-048)

**ACC02-033** | MODIFIER | medicare_59_to_xs | moderate | MCR
70yo M, R knee scope meniscectomy + chondroplasty different compartment, -59
> Medicare pt. R knee medial meniscectomy and lateral chondroplasty. Different compartments documented. Modifier -59 applied to second code.
`lat:right pt:established set:ASC pay:medicare gp:none units:{29881:1,29877:1} mods:{29877:["-59","-RT"]} cpts:[29881,29877] icd:[M23.211,M17.11] phy:PHY-001`
→ R-3.3.1 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: Medicare -59 should be -XS (separate structure). Replace and confirm.

**ACC02-034** | MODIFIER | medicare_59_to_xs | moderate | MCR
67yo F, L shoulder scope decompression + distal claviculectomy, -59
> Medicare pt. L shoulder arthroscopic subacromial decompression and distal claviculectomy. Modifier -59 on second code.
`lat:left pt:established set:outpatient pay:medicare gp:none units:{29826:1,29824:1} mods:{29824:["-59","-LT"]} cpts:[29826,29824] icd:[M75.102,M19.012] phy:PHY-001`
→ R-3.3.1 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: Medicare -59 should be -XS. Replace and confirm.

**ACC02-035** | MODIFIER | medicare_59_to_xe | moderate | MCR
68yo M, R knee injection AM + R knee E/M PM, -59
> Medicare pt. R knee injection in morning, returned for E/M visit in afternoon same day. Modifier -59 on E/M.
`lat:right pt:established set:office pay:medicare gp:none units:{20610:1,99214:1} mods:{99214:["-59","-25"]} cpts:[20610,99214] icd:[M17.11] phy:PHY-001`
→ R-3.3.1 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: Medicare -59 should be -XE (separate encounter). Replace and confirm.

**ACC02-036** | MODIFIER | medicare_59_to_xp | complex | MCR
66yo F, R knee, two surgeons same day same knee, -59
> Medicare pt. Surgeon A performed R knee arthroscopic meniscectomy. Surgeon B performed R knee injection different service. Modifier -59 applied by Surgeon B.
`lat:right pt:established set:ASC pay:medicare gp:none units:{29881:1,20610:1} mods:{20610:["-59","-RT"]} cpts:[29881,20610] icd:[M23.211,M17.11] phy:PHY-002`
→ R-3.3.1 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[same_day_different_physician]
Force-review: Medicare -59 should be -XP (separate practitioner). Replace and confirm.

**ACC02-037** | MODIFIER | modifier_without_documentation | moderate | MCR
60yo M, R knee scope + R knee injection same physician, claims -XP
> Medicare pt. Same surgeon performed R knee arthroscopy and R knee injection same session. Modifier -XP applied despite same physician.
`lat:right pt:established set:ASC pay:medicare gp:none units:{29881:1,20610:1} mods:{20610:["-XP","-RT"]} cpts:[29881,20610] icd:[M23.211] phy:PHY-001`
→ R-3.3.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[same_day_different_physician]
Block: -XP requires separate practitioner. Documentation shows same physician. Modifier unsupported.

**ACC02-038** | MODIFIER | medicare_59_to_xu | moderate | MCR
72yo F, R shoulder injection + E/M, -59
> Medicare pt. R shoulder injection and separately identifiable E/M. Modifier -59 on injection code.
`lat:right pt:established set:office pay:medicare gp:none units:{20610:1,99213:1} mods:{20610:["-59"]} cpts:[20610,99213] icd:[M19.011] phy:PHY-001`
→ R-3.3.1 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: Medicare -59 should be -XU or -25 on E/M. Replace and confirm.

**ACC02-039** | MODIFIER | modifier_without_documentation | moderate | COM
47yo M, R knee two procedures, -59 but no distinct service documented
> Pt had R knee arthroscopic debridement and chondroplasty. Note describes single continuous procedure. Modifier -59 applied to second code.
`lat:right pt:established set:ASC pay:commercial gp:none units:{29877:1,29879:1} mods:{29879:["-59"]} cpts:[29877,29879] icd:[M17.11] phy:PHY-001`
→ R-3.3.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: -59 requires documentation of distinct service. Note shows single continuous procedure.

**ACC02-040** | MODIFIER | modifier_without_documentation | moderate | MCR
65yo F, L shoulder two procedures, -XS but no separate structure documented
> Medicare pt. L shoulder arthroscopic debridement and lysis of adhesions. -XS applied but note does not identify separate structures.
`lat:left pt:established set:outpatient pay:medicare gp:none units:{29822:1,29825:1} mods:{29825:["-XS"]} cpts:[29822,29825] icd:[M75.02] phy:PHY-001`
→ R-3.3.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: -XS requires separate structure documentation. Not present in note.

**ACC02-041** | MODIFIER | modifier_without_documentation | moderate | COM
51yo F, bilateral knee injections, -59 but documentation vague
> Pt with bilateral knee OA. Both knees injected. Modifier -59 applied but note does not clearly identify bilateral or distinct service.
`lat:bilateral pt:established set:office pay:commercial gp:none units:{20610:1,20610:1} mods:{20610:["-59"]} cpts:[20610] icd:[M17.0] phy:PHY-001`
→ R-3.3.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: -59 without clear documentation of distinct bilateral service.

**ACC02-042** | MODIFIER | modifier_without_documentation | complex | MCR
63yo M, R hip procedures, -XE but same encounter documented
> Medicare pt. R hip injection and R hip arthroscopy. -XE applied but note documents both performed in single encounter.
`lat:right pt:established set:ASC pay:medicare gp:none units:{20610:1,29862:1} mods:{20610:["-XE"]} cpts:[20610,29862] icd:[M16.11] phy:PHY-001`
→ R-3.3.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: -XE requires separate encounter. Note shows same encounter.

**ACC02-043** | MODIFIER | modifier_without_documentation | moderate | NS
54yo M, R knee procedures, -59 without distinct documentation, payer unknown
> Pt with R knee. Arthroscopic debridement and microfracture. -59 applied, no distinct service language.
`lat:right pt:established set:ASC pay:not_specified gp:none units:{29877:1,29879:1} mods:{29879:["-59"]} cpts:[29877,29879] icd:[M17.11] phy:PHY-001`
→ R-3.3.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: -59 without documentation of distinct service. Payer unknown — apply strict default.

**ACC02-044** | MODIFIER | commercial_59_acceptable | simple | COM
56yo F, bilateral knee injections with -59, commercial
> Pt with bilateral knee OA. R knee and L knee injections billed with -59 on second line. Documentation clearly notes bilateral.
`lat:bilateral pt:established set:office pay:commercial gp:none units:{20610:1,20610:1} mods:{20610:["-59","-LT"]} cpts:[20610] icd:[M17.0] phy:PHY-001`
→ R-3.3.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[bilateral_vs_distinct]
Warn: commercial accepts -59. Suggest -50 or -LT/-RT for clarity.

**ACC02-045** | MODIFIER | commercial_59_acceptable | simple | COM
49yo M, R shoulder injection + E/M with -59, commercial
> Pt with R shoulder bursitis. Same-day injection and E/M. -59 on injection, -25 on E/M.
`lat:right pt:established set:office pay:commercial gp:none units:{20610:1,99214:1} mods:{20610:["-59"],99214:["-25"]} cpts:[20610,99214] icd:[M75.111] phy:PHY-001`
→ R-3.3.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: commercial accepts -59. X-modifier preferred for specificity.

**ACC02-046** | MODIFIER | commercial_59_acceptable | moderate | COM
40yo M, bilateral distal radius ORIF with -59, commercial
> Pt with bilateral distal radius fractures. ORIF both wrists. -59 on second line. Documentation specifies bilateral distinct fractures.
`lat:bilateral pt:new set:outpatient pay:commercial gp:none units:{25607:1,25607:1} mods:{25607:["-59","-LT"]} cpts:[25607] icd:[S52.501A,S52.502A] phy:PHY-001`
→ R-3.3.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[bilateral_vs_distinct]
Warn: commercial accepts -59. -LT/-RT on separate lines preferred.

**ACC02-047** | MODIFIER | commercial_59_acceptable | moderate | COM
57yo F, R knee arthroscopy meniscectomy + chondroplasty with -59
> Pt with R knee medial meniscus tear and lateral chondromalacia. Meniscectomy + chondroplasty different compartments. -59 on chondroplasty.
`lat:right pt:established set:ASC pay:commercial gp:none units:{29881:1,29877:1} mods:{29877:["-59","-RT"]} cpts:[29881,29877] icd:[M23.211,M17.11] phy:PHY-001`
→ R-3.3.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: commercial accepts -59. -XS preferred for different compartments.

**ACC02-048** | MODIFIER | commercial_59_acceptable | simple | COM
62yo F, bilateral hip injections with -59, commercial
> Pt with bilateral hip OA. R hip and L hip injections. -59 on second line.
`lat:bilateral pt:established set:office pay:commercial gp:none units:{20610:1,20610:1} mods:{20610:["-59","-LT"]} cpts:[20610] icd:[M16.0] phy:PHY-001`
→ R-3.3.3 | warn | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Warn: commercial accepts -59. -50 or -LT/-RT preferred.

---

### 4.4 Global Period Logic (ACC02-049 through ACC02-064)

**ACC02-049** | GLOBAL | em_in_90day_no_modifier | moderate | COM
68yo F, 4 weeks post R TKA, presents for R knee follow-up, E/M billed without modifier
> Pt is 4 weeks post R TKA. Presents for routine post-op follow-up. E/M 99214 billed without global period modifier.
`lat:right pt:established set:office pay:commercial gp:active_90day gp_date:2026-01-31 gp_cpt:27447 units:{99214:1} mods:{} cpts:[99214] icd:[Z96.651] phy:PHY-001`
→ R-3.4.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[global_period_overlap]
Block: E/M within 90-day TKA global without modifier. Requires -24, -79, -78, or -58.

**ACC02-050** | GLOBAL | em_in_90day_no_modifier | moderate | COM
72yo M, 6 weeks post L THA, unrelated R knee E/M without modifier
> Pt 6 weeks post L THA. Presents with new R knee pain (unrelated). E/M billed without -24.
`lat:right pt:established set:office pay:commercial gp:active_90day gp_date:2026-01-17 gp_cpt:27130 units:{99214:1} mods:{} cpts:[99214] icd:[M25.562] phy:PHY-001`
→ R-3.4.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[global_period_overlap]
Block: E/M within 90-day THA global without modifier. Needs -24 for unrelated E/M.

**ACC02-051** | GLOBAL | em_in_90day_no_modifier | moderate | MCR
69yo F, 3 weeks post R shoulder arthroplasty, follow-up E/M no modifier
> Medicare pt 3 weeks post R total shoulder arthroplasty. Routine follow-up E/M billed without modifier.
`lat:right pt:established set:office pay:medicare gp:active_90day gp_date:2026-02-07 gp_cpt:23472 units:{99213:1} mods:{} cpts:[99213] icd:[Z96.611] phy:PHY-001`
→ R-3.4.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: E/M within 90-day shoulder arthroplasty global without modifier.

**ACC02-052** | GLOBAL | em_in_90day_no_modifier | moderate | NS
45yo M, 5 weeks post R ORIF tibial shaft, follow-up E/M no modifier
> Pt 5 weeks post R tibial shaft ORIF. Routine follow-up. E/M billed without modifier. Payer unknown.
`lat:right pt:established set:office pay:not_specified gp:active_90day gp_date:2026-01-24 gp_cpt:27758 units:{99213:1} mods:{} cpts:[99213] icd:[S82.101D] phy:PHY-001`
→ R-3.4.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: E/M within 90-day ORIF global without modifier.

**ACC02-053** | GLOBAL | em_0day_no_25 | moderate | COM
55yo M, same-day E/M + R knee injection, no -25
> Pt with R knee OA. Office visit for evaluation, then R knee corticosteroid injection same day. E/M billed without -25.
`lat:right pt:established set:office pay:commercial gp:none units:{99214:1,20610:1} mods:{20610:["-RT"]} cpts:[99214,20610] icd:[M17.11] phy:PHY-001`
→ R-3.4.2 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: E/M + 0-day global injection requires -25 on E/M. Documentation must show separate MDM.

**ACC02-054** | GLOBAL | em_0day_no_25 | moderate | MCR
71yo F, same-day E/M + L shoulder injection, no -25
> Medicare pt with L shoulder bursitis. E/M evaluation and L shoulder injection same visit. No -25 modifier.
`lat:left pt:established set:office pay:medicare gp:none units:{99213:1,20610:1} mods:{20610:["-LT"]} cpts:[99213,20610] icd:[M75.112] phy:PHY-001`
→ R-3.4.2 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: E/M + 0-day injection requires -25. Medicare strict on -25 documentation.

**ACC02-055** | GLOBAL | em_0day_no_25 | moderate | COM
46yo F, same-day E/M + trigger point injection, no -25
> Pt with myofascial pain. E/M evaluation and trigger point injections (3 muscles) same day. No -25 modifier.
`lat:right pt:established set:office pay:commercial gp:none units:{99214:1,20553:1} mods:{} cpts:[99214,20553] icd:[M79.11] phy:PHY-001`
→ R-3.4.2 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: E/M + 0-day trigger point injection requires -25.

**ACC02-056** | GLOBAL | em_0day_no_25 | simple | COM
60yo M, same-day E/M + R wrist injection, no -25
> Pt with R wrist OA. E/M and R wrist injection same visit. No -25 modifier.
`lat:right pt:established set:office pay:commercial gp:none units:{99213:1,20605:1} mods:{20605:["-RT"]} cpts:[99213,20605] icd:[M19.031] phy:PHY-001`
→ R-3.4.2 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: E/M + 0-day injection requires -25.

**ACC02-057** | GLOBAL | decision_for_surgery_no_57 | moderate | COM
66yo F, E/M same day as R TKA, no -57
> Pt seen in pre-op holding. E/M documented with decision to proceed with R TKA. No -57 modifier.
`lat:right pt:established set:outpatient pay:commercial gp:none units:{99214:1,27447:1} mods:{27447:["-RT"]} cpts:[99214,27447] icd:[M17.11] phy:PHY-001`
→ R-3.4.3 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[global_period_overlap]
Force-review: E/M on day of major surgery needs -57 to indicate decision for surgery.

**ACC02-058** | GLOBAL | decision_for_surgery_no_57 | moderate | MCR
73yo M, E/M day-before L THA, no -57
> Medicare pt. Office visit day before scheduled L THA. Decision for surgery documented. No -57 modifier.
`lat:left pt:established set:office pay:medicare gp:none units:{99215:1,27130:1} mods:{27130:["-LT"]} cpts:[99215,27130] icd:[M16.12] phy:PHY-001`
→ R-3.4.3 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[global_period_overlap]
Force-review: E/M day before major surgery needs -57. Day-before acceptance MAC-variable.

**ACC02-059** | GLOBAL | decision_for_surgery_no_57 | moderate | COM
58yo F, E/M same day as R shoulder arthroplasty, no -57
> Pt seen day-of R total shoulder arthroplasty. E/M with moderate MDM documented. No -57.
`lat:right pt:established set:outpatient pay:commercial gp:none units:{99214:1,23472:1} mods:{23472:["-RT"]} cpts:[99214,23472] icd:[M19.011] phy:PHY-001`
→ R-3.4.3 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: E/M on day of major shoulder surgery needs -57.

**ACC02-060** | GLOBAL | decision_for_surgery_no_57 | complex | MCR
35yo M, E/M day-before R ACL reconstruction, no -57
> Medicare pt. Office visit day before R ACL reconstruction. Surgical decision made after reviewing MRI. No -57.
`lat:right pt:established set:office pay:medicare gp:none units:{99214:1,27428:1} mods:{27428:["-RT"]} cpts:[99214,27428] icd:[M24.261] phy:PHY-001`
→ R-3.4.3 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: E/M day before major surgery needs -57. Medicare day-before acceptance MAC-variable.

**ACC02-061** | GLOBAL | procedure_in_global_no_modifier | complex | COM
68yo F, R knee arthroscopy 6 weeks post R TKA, no modifier
> Pt 6 weeks post R TKA. Arthroscopic lysis of adhesions for stiffness. No global period modifier applied.
`lat:right pt:established set:ASC pay:commercial gp:active_90day gp_date:2026-01-17 gp_cpt:27447 units:{29884:1} mods:{29884:["-RT"]} cpts:[29884] icd:[T84.84XA] phy:PHY-001`
→ R-3.4.4 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[global_period_overlap]
Block: procedure during active TKA 90-day global without -58/-78/-79.

**ACC02-062** | GLOBAL | procedure_in_global_no_modifier | moderate | MCR
71yo M, L shoulder injection 4 weeks post L shoulder arthroplasty, no modifier
> Medicare pt 4 weeks post L total shoulder. L shoulder injection for persistent pain. No global period modifier.
`lat:left pt:established set:office pay:medicare gp:active_90day gp_date:2026-01-31 gp_cpt:23472 units:{20610:1} mods:{20610:["-LT"]} cpts:[20610] icd:[M25.512] phy:PHY-001`
→ R-3.4.4 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[global_period_overlap]
Block: injection during active 90-day shoulder global without modifier.

**ACC02-063** | GLOBAL | procedure_in_global_no_modifier | complex | COM
64yo M, R hip procedure 8 weeks post R THA, no modifier
> Pt 8 weeks post R THA. R hip arthroscopy for suspected hardware complication. No global period modifier applied.
`lat:right pt:established set:ASC pay:commercial gp:active_90day gp_date:2026-01-03 gp_cpt:27130 units:{29860:1} mods:{29860:["-RT"]} cpts:[29860] icd:[T84.010A] phy:PHY-001`
→ R-3.4.4 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: procedure during active THA 90-day global without modifier.

**ACC02-064** | GLOBAL | procedure_in_global_no_modifier | complex | MCR
50yo F, L wrist ORIF 7 weeks post previous L wrist surgery, no modifier
> Medicare pt 7 weeks post initial L distal radius ORIF. Re-fracture requiring repeat ORIF. No global period modifier.
`lat:left pt:established set:outpatient pay:medicare gp:active_90day gp_date:2026-01-10 gp_cpt:25607 units:{25607:1} mods:{25607:["-LT"]} cpts:[25607] icd:[S52.502A] phy:PHY-001`
→ R-3.4.4 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: ORIF during active 90-day global without -78 or -79.

---

### 4.5 Documentation Sufficiency (ACC02-065 through ACC02-084)

**ACC02-065** | DOC | missing_laterality | simple | COM
43yo M, knee arthroscopy meniscectomy, no laterality specified
> Pt with knee meniscus tear. Arthroscopic partial meniscectomy performed. No side documented.
`lat:not_specified pt:established set:ASC pay:commercial gp:none units:{29881:1} mods:{} cpts:[29881] icd:[M23.20] phy:PHY-001`
→ R-3.5.1 | block | clean:F | conf:low | sup:[] | miss:[laterality] | edge:[missing_documentation]
Block: laterality required for knee arthroscopy. Cannot submit without -LT or -RT.

**ACC02-066** | DOC | missing_laterality | simple | MCR
70yo F, shoulder injection, no laterality specified
> Medicare pt with shoulder bursitis. Major joint injection performed. Side not documented.
`lat:not_specified pt:established set:office pay:medicare gp:none units:{20610:1} mods:{} cpts:[20610] icd:[M75.10] phy:PHY-001`
→ R-3.5.1 | block | clean:F | conf:low | sup:[] | miss:[laterality] | edge:[missing_documentation]
Block: laterality required for shoulder injection.

**ACC02-067** | DOC | missing_laterality | simple | COM
65yo M, TKA, no laterality specified
> Pt with severe knee OA. Primary total knee arthroplasty performed. Side not documented in note.
`lat:not_specified pt:established set:outpatient pay:commercial gp:none units:{27447:1} mods:{} cpts:[27447] icd:[M17.9] phy:PHY-001`
→ R-3.5.1 | block | clean:F | conf:low | sup:[] | miss:[laterality] | edge:[]
Block: laterality required for TKA.

**ACC02-068** | DOC | missing_laterality | simple | NS
32yo F, distal radius ORIF, no laterality specified
> Pt with distal radius fracture s/p ORIF with plate and screws. 3 fragments. Side not specified. Payer unknown.
`lat:not_specified pt:new set:outpatient pay:not_specified gp:none units:{25608:1} mods:{} cpts:[25608] icd:[S52.509A] phy:PHY-001`
→ R-3.5.1 | block | clean:F | conf:low | sup:[] | miss:[laterality] | edge:[]
Block: laterality required for ORIF.

**ACC02-069** | DOC | missing_laterality | simple | MCR
52yo M, hip arthroscopy, no laterality
> Medicare pt with hip pain. Arthroscopic hip chondroplasty performed. Side not documented.
`lat:not_specified pt:established set:ASC pay:medicare gp:none units:{29862:1} mods:{} cpts:[29862] icd:[M16.9] phy:PHY-001`
→ R-3.5.1 | block | clean:F | conf:low | sup:[] | miss:[laterality] | edge:[]
Block: laterality required for hip arthroscopy.

**ACC02-070** | DOC | icd10_laterality_mismatch | moderate | COM
63yo M, R TKA with left-side ICD-10 code
> Pt with R knee OA. R TKA performed. Diagnosis coded as M17.12 (left knee OA) in error.
`lat:right pt:established set:outpatient pay:commercial gp:none units:{27447:1} mods:{27447:["-RT"]} cpts:[27447] icd:[M17.12] phy:PHY-001`
→ R-3.5.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[missing_documentation]
Block: ICD-10 M17.12 (left) contradicts CPT modifier -RT (right). Correct laterality.

**ACC02-071** | DOC | icd10_laterality_mismatch | moderate | MCR
67yo F, L shoulder injection with right-side ICD-10
> Medicare pt. L shoulder injection performed. Diagnosis coded as M75.111 (right shoulder) in error.
`lat:left pt:established set:office pay:medicare gp:none units:{20610:1} mods:{20610:["-LT"]} cpts:[20610] icd:[M75.111] phy:PHY-001`
→ R-3.5.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: ICD-10 M75.111 (right) contradicts CPT modifier -LT (left).

**ACC02-072** | DOC | icd10_laterality_mismatch | moderate | COM
60yo M, R hip THA with left-side ICD-10
> Pt with R hip AVN. R THA performed. Diagnosis coded as M87.052 (left hip AVN).
`lat:right pt:established set:outpatient pay:commercial gp:none units:{27130:1} mods:{27130:["-RT"]} cpts:[27130] icd:[M87.052] phy:PHY-001`
→ R-3.5.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: ICD-10 M87.052 (left) contradicts CPT modifier -RT (right).

**ACC02-073** | DOC | icd10_laterality_mismatch | moderate | MCR
48yo F, L ankle arthroscopy with right-side ICD-10
> Medicare pt. L ankle arthroscopic debridement. Diagnosis coded as M19.071 (right ankle OA).
`lat:left pt:established set:ASC pay:medicare gp:none units:{29897:1} mods:{29897:["-LT"]} cpts:[29897] icd:[M19.071] phy:PHY-001`
→ R-3.5.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: ICD-10 M19.071 (right) contradicts CPT modifier -LT (left).

**ACC02-074** | DOC | missing_approach_fracture | simple | COM
38yo M, R distal radius fracture, no approach documented
> Pt with R distal radius fracture. Treatment performed. Note does not specify closed, open, or percutaneous approach.
`lat:right pt:new set:outpatient pay:commercial gp:none units:{25600:1} mods:{25600:["-RT"]} cpts:[25600] icd:[S52.501A] phy:PHY-001`
→ R-3.5.3 | warn | clean:T | conf:high | sup:[] | miss:[approach] | edge:[missing_documentation]
Warn: fracture approach not documented. Confirm closed vs open vs percutaneous.

**ACC02-075** | DOC | missing_approach_fracture | simple | MCR
75yo F, L tibial shaft fracture, no approach documented
> Medicare pt with L tibial shaft fracture. Treatment performed. Approach not specified in documentation.
`lat:left pt:new set:outpatient pay:medicare gp:none units:{27750:1} mods:{27750:["-LT"]} cpts:[27750] icd:[S82.102A] phy:PHY-001`
→ R-3.5.3 | warn | clean:T | conf:high | sup:[] | miss:[approach] | edge:[]
Warn: fracture approach not documented. Affects code selection.

**ACC02-076** | DOC | missing_approach_fracture | simple | COM
29yo F, R distal radius fracture, closed but manipulation not specified
> Pt with R distal radius fracture. Closed treatment documented. Whether manipulation was performed is not stated.
`lat:right pt:new set:outpatient pay:commercial gp:none units:{25600:1} mods:{25600:["-RT"]} cpts:[25600] icd:[S52.501A] phy:PHY-001`
→ R-3.5.3 | warn | clean:T | conf:high | sup:[] | miss:[approach] | edge:[]
Warn: manipulation status not documented. 25600 vs 25605 depends on manipulation.

**ACC02-077** | DOC | missing_approach_fracture | simple | MCR
55yo M, R metatarsal fracture, no approach documented
> Medicare pt with R fifth metatarsal fracture. Treatment performed. Approach not documented.
`lat:right pt:new set:office pay:medicare gp:none units:{28470:1} mods:{28470:["-RT"]} cpts:[28470] icd:[S92.351A] phy:PHY-001`
→ R-3.5.3 | warn | clean:T | conf:high | sup:[] | miss:[approach] | edge:[]
Warn: fracture approach not documented. Confirm for code selection.

**ACC02-078** | DOC | outpatient_ruleout | simple | COM
47yo F, "rule out meniscal tear" in outpatient setting
> Pt with R knee pain after twisting injury. Assessed to rule out medial meniscal tear. Outpatient setting.
`lat:right pt:established set:office pay:commercial gp:none units:{99214:1} mods:{} cpts:[99214] icd:[M23.211] phy:PHY-001`
→ R-3.5.4 | block | clean:F | conf:low | sup:[] | miss:[confirmed_diagnosis] | edge:[missing_documentation]
Block: "rule out" diagnosis in outpatient. Code confirmed condition or presenting symptom (M25.561 knee pain).

**ACC02-079** | DOC | outpatient_ruleout | simple | MCR
42yo M, "suspected ACL tear" in outpatient
> Medicare pt with R knee instability after sports injury. Documentation states "suspected ACL tear." Outpatient.
`lat:right pt:established set:office pay:medicare gp:none units:{99214:1} mods:{} cpts:[99214] icd:[S83.511A] phy:PHY-001`
→ R-3.5.4 | block | clean:F | conf:low | sup:[] | miss:[confirmed_diagnosis] | edge:[]
Block: "suspected" diagnosis in outpatient. Code symptom (M25.361 instability) or confirmed finding.

**ACC02-080** | DOC | outpatient_ruleout | simple | COM
78yo F, "possible hip fracture" in outpatient
> Pt with L hip pain after fall. "Possible L hip fracture" documented pending imaging. Outpatient.
`lat:left pt:new set:outpatient pay:commercial gp:none units:{99203:1} mods:{} cpts:[99203] icd:[S72.002A] phy:PHY-001`
→ R-3.5.4 | block | clean:F | conf:low | sup:[] | miss:[confirmed_diagnosis] | edge:[]
Block: "possible" diagnosis in outpatient. Code symptom (M25.552 hip pain) until confirmed.

**ACC02-081** | DOC | outpatient_ruleout | simple | MCR
59yo M, "probable rotator cuff tear" in outpatient
> Medicare pt with R shoulder weakness. "Probable R rotator cuff tear" documented. Outpatient.
`lat:right pt:established set:office pay:medicare gp:none units:{99214:1} mods:{} cpts:[99214] icd:[M75.111] phy:PHY-001`
→ R-3.5.4 | block | clean:F | conf:low | sup:[] | miss:[confirmed_diagnosis] | edge:[]
Block: "probable" diagnosis in outpatient. Code confirmed condition or symptom (M25.511 shoulder pain).

**ACC02-082** | DOC | missing_anatomic_specificity | simple | COM
51yo F, "knee injection" without specifying which joint
> Pt presents for knee injection. Note says "injected the knee." No specification of which knee or specific joint compartment.
`lat:not_specified pt:established set:office pay:commercial gp:none units:{20610:1} mods:{} cpts:[20610] icd:[M17.9] phy:PHY-001`
→ R-3.5.1, R-3.5.5 | block | clean:F | conf:low | sup:[] | miss:[laterality,anatomic_site] | edge:[missing_documentation]
Block (R-3.5.1 for laterality) + Warn (R-3.5.5 for specificity). Most severe = block.

**ACC02-083** | DOC | missing_anatomic_specificity | simple | MCR
61yo M, "fracture treatment" without bone or location
> Medicare pt. "Fracture treated." No specification of which bone, location, or approach.
`lat:not_specified pt:new set:outpatient pay:medicare gp:none units:{25600:1} mods:{} cpts:[25600] icd:[T14.8] phy:PHY-001`
→ R-3.5.1, R-3.5.3, R-3.5.5 | block | clean:F | conf:low | sup:[] | miss:[laterality,anatomic_site,approach] | edge:[missing_documentation]
Block (R-3.5.1) + Warn (R-3.5.3, R-3.5.5). Most severe = block.

**ACC02-084** | DOC | missing_anatomic_specificity | simple | COM
64yo F, "joint replacement" without joint specified
> Pt scheduled for joint replacement. Note says "total joint arthroplasty." Does not specify knee, hip, or shoulder.
`lat:not_specified pt:established set:outpatient pay:commercial gp:none units:{27447:1} mods:{} cpts:[27447] icd:[M17.9] phy:PHY-001`
→ R-3.5.1, R-3.5.5 | block | clean:F | conf:low | sup:[] | miss:[laterality,anatomic_site] | edge:[missing_documentation]
Block (R-3.5.1) + Warn (R-3.5.5). Most severe = block.

---

### 4.6 Cross-Domain (ACC02-085 through ACC02-099)

**ACC02-085** | PTP+DOC | arthroscopy_open_bundling + missing_laterality | complex | COM
58yo, knee scope + TKA same session, no laterality
> Pt with severe knee OA. Arthroscopy and TKA performed same session. Laterality not documented.
`lat:not_specified pt:established set:outpatient pay:commercial gp:none units:{29881:1,27447:1} mods:{} cpts:[29881,27447] icd:[M17.9] phy:PHY-001`
→ R-3.1.1, R-3.5.1 | block | clean:F | conf:low | sup:[29881] | miss:[laterality] | edge:[]
Block: PTP bundling (suppress 29881) + missing laterality.

**ACC02-086** | PTP+GLOBAL | injection_scope_bundling + em_0day_no_25 | complex | MCR
62yo M, R knee injection + R knee scope + E/M without -25, Medicare
> Medicare pt. R knee injection, R knee arthroscopic debridement, and E/M same day. No -25 on E/M.
`lat:right pt:established set:ASC pay:medicare gp:none units:{20610:1,29877:1,99214:1} mods:{20610:["-RT"],29877:["-RT"]} cpts:[20610,29877,99214] icd:[M17.11] phy:PHY-001`
→ R-3.1.2, R-3.4.2 | block | clean:F | conf:low | sup:[20610] | miss:[] | edge:[]
Block: injection bundled into scope (R-3.1.2). Force-review: E/M without -25 (R-3.4.2). Most severe = block.

**ACC02-087** | GLOBAL+DOC | em_90day_global + missing_laterality | complex | COM
70yo, 3 weeks post TKA, E/M without modifier, no laterality
> Pt 3 weeks post TKA. Follow-up E/M without global period modifier. Side of prior TKA not documented.
`lat:not_specified pt:established set:office pay:commercial gp:active_90day gp_date:2026-02-07 gp_cpt:27447 units:{99214:1} mods:{} cpts:[99214] icd:[Z96.659] phy:PHY-001`
→ R-3.4.1, R-3.5.1 | block | clean:F | conf:low | sup:[] | miss:[laterality] | edge:[]
Block: E/M in 90-day global without modifier + missing laterality.

**ACC02-088** | MUE+DOC | mue_overage + missing_laterality | complex | COM
66yo F, TKA 2 units single line, no laterality
> Pt with bilateral knee OA. TKA billed as 2 units on single line. Laterality not documented.
`lat:not_specified pt:established set:outpatient pay:commercial gp:none units:{27447:2} mods:{} cpts:[27447] icd:[M17.0] phy:PHY-001`
→ R-3.2.1, R-3.5.1 | block | clean:F | conf:low | sup:[] | miss:[laterality] | edge:[]
Block: MUE overage (2 > 1) + missing laterality.

**ACC02-089** | MOD+DOC | modifier_without_doc + missing_laterality | complex | COM
50yo M, knee procedures with -XS but no distinct documentation, no laterality
> Pt with knee pathology. Arthroscopic debridement and chondroplasty. -XS applied but note lacks distinct structure language and laterality.
`lat:not_specified pt:established set:ASC pay:commercial gp:none units:{29877:1,29879:1} mods:{29879:["-XS"]} cpts:[29877,29879] icd:[M17.9] phy:PHY-001`
→ R-3.3.2, R-3.5.1 | block | clean:F | conf:low | sup:[] | miss:[laterality] | edge:[]
Block: -XS without documentation + missing laterality.

**ACC02-090** | PTP+MOD+DOC | diag_surg_scope + medicare_59 + missing_laterality | complex | MCR
68yo F, diagnostic + surgical knee scope, Medicare -59, no laterality
> Medicare pt. Diagnostic knee scope + surgical meniscectomy. -59 on diagnostic code. Side not documented.
`lat:not_specified pt:established set:ASC pay:medicare gp:none units:{29870:1,29881:1} mods:{29870:["-59"]} cpts:[29870,29881] icd:[M23.20] phy:PHY-001`
→ R-3.1.4, R-3.3.1, R-3.5.1 | block | clean:F | conf:low | sup:[29870] | miss:[laterality] | edge:[]
Block: diagnostic scope bundled (R-3.1.4). Force-review: Medicare -59 (R-3.3.1). Block: missing laterality (R-3.5.1). Most severe = block.

**ACC02-091** | GLOBAL+MUE | procedure_in_global + mue_overage | complex | COM
65yo M, R knee scope in TKA global + 2 units
> Pt 5 weeks post R TKA. R knee arthroscopy for stiffness billed with 2 units. No global period modifier.
`lat:right pt:established set:ASC pay:commercial gp:active_90day gp_date:2026-01-24 gp_cpt:27447 units:{29884:2} mods:{29884:["-RT"]} cpts:[29884] icd:[T84.84XA] phy:PHY-001`
→ R-3.4.4, R-3.2.1 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[global_period_overlap]
Block: procedure in 90-day global without modifier + units exceed MUE.

**ACC02-092** | PTP+GLOBAL+DOC | scope_open + 90day_global + icd10_mismatch | complex | MCR
69yo M, R knee scope + R TKA in 90-day L TKA global, L-side ICD-10
> Medicare pt 4 weeks post L TKA. Now R knee scope + R TKA same session. ICD-10 coded as M17.12 (left).
`lat:right pt:established set:outpatient pay:medicare gp:active_90day gp_date:2026-01-31 gp_cpt:27447 units:{29881:1,27447:1} mods:{27447:["-RT"]} cpts:[29881,27447] icd:[M17.12] phy:PHY-001`
→ R-3.1.1, R-3.4.1, R-3.5.2 | block | clean:F | conf:low | sup:[29881] | miss:[] | edge:[]
Block: scope+TKA bundling + E/M in L TKA global + ICD-10 laterality mismatch (L vs R).

**ACC02-093** | PTP+DOC | injection_scope + ruleout_diagnosis | complex | COM
48yo F, R knee injection + R knee scope + rule-out diagnosis
> Pt with R knee pain. R knee injection and R knee arthroscopy same day. Diagnosis documented as "rule out meniscal tear."
`lat:right pt:established set:ASC pay:commercial gp:none units:{20610:1,29877:1} mods:{20610:["-RT"],29877:["-RT"]} cpts:[20610,29877] icd:[M23.211] phy:PHY-001`
→ R-3.1.2, R-3.5.4 | block | clean:F | conf:low | sup:[20610] | miss:[confirmed_diagnosis] | edge:[]
Block: injection bundled into scope + rule-out diagnosis in outpatient.

**ACC02-094** | GLOBAL+DOC | em_0day_no_25 + missing_specificity | moderate | MCR
72yo M, E/M + injection same day no -25, vague anatomic description
> Medicare pt. E/M and "joint injection" same day. Note says "injected the joint" without specifying which joint. No -25.
`lat:right pt:established set:office pay:medicare gp:none units:{99214:1,20610:1} mods:{} cpts:[99214,20610] icd:[M19.90] phy:PHY-001`
→ R-3.4.2, R-3.5.5 | force-review | clean:T | conf:medium | sup:[] | miss:[anatomic_site] | edge:[]
Force-review: E/M + 0-day no -25 (R-3.4.2). Warn: missing specificity (R-3.5.5). Most severe = force-review.

**ACC02-095** | PTP+DOC | cast_fracture + missing_approach | moderate | COM
33yo M, R tibial fracture + splint, approach not documented
> Pt with R tibial shaft fracture. Treatment and splint application. Approach not documented.
`lat:right pt:new set:outpatient pay:commercial gp:none units:{27750:1,29515:1} mods:{27750:["-RT"]} cpts:[27750,29515] icd:[S82.101A] phy:PHY-001`
→ R-3.1.3, R-3.5.3 | warn | clean:T | conf:high | sup:[] | miss:[approach] | edge:[]
Warn: cast bundled into fracture care (R-3.1.3). Warn: approach missing (R-3.5.3). Both warn only.

**ACC02-096** | MOD+GLOBAL | medicare_59 + em_0day_no_25 | moderate | MCR
69yo F, Medicare E/M + R shoulder injection, -59 on injection, no -25 on E/M
> Medicare pt. R shoulder injection and E/M same day. -59 on injection. No -25 on E/M.
`lat:right pt:established set:office pay:medicare gp:none units:{99214:1,20610:1} mods:{20610:["-59","-RT"]} cpts:[99214,20610] icd:[M75.111] phy:PHY-001`
→ R-3.3.1, R-3.4.2 | force-review | clean:T | conf:medium | sup:[] | miss:[] | edge:[]
Force-review: Medicare -59 should be X-modifier (R-3.3.1) + E/M needs -25 (R-3.4.2).

**ACC02-097** | MUE+MOD | mue_overage + modifier_without_doc | complex | COM
56yo M, R knee injection 2 units + -59 without documentation
> Pt with R knee OA. Injection billed as 2 units on single line with -59. No distinct service documentation.
`lat:right pt:established set:office pay:commercial gp:none units:{20610:2} mods:{20610:["-59","-RT"]} cpts:[20610] icd:[M17.11] phy:PHY-001`
→ R-3.2.1, R-3.3.2 | block | clean:F | conf:low | sup:[] | miss:[] | edge:[]
Block: units exceed MUE (R-3.2.1) + -59 without documentation (R-3.3.2).

**ACC02-098** | GLOBAL+DOC+MOD | 90day_global + ruleout + medicare_59 | complex | MCR
71yo M, E/M in 90-day TKA global, "suspected" diagnosis, Medicare -59
> Medicare pt 6 weeks post R TKA. E/M for "suspected infection." -59 on E/M. Outpatient.
`lat:right pt:established set:office pay:medicare gp:active_90day gp_date:2026-01-17 gp_cpt:27447 units:{99214:1} mods:{99214:["-59"]} cpts:[99214] icd:[T84.54XA] phy:PHY-001`
→ R-3.4.1, R-3.5.4, R-3.3.1 | block | clean:F | conf:low | sup:[] | miss:[confirmed_diagnosis] | edge:[]
Block: E/M in 90-day global without proper modifier + "suspected" diagnosis + Medicare -59.

**ACC02-099** | PTP+MUE+DOC | scope_open + mue_overage + missing_laterality | complex | NS
60yo, knee scope + open knee procedure, 2 units, no laterality, payer unknown
> Pt with knee OA. Arthroscopy and open arthrotomy same session. 2 units billed. No side documented. Payer not specified.
`lat:not_specified pt:established set:outpatient pay:not_specified gp:none units:{29874:2,27330:1} mods:{} cpts:[29874,27330] icd:[M17.9] phy:PHY-001`
→ R-3.1.1, R-3.2.1, R-3.5.1 | block | clean:F | conf:low | sup:[29874] | miss:[laterality] | edge:[]
Block: scope bundled into open procedure + MUE overage on scope + missing laterality.

---

### 4.7 Clean Pass (ACC02-100 through ACC02-109)

**ACC02-100** | CLEAN_PASS | clean_tka | simple | COM
66yo F, R TKA, complete documentation, commercial
> Pt with right knee severe OA unresponsive to conservative treatment. Right primary total knee arthroplasty performed. Cemented CR components placed. No complications.
`lat:right pt:established set:outpatient pay:commercial gp:none units:{27447:1} mods:{27447:["-RT"]} cpts:[27447] icd:[M17.11] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[bilateral_vs_distinct]
Pass: complete documentation, correct laterality, units within MUE, no conflicts.

**ACC02-101** | CLEAN_PASS | clean_shoulder_injection | simple | MCR
74yo M, L shoulder injection with US guidance, Medicare
> Medicare pt with left shoulder OA. Left shoulder ultrasound-guided corticosteroid injection performed. Confirmed OA on prior imaging.
`lat:left pt:established set:office pay:medicare gp:none units:{20611:1} mods:{20611:["-LT"]} cpts:[20611] icd:[M19.012] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: complete documentation, correct laterality, US guidance documented, MUE OK.

**ACC02-102** | CLEAN_PASS | clean_orif | moderate | COM
31yo M, R distal radius ORIF, 3 fragments, commercial
> Pt with right distal radius fracture, 3 fragments. Open reduction internal fixation with volar locking plate. Right side confirmed.
`lat:right pt:new set:outpatient pay:commercial gp:none units:{25608:1} mods:{25608:["-RT"]} cpts:[25608] icd:[S52.501A] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: approach (ORIF), fragment count (3), laterality (right) all documented.

**ACC02-103** | CLEAN_PASS | clean_em_injection_25 | moderate | COM
58yo F, same-day E/M + R knee injection with -25, commercial
> Pt with right knee OA and new right hip pain (separate problem). E/M for hip evaluation. Right knee injection for known OA. -25 on E/M.
`lat:right pt:established set:office pay:commercial gp:none units:{99214:1,20610:1} mods:{99214:["-25"],20610:["-RT"]} cpts:[99214,20610] icd:[M17.11,M25.551] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: -25 correctly applied, separate MDM documented, laterality present.

**ACC02-104** | CLEAN_PASS | clean_bilateral_injection | moderate | MCR
70yo F, bilateral knee injections with -50, Medicare
> Medicare pt with bilateral knee OA. Bilateral knee corticosteroid injections performed. -50 modifier applied.
`lat:bilateral pt:established set:office pay:medicare gp:none units:{20610:1} mods:{20610:["-50"]} cpts:[20610] icd:[M17.0] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: bilateral correctly coded with -50, documentation complete.

**ACC02-105** | CLEAN_PASS | clean_tha | simple | COM
62yo M, L THA, complete documentation
> Pt with left hip severe OA. Left primary total hip arthroplasty performed via posterior approach. Uncemented components.
`lat:left pt:established set:outpatient pay:commercial gp:none units:{27130:1} mods:{27130:["-LT"]} cpts:[27130] icd:[M16.12] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: complete documentation, laterality, diagnosis, approach all present.

**ACC02-106** | CLEAN_PASS | clean_scope_addon | moderate | COM
41yo M, R knee meniscectomy + chondroplasty add-on
> Pt with right knee medial meniscus tear and lateral chondromalacia. Right knee arthroscopic partial medial meniscectomy with chondroplasty add-on.
`lat:right pt:established set:ASC pay:commercial gp:none units:{29881:1,27358:1} mods:{29881:["-RT"]} cpts:[29881,27358] icd:[M23.211,M94.261] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: add-on code with primary, laterality, diagnosis, compartment all documented.

**ACC02-107** | CLEAN_PASS | clean_achilles_repair | simple | MCR
39yo M, R Achilles repair, Medicare
> Medicare pt with acute right Achilles tendon rupture. Open primary repair performed. Right side confirmed.
`lat:right pt:new set:outpatient pay:medicare gp:none units:{27650:1} mods:{27650:["-RT"]} cpts:[27650] icd:[S86.011A] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: laterality, approach (open), diagnosis all documented.

**ACC02-108** | CLEAN_PASS | clean_em_57_tka | moderate | COM
67yo F, E/M day-of R TKA with -57
> Pt seen in pre-op area. Decision for right TKA made during E/M. -57 correctly applied. High MDM documented.
`lat:right pt:established set:outpatient pay:commercial gp:none units:{99215:1,27447:1} mods:{99215:["-57"],27447:["-RT"]} cpts:[99215,27447] icd:[M17.11] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: -57 correctly applied for decision-for-surgery. Documentation complete.

**ACC02-109** | CLEAN_PASS | clean_ankle_scope | simple | COM
47yo F, L ankle arthroscopic debridement
> Pt with left ankle anterior impingement syndrome. Left ankle arthroscopic limited debridement performed. Left side confirmed.
`lat:left pt:established set:ASC pay:commercial gp:none units:{29897:1} mods:{29897:["-LT"]} cpts:[29897] icd:[M25.772] phy:PHY-001`
→ [] | pass | clean:T | conf:high | sup:[] | miss:[] | edge:[]
Pass: laterality, procedure, diagnosis all documented. No conflicts.

---

## 5. ACC-13 Harness Integration Note

**Loading the JSONL:**
Read `specs/ACC-02-scenarios.jsonl` line-by-line. Each line is a valid JSON object parseable by `JSON.parse()`. The `id` field (e.g., `ACC02-001`) is the unique key per scenario.

**Mapping `expected_rule_hits[]` to `rule_evaluations[]`:**
The harness should run each scenario's `structured_fields` through the deterministic rule engine. The engine produces `rule_evaluations[]` — an array of `{ rule_id, trigger_matched, action }` entries. Compare the harness output's triggered rules against the scenario's `expected_rule_hits[]`. A scenario passes if and only if:

1. **Rule hits match:** Set of `rule_id` values where `trigger_matched: true` equals `expected_rule_hits[]` exactly (no false positives, no false negatives)
2. **Action matches:** The overall action (max severity of triggered rules) equals `expected_action`
3. **Clean claim matches:** `clean_claim_ready` equals `expected_clean_claim_ready`
4. **Confidence matches:** `confidence` equals `expected_confidence`
5. **Suppressed codes match:** Set of suppressed CPT codes equals `expected_suppressed_codes[]`
6. **Missing info keys match:** Set of missing information keys equals `expected_missing_info_keys[]`

**Domain-level metrics:**
Group scenarios by `domains_tested[]` (not just primary `domain`). For each risk domain, compute: total scenarios, pass count, fail count, pass rate. Report per-domain and overall.

---

## 6. Output Summary

### Scenario counts
- Total: 109 (≥100 ✓)
- By domain: PTP=20, MUE=12, MODIFIER=16, GLOBAL=16, DOC=20, CROSS=15, CLEAN=10
- Cross-domain: 15 (≥15 ✓)
- Clean pass: 10 (≥10 ✓)

### Coverage gaps
- None. All 18 ACC-01 rules covered by at least 4 scenarios each.
- All 5 edge-case categories met or exceeded minimums.

### ACC-01 rules NOT covered
- **Zero.** Every rule in ACC-01 Section 3 (R-3.1.1 through R-3.5.5) is tested.

### Dependencies / assumptions for ACC-04+ validators
- ACC-04 rule engine must accept `structured_fields` as input and produce `rule_evaluations[]` as output
- The `units_of_service` field uses CPT code as key and integer units as value; the engine must support per-code-per-line MUE comparison
- `cpt_codes_submitted` may contain the same code twice (e.g., bilateral injection on separate lines); the engine must handle duplicate codes with different modifiers
- `global_period_surgery_date` and `global_period_surgery_cpt` are null when `global_period_status` is "none"
- The `physician_id` field enables multi-physician testing (ACC02-036, ACC02-037); the engine must compare physician IDs when evaluating -XP modifier validity
- Cross-domain scenarios (ACC02-085–099) test rule interaction ordering; the engine must evaluate ALL rules and report the most severe action as the overall `expected_action`
