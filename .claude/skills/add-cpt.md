---
name: add-cpt
description: Add new CPT codes to existing validator rule data files
user_invocable: true
---

The user wants to add new CPT codes to the validator data files. Ask for:
1. **Which CPT code(s)** to add
2. **Which validator(s)** they apply to (PTP, MUE, Modifier 59/X, Global Period, Documentation Sufficiency)
3. **Source** (CMS NCCI edit file, Medicare fee schedule, AMA CPT manual, etc.)

## Rules (non-negotiable)
- All rule data must trace to a CMS, AMA, or payer source. No invented rules.
- Only orthopedic CPT codes are in scope.
- Follow the exact JSON schema of the existing data files.

## Steps
1. Read the target data file(s) to understand the schema
2. Validate the CPT code exists and is orthopedic
3. Add the entry following the exact existing format
4. Run `bun test src/` to confirm zero regressions
5. Show the user what was added for review

## Data file locations
- PTP: `src/data/ptp/rules.orthopedics.v1.json`
- MUE: `src/data/mue/mue.orthopedics.q1-2026.json`
- Modifier 59/X: `src/data/modifiers/modifier59x.rules.orthopedics.v1.json`
- Global Period: `src/data/global/global.*.json`
- Documentation: `src/data/documentation/documentation.rules.orthopedics.v1.json`
