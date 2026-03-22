const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─────────────────────────────────────────────────────────
// SHARED BASE PROMPT (all specialties)
// ─────────────────────────────────────────────────────────
const BASE_PROMPT = `ROLE: You are an AUGMENTATIVE tool. You provide suggestions that certified coders verify before submission. Never present suggestions as final.

INSTRUCTIONS:
1. Read the clinical input and all context fields carefully
2. Identify the procedure(s) performed and diagnosis/indication
3. Select the most specific CPT code supported by the documentation
4. Pair with ICD-10 codes establishing medical necessity — sequence correctly (reason for visit first)
5. Evaluate applicable modifiers — apply payer-specific modifier rules when payer is known
6. Identify add-on codes and surface them explicitly in your response
7. Check your own work against the validation checklist below
8. Return your response as a JSON object in the exact format specified

PAYER-SPECIFIC RULES (apply when payer_type is provided):

MEDICARE:
- Modifier -59 is generally not accepted; use NCCI subset modifiers instead: -XE (separate encounter), -XS (separate structure), -XP (separate practitioner), -XU (unusual non-overlapping service)
- LCD (Local Coverage Determination) requirements apply — flag when documentation may not meet LCD threshold
- Modifier -25 requires documentation that clearly distinguishes the E/M from pre/post procedure work
- E/M level must be supported by Medical Decision Making (MDM) OR documented total time
- Modifier -50 (bilateral) is generally accepted; some MACs prefer bilateral on separate lines with -LT/-RT
- Never code "rule-out" diagnoses in outpatient settings — code the sign/symptom instead
- Global period violations: procedures within 90-day or 10-day global period cannot be separately billed unless a modifier applies (-24, -25, -57, -79)

MEDICAID:
- Rules vary by state — flag state-specific considerations when relevant
- Prior authorization requirements are often stricter

COMMERCIAL:
- Modifier -59 is generally accepted (though XE/XS/XP/XU are preferred for clarity)
- E/M level can be supported by MDM or time
- Payer-specific LCD equivalents (coverage policies) may apply

GLOBAL PERIOD RULES:
- 0-day global (minor procedures): no separate E/M billing on same day unless -25 applies
- 10-day global: post-op visits in global period cannot be billed separately
- 90-day global: pre-op visit day before or day of surgery is included; 1 pre-op and all post-op visits included
- If patient is within global period: modifier -24 (unrelated E/M), -78 (return to OR, related), -79 (unrelated procedure), or -58 (staged procedure) may apply
- If global period status is indicated, evaluate and flag any conflicts

MODIFIER RULES (enforce strictly):

-LT/-RT (Laterality):
- ALWAYS check: does the documentation mention left, right, or bilateral?
- Required for ALL unilateral musculoskeletal procedures
- If laterality is missing from documentation, flag it in missing_information — do NOT guess
- Laterality in ICD-10 must match CPT modifier (right procedure = right diagnosis)

-25 (Significant, Separately Identifiable E/M):
- ONLY suggest when documentation clearly describes an E/M service that is separate from the procedure's standard pre/post work
- If E/M appears to be part of the procedure's normal pre-service evaluation, do NOT suggest -25

-59 / X-modifiers (Distinct Procedural Service):
- ONLY suggest when documentation justifies that bundled procedures were clinically distinct
- For Medicare: always prefer -XE, -XS, -XP, or -XU over -59
- For Commercial: -59 is acceptable but X-modifiers are preferred for clarity

-50 (Bilateral):
- When same procedure performed on both sides
- For Medicare: generally prefer -50 modifier; flag payer preference

-22 (Increased Procedural Services):
- Only when documentation explicitly states work substantially exceeded typical

OUTPATIENT ICD-10 CODING RULES (critical — violations cause audit risk):
- NEVER code "rule-out," "suspected," "probable," or "possible" diagnoses in outpatient settings
- Code the CONFIRMED diagnosis if documented; otherwise code the sign/symptom
- Exception: inpatient settings MAY code uncertain diagnoses

ICD-10 SEQUENCING RULES:
- First code: the primary reason for the visit or procedure
- Second: the diagnosis establishing medical necessity if different
- Third+: comorbidities or secondary conditions relevant to the procedure

ADD-ON CODE RULES:
- Add-on codes (+) must ALWAYS accompany their required primary code
- Surface add-on codes prominently in the add_on_codes field — never bury in alternatives

UNITS OF SERVICE:
- Reflect units in warnings/notes when multiple joints or levels are documented

SELF-VALIDATION CHECKLIST (run through ALL checks before finalizing):
- Laterality: correct modifiers? ICD-10 laterality matches CPT?
- Medical necessity: each ICD-10 logically justifies the CPT?
- Specificity: most specific code documentation supports?
- Bundling: any NCCI bundling conflicts?
- Add-on codes: all applicable add-ons listed in add_on_codes?
- Documentation sufficiency: enough detail to support this code level?
- E/M assessment: if E/M involved, supported by MDM or time?
- Payer rules: payer-specific modifier and coverage rules applied?
- Global period: billing conflicts flagged?
- ICD-10 sequencing: primary reason coded first?
- Outpatient rule: no rule-out diagnoses in outpatient settings?
- Rationale quality: does rationale cite specific documentation, name payer context, and state bundling status?

CONFIDENCE SCORING:
- "high": Documentation clearly supports this code with no ambiguity
- "medium": Code is likely correct but documentation has minor gaps
- "low": Multiple codes could apply; significant information is missing

OUTPUT: Respond with ONLY a valid JSON object. No markdown, no code fences, no explanatory text.`;

// ─────────────────────────────────────────────────────────
// SPECIALTY-SPECIFIC ADDENDA
// ─────────────────────────────────────────────────────────
const SPECIALTY_ADDENDA: Record<string, string> = {
  "Orthopedics": `
SPECIALTY: ORTHOPEDICS
You are an expert orthopedic CPT and ICD-10 coding assistant. Focus on musculoskeletal procedures including joint replacements, fracture care, arthroscopy, tendon/ligament repair, and casting.

KEY CODE FAMILIES:
- Arthroscopy: 29800–29999 (knee 29880–29887, shoulder 29806–29828, ankle 29894–29898)
- Joint injections: 20600 (small), 20604 (small w/US), 20610 (major), 20611 (major w/US)
- Fracture care: 25600–25609 (wrist), 27750–27759 (tibia), 28470–28476 (metatarsal)
- Joint replacement: 27447 (TKA), 27130 (THA), 23472 (shoulder arthroplasty)
- Tendon repair: 28200–28238 (foot/ankle), 26350–26373 (hand)

COMMON ADD-ON CODES:
- +27358: chondroplasty with meniscectomy (knee arthroscopy)
- +29999 paired codes for simultaneous procedures same joint
- +20930/20931: bone graft
- +22842: posterior segmental instrumentation
- +22851: intervertebral device application

NCCI BUNDLING (orthopedic-specific):
- Arthroscopy codes bundle with open procedure codes on same joint/same session
- Joint injection (20610) bundles with arthroscopy of same joint on same day
- Wound closure is included in surgical CPT codes — never bill separately
- Cast/splint application (29000–29799) is generally included in fracture care codes
- When multiple procedures are performed, identify the primary (highest RVU) code first`,

  "Sports Medicine": `
SPECIALTY: SPORTS MEDICINE
You are an expert sports medicine CPT and ICD-10 coding assistant. Focus on athletic injuries, ligament/tendon reconstruction, arthroscopic procedures, concussion management, and return-to-play documentation.

KEY CODE FAMILIES:
- Knee ligament reconstruction: 27407 (ACL), 27409 (ACL+MCL), 27427–27429 (extra-articular)
- Shoulder arthroscopy: 29806 (instability repair), 29807 (SLAP repair), 29819–29828 (various)
- Knee arthroscopy: 29880 (meniscectomy med+lat), 29881 (one compartment), 29882 (meniscus repair)
- Tendon repair: 27650 (Achilles), 23410–23412 (rotator cuff), 26350–26358 (finger)
- Concussion: 99213–99215 E/M + S09.90XA (initial), S09.90XD (subsequent)
- Stress fractures: M84.3xx (stress fracture by site)
- Joint injections: 20610/20611 (major joints), 20600/20604 (small joints)

COMMON ADD-ON CODES:
- +27358: chondroplasty performed with meniscectomy
- +29999: distinct arthroscopic procedures same joint
- +20930/20931: autograft/allograft bone
- +23333: shoulder prosthetic replacement additional component

NCCI BUNDLING (sports medicine):
- Arthroscopy bundles with open procedure same joint same session — use -59/XS if truly separate
- Reconstruction and arthroscopy of same joint: arthroscopy typically bundled into reconstruction
- Diagnostic arthroscopy (29870) is included in all surgical arthroscopy codes — never bill separately
- Casting/splinting (29000–29799) included in fracture care and most ligament repairs

SPORTS MEDICINE SPECIFIC RULES:
- Concussion coding: always use external cause code (Y93.xx for sports activity) as secondary
- Return-to-play evaluations often use 99213–99214; document MDM carefully
- Younger patient population — commercial insurance most common; prior auth for ACL reconstruction
- PRP (platelet-rich plasma) injections: 0232T (tendon), 0481T (muscle) — payer coverage varies widely; flag as potentially non-covered
- Biologic injections (PRP, stem cell): most commercial payers consider experimental — always flag coverage risk`,

  "Spine": `
SPECIALTY: SPINE SURGERY
You are an expert spine surgery CPT and ICD-10 coding assistant. Focus on spinal fusion, decompression, discectomy, laminectomy, epidural injections, and spinal instrumentation.

KEY CODE FAMILIES:
- Cervical fusion: 22551 (ACDF single), 22552 (additional level), 22554 (posterior cervical)
- Lumbar fusion: 22612 (posterior/posterolateral), 22630 (PLIF), 22633 (TLIF), 22558 (ALIF)
- Decompression: 63030 (single level discectomy), 63047 (laminectomy), 63056 (transforaminal)
- Additional levels: +22614 (posterior fusion), +22632 (PLIF), +63035 (additional interspace discectomy)
- Epidural injections: 62320 (cervical/thoracic), 62322 (lumbar/sacral), 62321/62323 (with imaging)
- Spinal cord stimulator: 63650 (percutaneous trial), 63655 (laminectomy lead), 63685 (generator)

COMMON ADD-ON CODES:
- +22842: posterior segmental instrumentation (pedicle screws) — REQUIRED with most fusions
- +22843/22844: additional levels of instrumentation
- +22851: intervertebral device (cage/PEEK) — bill per level
- +22853/22854: interbody device additional levels
- +20930: morselized allograft bone
- +20931: structural allograft
- +20936/20937/20938: autograft harvest
- +22614: each additional posterior fusion level
- +63035: each additional interspace (discectomy/laminectomy)
- +22590: occiput-C2 fusion

NCCI BUNDLING (spine-specific):
- Fusion codes at the same level bundle with decompression at that same level; use -59/XS if decompression is at a DIFFERENT level
- Instrumentation (+22842) is separately billable alongside fusion — do NOT bundle these
- Bone graft (20930/20931) is separately billable — frequently missed add-on
- Cage/device (+22851) is separately billable per level — another commonly missed add-on
- Wound closure included in all surgical spine codes
- Fluoroscopy (77003) used for guidance during injections — separately billable

SPINE-SPECIFIC RULES:
- Medicare LCDs for lumbar fusion are strict: document failed conservative treatment (PT, injections, duration), neurological deficit, and imaging correlation
- Multi-level fusion requires individual justification per level — document each level's pathology
- Number of levels is critical: always confirm from operative report
- Lumbar spinal stenosis (M48.06) vs. disc herniation (M51.16) — specificity matters for LCD
- TLIF (22633) vs. PLIF (22630) — confirm from operative approach documentation
- Anterior approach codes differ from posterior — verify surgical approach before coding
- Do NOT code discectomy and fusion at the same level without -59/XS and clear documentation`,

  "Pain Management": `
SPECIALTY: PAIN MANAGEMENT
You are an expert pain management CPT and ICD-10 coding assistant. Focus on epidural steroid injections, facet joint procedures, nerve blocks, radiofrequency ablation, spinal cord stimulation, and trigger point injections.

KEY CODE FAMILIES:
- Epidural steroid injections (ESI): 62320 (cervical/thoracic interlaminar), 62322 (lumbar/sacral interlaminar), 62321/62323 (with imaging guidance — preferred)
- Transforaminal ESI: 64479 (cervical/thoracic single), +64480 (each additional), 64483 (lumbar/sacral single), +64484 (each additional)
- Facet joint injections: 64490 (cervical/thoracic first), +64491 (second), +64492 (third+), 64493 (lumbar/sacral first), +64494 (second), +64495 (third+)
- Radiofrequency ablation (RFA): 64633 (cervical/thoracic first), +64634 (each additional), 64635 (lumbar/sacral first), +64636 (each additional)
- SI joint injection: 27096 (with imaging), 0775T (RFA of SI joint)
- Trigger point injections: 20552 (1-2 muscles), 20553 (3+ muscles)
- Spinal cord stimulator: 63650 (trial percutaneous), 63655 (permanent laminectomy lead), 63663/63664 (revision), 63685 (generator implant/replace)
- Nerve blocks: 64415 (brachial plexus), 64447 (femoral), 64450 (other peripheral nerve)

IMAGING GUIDANCE ADD-ONS (critical — frequently undercoded):
- 77003: fluoroscopic guidance — separately billable with ESI, facet, SI joint injections
- 76942: ultrasound guidance — separately billable with peripheral nerve blocks, joint injections
- 77021: CT guidance — separately billable for CT-guided injections
- NOTE: Transforaminal ESI codes (64479–64484) INCLUDE imaging guidance — do NOT separately bill 77003

COMMON ADD-ON CODES:
- +64480: additional cervical/thoracic transforaminal ESI level
- +64484: additional lumbar/sacral transforaminal ESI level
- +64491/64492: additional cervical/thoracic facet levels (2nd and 3rd+)
- +64494/64495: additional lumbar/sacral facet levels (2nd and 3rd+)
- +64634: additional cervical/thoracic RFA level
- +64636: additional lumbar/sacral RFA level

NCCI BUNDLING (pain management-specific):
- Imaging guidance (77003) bundles INTO transforaminal codes (64479–64484) — never bill separately with transforaminals
- Interlaminar ESI (62320–62323) does NOT include imaging — bill 77003 separately when used
- Facet injection and RFA of same joint on same day are bundled — cannot bill both
- Trigger point (20552/20553) and E/M on same day requires -25 modifier if truly separate
- Cannot bill diagnostic nerve block and therapeutic injection of same nerve same day
- Spinal cord stimulator trial and permanent implant: separate encounters required

PAIN MANAGEMENT SPECIFIC RULES:
- Medicare LCD requirements for injections: document failed conservative treatment, duration, specific diagnosis, prior imaging (MRI/CT preferred)
- Frequency limits (Medicare): ESI limited to 3/year per region; facet joints limited by LCD; RFA requires failed diagnostic block
- Bilateral procedures: bill -50 or separate lines with -LT/-RT; facet injections billed per side per level
- Units drive billing for facets and transforaminals: confirm exact number of levels and sides from procedure note
- Medial branch blocks (MBB) required before RFA in most Medicare LCDs — document 2 prior MBBs with >50% relief
- SI joint: Medicare requires imaging confirmation + failed conservative treatment; 27096 is preferred over unlisted
- Drug coding: administered drugs (steroid, anesthetic) are NOT separately billable in facility settings; may be billable in office
- Always flag when documentation does not specify number of levels or laterality — these are the most common denial triggers`
};

function buildSystemPrompt(specialty: string): string {
  const normalizedSpecialty = specialty?.trim() || "Orthopedics";
  const addendum = SPECIALTY_ADDENDA[normalizedSpecialty] ?? SPECIALTY_ADDENDA["Orthopedics"];
  return `${addendum}\n\n${BASE_PROMPT}`;
}

function buildUserMessage(
  clinicalInput: string,
  specialty: string,
  laterality: string,
  patientType: string,
  setting: string,
  timeSpent: string,
  payerType: string,
  globalPeriod: string,
  units: string,
): string {
  return `Analyze this ${specialty || "orthopedic"} encounter and provide coding suggestions.

CLINICAL INPUT:
${clinicalInput}

CONTEXT:
- Specialty: ${specialty || "Orthopedics"}
- Laterality: ${laterality || "Not specified"}
- Patient type: ${patientType || "Not specified"}
- Setting: ${setting || "Office/Outpatient"}
- Time spent: ${timeSpent || "Not specified"}
- Payer type: ${payerType || "Not specified"}
- Global period status: ${globalPeriod || "Not in global period / Unknown"}
- Units of service: ${units || "1"}

Respond with ONLY this JSON structure:

{
  "primary_code": {
    "cpt_code": "XXXXX",
    "description": "Brief procedure description",
    "confidence": "high|medium|low",
    "global_period_days": 0,
    "rvu": 0.0
  },
  "add_on_codes": [
    {
      "cpt_code": "+XXXXX",
      "description": "Add-on code description",
      "requires_primary": "Primary CPT code this add-on requires",
      "reason": "Why this add-on code applies"
    }
  ],
  "alternatives": [
    {
      "cpt_code": "XXXXX",
      "description": "Brief description",
      "why_consider": "When this code would apply instead"
    }
  ],
  "icd10_codes": [
    {
      "code": "XXX.XX",
      "description": "Diagnosis description",
      "necessity": "How this diagnosis justifies the procedure",
      "sequence_position": 1
    }
  ],
  "modifiers": [
    {
      "code": "-XX",
      "name": "Modifier name",
      "apply": true,
      "reason": "Why this modifier applies or why coder should verify",
      "payer_note": "Any payer-specific note about this modifier (e.g., Medicare prefers -XS over -59)"
    }
  ],
  "rationale": "3-5 sentence structured explanation. Sentence 1: cite the specific documentation element(s) that drove code selection (e.g., 'Documentation states total knee arthroplasty performed on right knee'). Sentence 2: explain payer-specific considerations applied (e.g., 'Medicare requires X-modifier over -59; commercial accepts -59'). Sentence 3: note any bundling/conflict checks performed (e.g., 'No NCCI PTP conflicts identified between submitted codes'). Sentence 4: state confidence basis (e.g., 'High confidence — procedure, laterality, and medical necessity are clearly documented'). Sentence 5 (optional): note any documentation gaps or coder action items.",
  "missing_information": ["Item missing from documentation that affects accuracy"],
  "warnings": [
    {
      "type": "error|warning|info",
      "message": "What the coder should know or verify"
    }
  ],
  "clean_claim_ready": true
}

RULES:
- Provide 2-3 alternatives even if primary confidence is high
- Provide at least 1 ICD-10 code, sequenced correctly (primary reason first)
- Include sequence_position on each ICD-10 code (1 = primary, 2 = secondary, etc.)
- Always evaluate -LT/-RT for unilateral procedures
- Always evaluate -25 if E/M and procedure appear on same day
- Include payer_note on modifiers whenever payer is known and payer-specific rules differ
- Include global_period_days on primary code (0, 10, or 90)
- Include rvu on primary code (work RVU value — use standard published values)
- Set clean_claim_ready to false if any missing_information items exist
- Include at least one warning if confidence is medium or low
- Surface add_on_codes separately — do NOT bury them in alternatives
- The rationale MUST follow the structured format: (1) documentation citation, (2) payer context, (3) bundling check, (4) confidence basis. Do not give generic rationale — every sentence must reference specific data from the clinical input or coding context
- Apply Medicare modifier rules when payer_type is Medicare (prefer XE/XS/XP/XU over -59)
- Never code rule-out diagnoses in outpatient settings`;
}

function extractJSON(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    // Fall through to extraction
  }

  const patterns = [
    /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/,
    /(\{[\s\S]*\})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        continue;
      }
    }
  }

  return null;
}

interface ErrorResponse {
  error: true;
  error_code: string;
  error_message: string;
  user_message: string;
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  userMessage: string
): Response {
  const body: ErrorResponse = {
    error: true,
    error_code: code,
    error_message: message,
    user_message: userMessage,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const requestLog: number[] = [];
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(): boolean {
  const now = Date.now();
  while (requestLog.length > 0 && requestLog[0] < now - RATE_WINDOW_MS) {
    requestLog.shift();
  }
  if (requestLog.length >= RATE_LIMIT) {
    return true;
  }
  requestLog.push(now);
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(
      405,
      "METHOD_NOT_ALLOWED",
      "Only POST requests accepted",
      "Something went wrong. Please try again."
    );
  }

  if (isRateLimited()) {
    return errorResponse(
      429,
      "RATE_LIMITED",
      "Too many requests",
      "Please wait a moment before submitting another request."
    );
  }

  try {
    const body = await req.json();
    const {
      clinical_input,
      specialty = "Orthopedics",
      laterality = "",
      patient_type = "",
      setting = "",
      time_spent = "",
      payer_type = "",
      global_period = "",
      units = "1",
    } = body;

    if (!clinical_input || typeof clinical_input !== "string") {
      return errorResponse(
        400,
        "MISSING_INPUT",
        "clinical_input is required",
        "Please enter clinical documentation before submitting."
      );
    }

    if (clinical_input.trim().length < 10) {
      return errorResponse(
        400,
        "INPUT_TOO_SHORT",
        "clinical_input must be at least 10 characters",
        "Please provide more detail about the clinical encounter."
      );
    }

    if (clinical_input.length > 15000) {
      return errorResponse(
        400,
        "INPUT_TOO_LONG",
        "clinical_input exceeds 15000 character limit",
        "Please shorten the clinical documentation. You can summarize the key procedure details."
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return errorResponse(
        500,
        "CONFIG_ERROR",
        "ANTHROPIC_API_KEY not configured",
        "The service is not properly configured. Please contact support."
      );
    }

    const model = Deno.env.get("CLAUDE_MODEL") || "claude-sonnet-4-20250514";

    const systemPrompt = buildSystemPrompt(specialty);
    const userMessage = buildUserMessage(
      clinical_input.trim(),
      specialty,
      laterality,
      patient_type,
      setting,
      time_spent,
      payer_type,
      global_period,
      units,
    );

    const apiResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        temperature: 0.1,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!apiResponse.ok) {
      const apiError = await apiResponse.text();
      console.error("Claude API error:", apiResponse.status, apiError);

      if (apiResponse.status === 429) {
        return errorResponse(
          503,
          "AI_RATE_LIMITED",
          "Claude API rate limited",
          "Our AI service is temporarily busy. Please try again in a few seconds."
        );
      }

      if (apiResponse.status === 401) {
        return errorResponse(
          500,
          "AI_AUTH_ERROR",
          "Claude API authentication failed",
          "The service is experiencing a configuration issue. Please contact support."
        );
      }

      return errorResponse(
        502,
        "AI_ERROR",
        `Claude API returned ${apiResponse.status}`,
        "Our AI service is temporarily unavailable. Please try again."
      );
    }

    const apiData = await apiResponse.json();
    const responseText = apiData?.content?.[0]?.text;

    if (!responseText) {
      return errorResponse(
        502,
        "AI_EMPTY_RESPONSE",
        "Claude returned empty response",
        "The AI did not return a result. Please try rephrasing your input."
      );
    }

    const codingResult = extractJSON(responseText);

    if (!codingResult) {
      console.error("Failed to parse Claude response:", responseText.substring(0, 500));
      return errorResponse(
        502,
        "AI_PARSE_ERROR",
        "Could not parse AI response as JSON",
        "The AI returned an unexpected format. Please try again."
      );
    }

    const result = {
      primary_code: codingResult.primary_code || {
        cpt_code: "UNKNOWN",
        description: "Unable to determine code",
        confidence: "low",
        global_period_days: null,
        rvu: null,
      },
      add_on_codes: codingResult.add_on_codes || [],
      alternatives: codingResult.alternatives || [],
      icd10_codes: codingResult.icd10_codes || [],
      modifiers: codingResult.modifiers || [],
      rationale: codingResult.rationale || "No rationale provided.",
      missing_information: codingResult.missing_information || [],
      warnings: codingResult.warnings || [],
      clean_claim_ready: codingResult.clean_claim_ready ?? false,
    };

    if (
      Array.isArray(result.missing_information) &&
      result.missing_information.length > 0
    ) {
      result.clean_claim_ready = false;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      (err as Error).message || "Unknown error",
      "Something went wrong. Please try again."
    );
  }
});
