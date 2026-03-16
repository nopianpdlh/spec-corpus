# Domain Ownership and Precedence

This file defines which document owns which quality domain and how to resolve overlap.

## Precedence Rules

When two documents seem to cover the same topic, resolve them in this order:

1. **The canonical quality owner wins inside its domain.**
2. **Quality owners evaluate and improve implementation; they do not silently replace product or API truth owned elsewhere.**
3. **Process companions help execution, but they do not become umbrella owners by implication.**
4. **External spec repositories keep ownership of their own domains** (frontend, backend, platform, security, product, QA policy).
5. **Recurring ambiguity must be written back here and into the relevant skill.**

## Quality-Owned Domains

| Domain | Canonical owner | Includes | Explicitly does not own |
|---|---|---|---|
| Change review and quality triage | `.agents/skills/code-review/SKILL.md` | review framing, severity, evidence requests, maintainability/correctness/risk checks, escalation paths | redefining API semantics, changing product requirements, owning security policy |
| Structural improvement and refactoring | `.agents/skills/code-refactoring/SKILL.md` | decomposition, naming cleanup, dead-code removal, dependency untangling, seam creation, safe migrations | changing business behavior without owner approval, replacing test strategy, changing public contracts by accident |
| Verification strategy and test portfolio design | `.agents/skills/testing-strategies/SKILL.md` | layer choice, deterministic setup, contract/failure-path coverage, release evidence expectations | owning the frontend/backend contract itself, tool-specific framework mandates for every repo |
| Performance investigation and optimization | `.agents/skills/performance-optimization/SKILL.md` | measurement, bottleneck isolation, budgets, regression checking, tradeoff documentation | redefining UX or product behavior, changing external contracts without owner input |

## Process Companion Scope

| Companion | Use for | Not a replacement for |
|---|---|---|
| `.agents/skills/systematic-debugging/SKILL.md` | root-cause isolation, hypothesis testing, narrowing unknown failures | code review, refactoring ownership, verification strategy, performance policy |

## Practical Boundary Rules

- If the question is **whether a change is acceptable and what evidence is missing**, `code-review` owns it.
- If the question is **how to reshape code without changing intended behavior**, `code-refactoring` owns it.
- If the question is **which tests or checks create enough confidence**, `testing-strategies` owns it.
- If the question is **what to measure and optimize for performance**, `performance-optimization` owns it.
- If the question is **why something is broken and the failure mode is still unclear**, use `systematic-debugging` as the workflow companion.

## Cross-Owner Examples

- **A review comment proposes changing a public response shape** → `code-review` can flag the issue, but backend/frontend contract owners decide the shape.
- **A refactor removes duplication but changes pagination semantics** → `code-refactoring` owns the structural work; the domain owner must approve the semantic change.
- **A testing plan adds contract tests for an API** → `testing-strategies` owns the verification pattern; backend/frontend owners still define the contract under test.
- **A performance improvement suggests weaker validation or reduced audit logging** → `performance-optimization` owns measurement and tradeoffs, but security/platform owners must approve policy-impacting changes.

## External Domain Ownership

| External domain | Owned outside `spec_code-quality` | Quality responsibility |
|---|---|---|
| Frontend or backend semantics | `spec_frontend`, `spec_backend`, or domain repos | evaluate and improve implementation quality without redefining those semantics |
| Security and privacy policy | security/privacy spec | surface risk, require evidence, and align implementation quality expectations |
| Platform / infrastructure | infra/platform spec | validate quality impact of runtime, deploy, and reliability choices |
| Product requirements | PRD/domain spec | assess implementation fitness without inventing requirements |

## Conflict Resolution Workflow

1. identify the disputed decision surface
2. find the quality owner for that surface
3. check whether an external domain owner also controls the meaning of the behavior
4. let the quality owner govern method/evidence and the external owner govern semantics
5. update this file if the same conflict reappears
