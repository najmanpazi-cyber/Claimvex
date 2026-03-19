# CLAUDE.md — ClaimVex Project Instructions

## What This Project Is

ClaimVex is an AI-powered CPT coding assistant for orthopedic practices. A medical coder or clinician pastes raw clinical notes and gets accurate CPT codes, ICD-10 codes, and modifiers back in 3–5 seconds — eliminating manual lookup errors and the revenue lost to undercoding or claim denials.

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

## Known Issues

- `bun run test` (Vitest) fails on Bun 1.3.10 + Windows with "File URL path must be an absolute path". Use `bun test src/` as the workaround.
- `vitest.config.ts` uses `fileURLToPath(new URL(..., import.meta.url))` for Windows path safety.
