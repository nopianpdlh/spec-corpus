# New Project Checklist

Use this checklist when adopting `spec_documentation` for a new project.

The goal is to make documentation ownership explicit so docs explain the system clearly instead of becoming an accidental source of conflicting truth.

## 1. Confirm Baseline Adoption

- [ ] project will use `spec_documentation` as the documentation baseline
- [ ] team has read `DOCS-SPEC-INDEX.md`
- [ ] team has read `DOMAIN-OWNERSHIP.md`
- [ ] owner set is acknowledged:
  - [ ] `technical-writing`
  - [ ] `changelog-maintenance` if the project ships versioned/user-visible changes
  - [ ] `presentation-builder` only when presentation artifacts are needed
  - [ ] `using-git-worktrees` only as workflow support

## 2. Lock the Documentation Model

- [ ] primary doc audiences are named
- [ ] required doc types are identified (spec, runbook, onboarding, API guide, operator guide, etc.)
- [ ] source-of-truth repos/docs for system semantics are recorded
- [ ] terminology and naming source is identified
- [ ] doc review and freshness expectations are defined

## 3. Lock the Release Communication Model

- [ ] changelog / release-note cadence is defined
- [ ] change classification approach is defined
- [ ] deprecation and migration communication path is defined
- [ ] audience-specific release communication needs are documented

## 4. Define Supporting Output Paths

- [ ] presentation artifacts are needed or explicitly out of scope
- [ ] contributor workflow guidance (such as worktrees) is needed or explicitly out of scope
- [ ] process utilities are marked as non-owning in local adoption docs if they are used

## 5. Define External Owners

- [ ] product / PRD owner is identified
- [ ] frontend/backend/platform/security owner repos are identified where relevant
- [ ] release approval owner is identified

For each external dependency, record:

- owning repo/doc
- what must be documented from it
- who resolves conflicts
- how drift will be detected

## Minimal Adoption Rule

If the project cannot explain:

- who owns documentation quality,
- who owns release/change communication,
- which docs own the underlying system truth,
- and which supporting workflows are non-owning,

then `spec_documentation` has not actually been adopted yet.
