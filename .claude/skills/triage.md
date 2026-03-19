---
name: triage
description: Triage open GitHub issues and suggest priorities
user_invocable: true
---

Analyze open issues and suggest priorities. Steps:

1. Run `gh issue list --state open --limit 50` to get open issues
2. If no GitHub issues, check git log for TODO/FIXME/HACK comments in the codebase
3. Run `bun test src/` to find any failing tests
4. Run `bunx tsc --noEmit` to find type errors

Categorize everything found into:

```
Issue Triage — ClaimVex
═════════════════════

## Critical (fix before shipping)
- [blocking bugs, failing tests, type errors]

## High (fix this week)
- [user-facing bugs, compliance issues]

## Medium (next sprint)
- [feature requests, tech debt]

## Low (backlog)
- [nice-to-haves, minor improvements]

## Recommended Next Action
[What to work on first and why]
```
