---
name: weekly-report
description: Generate a weekly project status report from git history and codebase state
user_invocable: true
---

Generate a weekly status report for Claive. Gather data from:

1. **Git log** (last 7 days): commits, authors, what changed
2. **Test suite:** Run `bun test src/` and report pass/fail counts
3. **Type check:** Run `bunx tsc --noEmit` and report any errors
4. **Build status:** Run `bun run build` and confirm it succeeds
5. **Open issues:** Check `gh issue list` if GitHub CLI is available
6. **ACC spec progress:** Summarize which ACC specs are complete vs in-progress

Format as:

```
Weekly Report — Claive
Week of [date]
══════════════════════════

## Commits This Week
- [commit summaries]

## Quality
- Tests: X passed, Y failed
- Type errors: N
- Build: pass/fail

## ACC Spec Progress
- [table of specs and status]

## Open Issues
- [list or "none"]

## Recommendations
- [any suggested next steps based on what you see]
```
