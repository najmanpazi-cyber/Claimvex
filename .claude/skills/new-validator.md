---
name: new-validator
description: Scaffold a new ACC validator following the established pattern
user_invocable: true
---

# New Validator Scaffold

The user wants to create a new validator. Ask for:
1. **ACC number** (e.g., ACC-16)
2. **Validator name** (e.g., "Age-Based Modifier Validator")
3. **Brief description** of what it validates

Then scaffold ALL of the following files, following the exact patterns established by existing validators (ACC-04 through ACC-08):

## Files to create:

1. **Data file:** `src/data/{domain}/{domain}.rules.orthopedics.v1.json`
   - Follow the JSON schema from `src/schemas/` and type contracts in `src/types/ruleEngine.ts`
   - Include metadata: source, effectiveDate, version

2. **Validator:** `src/validators/{name}Validator.ts`
   - Pure function, strict TypeScript, no `any`
   - Follow the pattern from existing validators (ptpValidator, mueValidator, etc.)
   - Return typed results matching ruleEngine.ts contracts

3. **Apply utility:** `src/utils/apply{Name}Validation.ts`
   - Bridges data + validator
   - Follow the pattern from existing apply utilities

4. **Test file:** `src/test/validators/{name}Validator.test.ts`
   - Multiple explicit assertions per test (no snapshots)
   - Cover: valid input, edge cases, boundary conditions, error cases
   - Minimum 10 test cases

5. **Documentation:** `docs/ACC-{NN}-{NAME}.md`
   - Follow existing ACC doc format
   - Include: overview, rule source, data schema, validation logic, test coverage

After scaffolding, run `bun test src/` to confirm zero regressions.
