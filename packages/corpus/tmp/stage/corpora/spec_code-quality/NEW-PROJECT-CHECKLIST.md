# New Project Checklist

Use this checklist when adopting `spec_code-quality` for a new project.

The goal is to define how quality work will be evaluated and improved without turning implementation drift into the default standard.

## 1. Confirm Baseline Adoption

- [ ] project will use `spec_code-quality` as the quality baseline
- [ ] team has read `CODE-QUALITY-SPEC-INDEX.md`
- [ ] team has read `DOMAIN-OWNERSHIP.md`
- [ ] canonical quality owners selected for the project:
  - [ ] `code-review`
  - [ ] `code-refactoring`
  - [ ] `testing-strategies`
  - [ ] `performance-optimization` where performance matters
- [ ] `systematic-debugging` recognized as a process companion for ambiguous failures

## 2. Lock the Review Model

- [ ] review severity model is defined (blocker / major / minor / note)
- [ ] required evidence for risky changes is defined
- [ ] escalation path to frontend/backend/platform/security owners is explicit
- [ ] “review does not invent requirements” rule is acknowledged

## 3. Lock the Refactoring Rules

- [ ] behavior-preserving default is explicit
- [ ] acceptable structural cleanup scope is defined
- [ ] migration / rollback expectations are defined for risky refactors
- [ ] test protection required before broad refactors is defined

## 4. Lock the Verification Strategy

- [ ] test layers used by the project are identified
- [ ] deterministic setup / fixture / isolation rules are defined
- [ ] failure-path coverage expectations are defined
- [ ] contract verification expectations are defined where external consumers exist
- [ ] release evidence expectations are defined

## 5. Lock the Performance Model

- [ ] performance-sensitive paths are identified
- [ ] budgets or target metrics are named where relevant
- [ ] profiling / measurement approach is defined
- [ ] acceptable optimization tradeoffs are documented with domain-owner signoff rules

## 6. Define External Owners

- [ ] frontend/backend/domain owner repos are identified
- [ ] security/privacy owner is identified
- [ ] infrastructure/platform owner is identified when runtime behavior matters
- [ ] product / PRD owner is identified

For each external dependency, record:

- owning repo/doc
- what quality decisions depend on it
- who resolves conflicts
- which evidence must be collected before changes ship

## Minimal Adoption Rule

If the project cannot explain:

- who decides review severity,
- who decides refactoring boundaries,
- who decides verification sufficiency,
- who decides performance tradeoffs,
- and which external repo owns product/API/platform/security semantics,

then `spec_code-quality` has not actually been adopted yet.
