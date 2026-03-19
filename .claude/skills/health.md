---
name: health
description: Quick health check — git status, test suite, build, dependency audit
user_invocable: true
---

Run a quick health check on the project. Report status for each:

1. **Git status:** Any uncommitted changes? What branch? How far ahead/behind remote?
2. **Dependencies:** Run `bun install` — any issues?
3. **Type check:** `bunx tsc --noEmit` — any type errors?
4. **Tests:** `bun test src/` — all passing?
5. **Build:** `bun run build` — builds cleanly?

Output a dashboard:

```
Health Check — ClaimVex
─────────────────────
Git:      [branch] | [clean/dirty] | [ahead/behind]
Deps:     [ok/issues]
Types:    [pass/X errors]
Tests:    [X passed, Y failed]
Build:    [pass/fail]
─────────────────────
Overall:  [HEALTHY / NEEDS ATTENTION]
```
