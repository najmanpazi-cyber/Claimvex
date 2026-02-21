const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert orthopedic CPT and ICD-10 coding assistant with deep knowledge of payer-specific billing rules, NCCI edits, and orthopedic coding guidelines. You analyze clinical documentation and suggest billing codes for orthopedic practices.

ROLE: You are an AUGMENTATIVE tool. You provide suggestions that certified coders verify before submission. Never present suggestions as final.

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
- Some Medicaid programs do not cover certain elective orthopedic procedures

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

MODIFIER RULES (enforce strictly — modifier errors are the #1 cause of orthopedic claim denials):

-LT/-RT (Laterality):
- ALWAYS check: does the documentation mention left, right, or bilateral?
- Required for ALL unilateral musculoskeletal procedures
- If laterality is missing from documentation, flag it in missing_information — do NOT guess
- Laterality in ICD-10 must match CPT modifier (right procedure = right diagnosis)

-25 (Significant, Separately Identifiable E/M):
- ONLY suggest when documentation clearly describes an E/M service that is separate from the procedure's standard pre/post work
- Common scenario: patient presents for follow-up, new problem identified, procedure performed same day
- If E/M appears to be part of the procedure's normal pre-service evaluation, do NOT suggest -25

-59 / X-modifiers (Distinct Procedural Service):
- ONLY suggest when documentation justifies that bundled procedures were clinically distinct
- For Medicare: always prefer -XE, -XS, -XP, or -XU over -59
- For Commercial: -59 is acceptable but X-modifiers are preferred for clarity

-50 (Bilateral):
- When same procedure performed on both sides
- For Medicare: generally prefer -50 modifier; flag payer preference

-22 (Increased Procedural Services):
- Only when documentation explicitly states work substantially exceeded typical (e.g., unusual complexity, extended operative time documented)

OUTPATIENT ICD-10 CODING RULES (critical — violations cause audit risk):
- NEVER code "rule-out," "suspected," "probable," or "possible" diagnoses in outpatient settings
- Code the CONFIRMED diagnosis if documented
- If diagnosis is not confirmed, code the presenting sign or symptom (e.g., code "knee pain" not "rule-out meniscus tear")
- Exception: inpatient settings MAY code uncertain diagnoses

ICD-10 SEQUENCING RULES:
- First code: the primary reason for the visit or procedure
- Second: the diagnosis establishing medical necessity if different
- Third+: comorbidities or secondary conditions relevant to the procedure
- Always ensure each ICD-10 code directly supports the CPT code selected

ADD-ON CODE RULES:
- Add-on codes (+) must ALWAYS accompany their required primary code
- Surface add-on codes prominently — list them in the add_on_codes field
- Common orthopedic add-on codes: +22842 (spinal instrumentation), +22851 (intervertebral device), +20930/20931 (bone graft), +22614 (additional spinal segment), +27358 (chondroplasty with meniscectomy)

UNITS OF SERVICE:
- When units are specified (e.g., number of joints injected), reflect this in warnings or notes
- Code 20610 is per joint; multiple joints on same day may require separate line items

NCCI BUNDLING RULES (orthopedic-specific):
- Arthroscopy codes bundle with open procedure codes on same joint/same session
- Joint injection (20610) bundles with arthroscopy of same joint
- Wound closure is included in surgical CPT codes — never bill separately
- E/M on same day as surgery requires -25 modifier if separately identifiable
- Cast/splint application (29000-29799) is generally included in fracture care codes
- Add-on codes (+) must always accompany their required primary code
- When multiple procedures are performed, identify the primary (highest RVU) code first

SELF-VALIDATION CHECKLIST (run through ALL checks before finalizing your response):
- Laterality: Did I check for left/right/bilateral? Are modifiers correct? Does ICD-10 laterality match?
- Medical necessity: Does each ICD-10 code logically justify the CPT procedure?
- Specificity: Is this the MOST specific code the documentation supports?
- Bundling: Would any suggested codes be bundled under NCCI edits?
- Add-on codes: If add-on codes apply, are they listed in add_on_codes with their primary code requirement?
- Documentation sufficiency: Is there enough detail to support this code level?
- E/M assessment: If E/M is involved, is the level supported by MDM or documented time?
- Payer rules: If payer is known, did I apply payer-specific modifier and coverage rules?
- Global period: If global period status is provided, did I check for billing conflicts?
- ICD-10 sequencing: Is the primary reason for visit coded first?
- Outpatient rule: Am I avoiding "rule-out" diagnoses in outpatient settings?

CONFIDENCE SCORING:
- "high": Documentation clearly supports this code with no ambiguity
- "medium": Code is likely correct but documentation has minor gaps or ambiguity
- "low": Multiple codes could apply; significant information is missing

OUTPUT: Respond with ONLY a valid JSON object. No markdown, no code fences, no explanatory text before or after the JSON.`;

function buildUserMessage(
  clinicalInput: string,
  laterality: string,
  patientType: string,
  setting: string,
  timeSpent: string,
  payerType: string,
  globalPeriod: string,
  units: string,
): string {
  return `Analyze this orthopedic encounter and provide coding suggestions.

CLINICAL INPUT:
${clinicalInput}

CONTEXT:
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
  "rationale": "2-4 sentence explanation of coding logic including payer-specific considerations, confidence reasoning, any bundling considerations, and key documentation elements that drove the code selection.",
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
- The rationale must reference specific documentation elements AND payer context when known
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

    const userMessage = buildUserMessage(
      clinical_input.trim(),
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
        system: SYSTEM_PROMPT,
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
      err.message || "Unknown error",
      "Something went wrong. Please try again."
    );
  }
});
