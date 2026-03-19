---
name: deploy-check
description: Verify deployment health after shipping
user_invocable: true
---

Run post-deployment verification:

1. **Build check:** `bun run build` — confirm production build succeeds
2. **Test suite:** `bun test src/` — confirm all tests pass
3. **Type check:** `bunx tsc --noEmit` — no type regressions
4. **Git status:** Confirm working tree is clean and on expected branch
5. **GitHub Actions:** Run `gh run list --limit 5` to check recent CI runs
6. **Supabase:** If `supabase` CLI is available, check edge function status

Output:

```
Deploy Check — ClaimVex
─────────────────────
Build:     [pass/fail]
Tests:     [X passed, Y failed]
Types:     [pass/X errors]
Git:       [branch] [clean/dirty]
CI:        [last run status]
Edge Fns:  [status or "CLI not available"]
─────────────────────
Verdict:   [GOOD TO GO / ISSUES FOUND]
```
