---
name: feature-brief
description: Draft a feature spec in ACC format from a product idea
user_invocable: true
---

The user has a product idea or feature request. Turn it into a structured spec following the ACC format used in this project.

Ask for:
1. **What** the feature does (user's description, can be rough)
2. **Who** it's for (medical coders, clinicians, billing managers?)
3. **Why** it matters (revenue impact, error reduction, compliance?)

Then produce a spec with:

```markdown
# ACC-{NN}: {Feature Title}

## Status
Draft — pending Execution Board review

## Objective
[1-2 sentences on what this achieves]

## User Story
As a [role], I want to [action] so that [benefit].

## Scope
- In scope: [bullet list]
- Out of scope: [bullet list]

## Technical Approach
- [How it fits into the existing architecture]
- [Which existing validators/components it touches]
- [New files needed]

## Acceptance Criteria
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

## Data Sources
- [CMS/AMA/payer sources needed]

## Test Plan
- [What test cases are needed]
- [Edge cases to cover]

## Dependencies
- [Other ACC specs or external dependencies]
```

Save to `docs/ACC-{NN}-{slug}.md` only after user approval.
