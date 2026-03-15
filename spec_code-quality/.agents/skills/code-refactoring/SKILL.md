---
name: code-refactoring
description: Own behavior-preserving structural improvement. Use when reducing complexity, untangling dependencies, or removing duplication without silently changing product or contract semantics.
metadata:
  tags: refactoring, code-quality, maintainability, complexity, behavior-preservation
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Code Refactoring

`code-refactoring` is the canonical quality owner for structural cleanup.

It owns how code is reshaped safely. It does **not** own business-rule rewrites, API contract changes, or test-policy ownership.

See `../../../DOMAIN-OWNERSHIP.md` before broad changes.

## Use this skill when

- structure is hard to reason about
- duplication is causing drift
- boundaries need to be separated before new work
- a bug fix exposed deeper design debt
- maintainability is falling even though behavior is still understood

## Default posture

Refactoring is **behavior-preserving unless an external owner explicitly approves a semantic change**.

If you cannot explain current behavior, use `../systematic-debugging/SKILL.md` first.

## Refactoring loop

### 1. Map current behavior and ownership

Before editing, capture:

- intended behavior
- invariants that must stay true
- external owners of contract or product meaning
- risk areas: persistence, concurrency, migrations, permissions, public outputs

### 2. Build the safety net

Choose the smallest verification that proves behavior is preserved.

Use `../testing-strategies/SKILL.md` to decide:

- what test layers are required
- which failure paths must stay intact
- what release evidence is needed

### 3. Choose the smallest structural move

Preferred moves:

- extract function or module seams
- separate responsibilities
- reduce duplication
- replace hidden coupling with explicit dependencies
- flatten control flow
- rename for clearer intent

Do not combine a cleanup pass with unrelated feature work.

### 4. Change incrementally

Good refactoring traits:

- each step has a clear purpose
- each step can be verified independently
- public behavior remains stable
- rollback is obvious if a step fails

### 5. Re-verify and summarize

After the refactor, confirm:

- same intended behavior
- same contract semantics unless approved otherwise
- same critical failure handling
- no new hidden coupling

## Refactoring summary template

```markdown
## Refactoring Summary

### Intent
- problem being reduced:
- behavior expected to stay the same:

### Structural changes
1. 
2. 

### Verification
- tests/checks run:
- risks reviewed:
- semantic-owner approval needed?: yes/no

### Follow-ups
- remaining debt:
- deferred cleanup:
```

## Boundary rules

- If behavior meaning is unclear, switch to `../systematic-debugging/SKILL.md` first.
- If the main question is whether the patch is acceptable, use `../code-review/SKILL.md`.
- If the main question is which tests protect the change, use `../testing-strategies/SKILL.md`.

## Common refactoring failures

- changing business behavior under the label “cleanup”
- broad rewrites without a safety net
- mixing architectural cleanup with new feature delivery
- deleting useful seams because they “look verbose”
- preserving code shape while leaving the real coupling untouched

## Delivery checklist

- [ ] current behavior mapped
- [ ] external semantic owners identified
- [ ] safety net chosen before broad edits
- [ ] structural moves kept incremental
- [ ] behavior preservation verified
