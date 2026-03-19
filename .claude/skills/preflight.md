---
name: preflight
description: Run all quality checks before shipping — tests, typecheck, lint, build
user_invocable: true
---

Run ALL of the following checks in sequence. Stop and report on the first failure. Use the project's Bun-based commands (NOT npm).

1. **Type check:** `bunx tsc --noEmit`
2. **Lint:** `bun run lint`
3. **Tests:** `bun test src/`
4. **Build:** `bun run build`

After all checks pass, output a summary:

```
Preflight ✓
- TypeCheck: pass
- Lint: pass
- Tests: X passed, 0 failed
- Build: pass
Ready to ship.
```

If any check fails, stop immediately and output:

```
Preflight ✗
- [failed step]: [error summary]
Action needed: [what to fix]
```
