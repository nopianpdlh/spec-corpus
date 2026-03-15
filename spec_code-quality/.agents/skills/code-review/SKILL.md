---
name: code-review
description: Own the review model for correctness, maintainability, risk, and evidence. Use when deciding whether a change is acceptable, what proof is missing, and which external owner must approve semantic impact.
allowed-tools: Read Grep Glob
metadata:
  tags: code-review, code-quality, risk, maintainability, verification
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Code Review

`code-review` is the canonical quality owner for evaluating changes.

It owns review framing, severity, evidence expectations, and escalation paths. It does **not** own product requirements, public API semantics, infrastructure policy, or security/privacy policy by default.

See `../../../DOMAIN-OWNERSHIP.md` before using this skill in an unfamiliar repo.

## Use this skill when

- reviewing a PR or patch
- deciding whether a change is safe to merge
- determining what evidence is missing for a risky change
- triaging maintainability, correctness, security, performance, or test concerns
- escalating a semantic concern to the correct external owner

## Do not use this skill as

- a replacement for domain ownership
- a reason to invent new requirements
- a blanket approval to rewrite architecture
- a substitute for `code-refactoring`, `testing-strategies`, or `performance-optimization`

## Review loop

### 1. Understand the change surface

Capture:

- the intended outcome
- files and systems touched
- whether behavior, structure, or both changed
- who owns the meaning of the affected behavior

If the change alters consumer-visible semantics, identify the external owner first.

### 2. Check correctness and failure handling

Look for:

- mismatched assumptions between code paths
- missing edge-case handling
- inconsistent success vs failure behavior
- hidden coupling or side effects
- silent fallback behavior without evidence

### 3. Check maintainability

Look for:

- unclear boundaries or mixed responsibilities
- duplication that will drift
- brittle naming or surprising abstractions
- dead paths, speculative branches, or unused configuration
- comments or docs that no longer match the code

### 4. Check quality implications

Evaluate whether the change has credible evidence for:

- tests or other verification proportional to risk
- migration or rollback if stateful behavior changed
- performance impact if hot paths changed
- security/privacy implications if trust boundaries changed
- release/documentation impact if external consumers are affected

### 5. Escalate semantic ownership correctly

`code-review` can flag semantic risk, but it does not decide semantic truth.

Escalate when the review touches:

- public API or event contracts
- product requirements or UX rules
- infra/runtime policy
- security/privacy policy

### 6. Produce a decision with evidence

Use a severity model such as:

- **blocker** — unsafe to merge; correctness, data-loss, contract, or policy risk
- **major** — strong concern; should be resolved before merge unless explicitly waived
- **minor** — worthwhile improvement; safe to defer if tracked
- **note** — context, praise, or follow-up suggestion

## Review output template

```markdown
## Review Summary

### Verdict
- status: approve | approve-with-notes | changes-requested
- highest severity: blocker | major | minor | note

### Findings
1. [severity] [title]
   - evidence:
   - impact:
   - recommended action:
   - external owner needed?: yes/no

### Evidence Checked
- tests:
- docs/contracts:
- rollout or migration:
- performance/security considerations:
```

## Boundary rules

- If the question is **"is this change acceptable?"**, `code-review` owns it.
- If the question is **"how do we restructure this safely?"**, move to `../code-refactoring/SKILL.md`.
- If the question is **"what tests or checks are sufficient?"**, move to `../testing-strategies/SKILL.md`.
- If the question is **"what should we measure or optimize?"**, move to `../performance-optimization/SKILL.md`.

## Common review failures

- approving semantic changes without the real owner
- demanding framework-specific patterns as if they were universal rules
- reporting style nits while skipping riskier correctness issues
- asking for more tests without naming the missing confidence gap
- confusing “I would write it differently” with “this is unsafe”

## Delivery checklist

- [ ] change scope understood
- [ ] external owner identified where needed
- [ ] findings prioritized by risk
- [ ] evidence gaps named concretely
- [ ] semantic concerns escalated instead of silently decided locally
