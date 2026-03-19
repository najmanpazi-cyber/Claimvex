# CLAUDE.md — ClaimVex Project Instructions

## What This Project Is

ClaimVex is an AI-powered CPT coding validation engine for orthopedic practices. Medical coders enter CPT codes, modifiers, and date of service into a structured form and get instant pass/fail results from 5 validator modules (PTP pairs, MUE limits, Modifier 59/X, Global Period, Documentation Sufficiency). The tool catches coding errors before claims are submitted — reducing denials and revenue leakage. Beta product targeting 3-5 practices with a 30-day free trial → $99/mo conversion.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase edge functions (Deno runtime), Claude API
- **Package manager:** Bun (NOT npm). Path: `C:\Users\najma\.bun\bin`
- **Test runner:** `bun test src/` (NOT `bun run test` — Vitest is broken on Bun + Windows)
- **Dev server:** `bun run dev` (port 8080)
- **Type check:** `bunx tsc --noEmit`

## Commands

```bash
bun run dev          # Start dev server
bun test src/        # Run all tests (use this, not vitest directly)
bunx tsc --noEmit    # Type check
bun run build        # Production build
bun run lint         # ESLint
```

## Architecture Decisions

### Validator Pipeline — Client-Side
Validators run in the browser after Claude returns results. The edge function stays simple (Claude API call only). The 5 validators (PTP, MUE, Modifier 59/X, Global Period, Documentation Sufficiency) are standalone modules that post-process Claude's output client-side.

### ACC Spec Structure (Preserve This)
The ACC numbering system and file layout is load-bearing. Every validator follows this pattern:

```
src/data/{domain}/         → Rule data (JSON)
src/validators/            → Validator logic
src/utils/apply*           → Validation executor (bridges data + validator)
src/test/validators/       → Test suite
docs/ACC-{NN}-*.md         → Implementation documentation
```

Do NOT restructure, rename, or deviate from this layout without explicit approval.

### HIPAA De-Identification — Non-Negotiable
The 13 PHI pattern detectors and the live PHI banner must NEVER be weakened or removed. Any change touching HIPAA/de-identification logic requires explicit user approval before implementation. This is not optional.

## Coding Standards

### TypeScript
- Strict typing. No `any`. Use explicit return types.
- Prefer interfaces over type aliases where appropriate.
- Follow the type contracts in `src/types/ruleEngine.ts` (ACC-03).

### Style
- Functional style: pure functions, immutability, composition over inheritance.
- Follow existing patterns in the codebase — don't invent new abstractions.
- Code should be self-documenting. Only comment non-obvious logic.
- Don't add docstrings, comments, or type annotations to code you didn't change.
- Don't over-engineer. Only make changes that are directly requested or clearly necessary.

### Dependencies
Do NOT add new npm/bun packages without asking first.

## Testing

- Every new validator or rule MUST ship with a test file following `src/test/validators/*.test.ts`.
- Prefer many explicit assertions per test over snapshot testing. Each test verifies specific fields.
- When possible, test cases should align with ACC-02 test pack scenarios (`specs/ACC-02-scenarios.jsonl`).
- Always run `bun test src/` and confirm zero regressions before committing.

## Data & Rule Sources

- **CMS-anchored only:** All rule data must trace to a CMS, AMA, or payer source. No invented rules.
- **Orthopedics v1 scope only:** Only orthopedic CPT codes are in scope. Do not add other specialties without discussion.
- Spec owner: Execution Board.
- Payer priority: Commercial first, Medicare second.

## Git & Commits

- **Conventional commits:** `feat(ACC-09): description`, `fix(PTP): description`, etc.
- **Atomic commits:** Each commit is a single logical change. Don't bundle unrelated work.
- **Never auto-commit.** Only commit when explicitly asked.
- **Never force push to main.**

## Communication Style

- Be concise and direct. No filler, no preamble.
- For clear tasks, just execute. Only ask when there's genuine ambiguity or risk.
- Lead with actions and decisions, explain only when needed.
- Don't give time estimates.

## Build Plan (CLAIMVEX_BUILD_PLAN.md)

Full build plan is in `CLAIMVEX_BUILD_PLAN.md`. Summary of the 5 phases:

### Phase 1: Authentication — COMPLETE
Supabase Auth with email+password. Routes: `/login`, `/signup`, `/dashboard` (protected). Nav bar with logo, user email, logout. Color palette: navy #004A7C, teal #00796B.

**Completed files:**
- `src/contexts/AuthContext.tsx` — AuthProvider + useAuth hook (signUp, signIn, signOut, session state)
- `src/components/ProtectedRoute.tsx` — redirects unauthenticated users to /login
- `src/pages/Login.tsx` — email+password form with error handling
- `src/pages/Signup.tsx` — email+password+confirm form with email confirmation flow
- `src/pages/Dashboard.tsx` — protected page with nav bar (logo, email, logout) + placeholder card
- `src/App.tsx` — updated routes, AuthProvider wraps all routes

**Notes for Phase 2:** Dashboard is a placeholder. Build the validation input form as the main content of `/dashboard`. The AuthProvider and nav bar are ready to reuse.

### Phase 2: Validation Input Form — COMPLETE
Structured form on dashboard: CPT code(s), modifier(s), date of service, optional ICD-10 and patient age. Client-side validation. Clean card-based layout for non-technical billing coders.

**Completed files:**
- `src/components/ValidationForm.tsx` — form component with 5 fields, client-side validation, Clear/Validate buttons
- `src/pages/Dashboard.tsx` — updated to use ValidationForm, logs payload to console (Phase 3 wires validators)

**Notes for Phase 3:** `ValidationFormData` interface exports `cptCodes`, `modifiers`, `dateOfService`, `icd10Code`, `patientAge`. Build a service layer that transforms this into each validator's input format and runs all 5.

### Phase 3: Wire Validators + Results Display — COMPLETE
Service layer adapts form input → validator format. Runs all 5 validators (PTP, MUE, Modifier 59/X, Global Period, Doc Sufficiency). Results panel with per-validator PASS/FAIL/WARNING cards, overall summary, expand/collapse details.

**Completed files:**
- `src/services/validationService.ts` — transforms form data → structured fields, runs all 5 validators, classifies results (pass/fail/warning/n-a), returns unified `ValidationResult`
- `src/components/ValidationResults.tsx` — overall summary card (green/red), per-module expandable cards with rule details, "Validate Another" button
- `src/pages/Dashboard.tsx` — wired: form → validationService → results display, toggles between form and results views

**Notes for Phase 4:** Validation runs client-side (all validators + rule data bundled in JS). Results are not yet persisted to Supabase. Next step stores each validation run in a `validations` table for history + metrics.

### Phase 4: History + Metrics — COMPLETE
Store validations in Supabase `validations` table (RLS per user). History page with sortable table. Metrics dashboard: total validations, errors caught, warnings, estimated denials prevented, estimated savings (errors × $35).

**Completed files:**
- `supabase/migrations/20260319000000_add_validations_and_profiles.sql` — creates `validations` table (RLS), `user_profiles` table (RLS), auto-profile trigger on signup
- `src/services/historyService.ts` — saveValidation, fetchValidations, computeMetrics ($35/denial)
- `src/pages/History.tsx` — 6 metric cards, history table with expandable results, empty state CTA
- `src/pages/Dashboard.tsx` — now saves to Supabase after each validation, added Validate/History nav tabs
- `src/App.tsx` — added `/history` protected route

**IMPORTANT:** Run the migration SQL in Supabase SQL Editor before testing. The `validations` and `user_profiles` tables must exist.

### Phase 5: Trial Management — COMPLETE
30-day free trial tracked via `user_profiles.trial_start`. Banner from day 21. After day 30: validation form disabled, history/metrics remain accessible (ROI data convinces conversion). Soft gate with CTA to continue at $99/mo.

**Completed files:**
- `src/services/trialService.ts` — fetchTrialStatus calculates days remaining, expiry, paid bypass, badge config
- `src/components/TrialBanner.tsx` — amber countdown banner, dismissable per session, mailto link
- `src/components/TrialExpiredGate.tsx` — replaces form when trial expired, links to history + contact
- `src/components/TrialBadge.tsx` — nav badge: teal (active trial), gray (expired), green (paid plan)
- `src/pages/Dashboard.tsx` — integrates trial banner, badge, expired gate
- `src/pages/History.tsx` — integrates trial banner and badge

**Manual activation:** Set `plan` column in `user_profiles` to `founding_partner` (or any paid plan) to bypass trial gate.

### All 5 Phases Complete
The full ClaimVex web application is built: auth, validation form, 5-module validation engine, results display, Supabase-backed history + ROI metrics, and trial management with soft gate.

### Design System
- Navy: #004A7C, Teal: #00796B, Error: #C62828, Warning: #E65100, Success: #2E7D32
- shadcn/ui components, Tailwind layout, healthcare-professional aesthetic

### What NOT to Touch
- Validator modules (ACC-04 through ACC-08) unless bug found during integration
- CI/CD pipeline and HIPAA guard hook
- Landing page (handled separately)

## Known Issues

- `bun run test` (Vitest) fails on Bun 1.3.10 + Windows with "File URL path must be an absolute path". Use `bun test src/` as the workaround.
- `vitest.config.ts` uses `fileURLToPath(new URL(..., import.meta.url))` for Windows path safety.
