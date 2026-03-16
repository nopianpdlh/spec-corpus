# Code Quality Spec Index

`spec_code-quality` is the reusable baseline for deciding how software quality is reviewed, improved, debugged, tested, and optimized without silently taking ownership of product-domain truth.

Use this file as the entry point for the code-quality corpus after routing from the root docs.

## How to Read This Repo

There are three layers:

1. **Canonical quality owners** — the local skills that own review, refactoring, test-strategy, and optimization guidance.
2. **Process companions** — useful workflows that help quality work happen safely but do not redefine the quality domains.
3. **Governance docs** — the documents that explain precedence, adoption, and safe reuse.

If two quality documents seem to overlap, resolve the conflict with `DOMAIN-OWNERSHIP.md`.

## Canonical Quality Owners

| Domain | Owner | Use for |
|---|---|---|
| Change review and risk triage | `.agents/skills/code-review/SKILL.md` | review scope, severity, evidence expectations, escalation to domain owners |
| Structural improvement and code reshaping | `.agents/skills/code-refactoring/SKILL.md` | decomposition, seam creation, duplication removal, safe behavior-preserving cleanup |
| Verification strategy and quality gates | `.agents/skills/testing-strategies/SKILL.md` | test-layer choice, deterministic verification, failure-path coverage, release evidence |
| Performance investigation and optimization | `.agents/skills/performance-optimization/SKILL.md` | bottleneck analysis, budget alignment, measurement-driven optimization, regression checks |

## Process Companions

| Skill | Role |
|---|---|
| `.agents/skills/systematic-debugging/SKILL.md` | imported debugging workflow companion for hypothesis-driven fault isolation; useful across quality work, but not the owner of every quality decision |

## Owner Relationship Summary

- `code-review` decides how changes are evaluated, not what the product/API domain should mean.
- `code-refactoring` owns structural improvement patterns, not business-rule rewrites.
- `testing-strategies` owns how confidence is built before release, not the consumer-visible contract itself.
- `performance-optimization` owns how performance work is measured and executed, not whether product behavior should change.
- `systematic-debugging` is a process companion that helps find root causes when behavior is broken or unclear.

## Recommended Reading Order

### If you are adopting `spec_code-quality` on a new project

1. `DOMAIN-OWNERSHIP.md`
2. `NEW-PROJECT-CHECKLIST.md`
3. `code-review`
4. the owner skills that match the current risk surface
5. `systematic-debugging` when the problem is not yet understood

### If you are reviewing or improving a change

1. `code-review`
2. `testing-strategies`
3. `code-refactoring` if structure needs to change
4. `performance-optimization` if latency, throughput, or resource use matters
5. `systematic-debugging` if the problem is still ambiguous

## What This Repo Does Not Own

`spec_code-quality` does **not** replace:

- frontend/backend/domain contract ownership
- product requirements or UX policy
- security/privacy policy ownership
- platform/infrastructure governance
- release-management policy outside quality evidence expectations

Use `DOMAIN-OWNERSHIP.md` to connect this repo safely to the relevant external owners.
