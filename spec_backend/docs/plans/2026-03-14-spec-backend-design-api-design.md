# spec_backend design-api and governance normalization Design

**Goal:** Establish `design-api` as the canonical backend API owner and normalize the surrounding backend corpus so the repository reads as a coherent reusable baseline rather than an empty bootstrap plus imported templates.

## Problem Statement

`spec_backend` no longer contains only a single bootstrap skill. It now contains `design-api` plus additional backend skills for authentication, database design, testing, and API documentation. The repository therefore needs a thin governance layer and clearer ownership boundaries so these files complement each other instead of competing for authority.

The design goal is still intentionally narrow:

- keep `design-api` as the source of truth for consumer-facing API contracts
- add the same thin governance shell that already makes `spec_frontend` navigable
- normalize the adjacent backend skills so they support the corpus instead of reading like disconnected templates

## Design Principles

1. **Canonical owner first.** `design-api` remains the owner of backend API contract truth.
2. **Thin governance beats sprawling rewrites.** Add only the repo-level structure needed to remove ambiguity now.
3. **Adjacent domains need explicit boundaries.** Auth, storage, testing, and documentation each need their own scope without redefining contract policy.
4. **Internal and external models must stay separate.** Database shape and API shape may inform each other, but neither should be mistaken for the other.
5. **Structural verification is the correct evidence model.** This repository is a documentation/skill corpus, not an executable service.

## Current Corpus Shape

At the time of this normalization pass, `spec_backend` contains:

- `.agents/skills/design-api/SKILL.md`
- `.agents/skills/authentication-setup/SKILL.md`
- `.agents/skills/database-schema-design/SKILL.md`
- `.agents/skills/backend-testing/SKILL.md`
- `.agents/skills/api-documentation/SKILL.md`
- `skills-lock.json`
- the original bootstrap design/plan docs under `docs/plans/`

That means the repository has already moved past an empty bootstrap and now needs governance to match reality.

## Ownership Model

### Canonical owners in the current baseline

- `design-api` → backend API contract truth
- `authentication-setup` → auth/authz implementation guidance
- `database-schema-design` → internal storage design and migration safety
- `backend-testing` → backend verification strategy
- `api-documentation` → contract publication and reference discipline

### Critical precedence rule

`design-api` wins whenever a question is about what API consumers can rely on. The other owners may reference contract behavior, but they do not redefine payload semantics, compatibility policy, or visible auth semantics.

## Governance Layer to Add

This pass adds three root docs:

1. `BACKEND-SPEC-INDEX.md` — the repo front door
2. `DOMAIN-OWNERSHIP.md` — canonical ownership and precedence rules
3. `NEW-PROJECT-CHECKLIST.md` — adoption checklist for new services

This mirrors the governance shape used successfully in `spec_frontend`, but keeps backend-specific ownership boundaries.

## Skill Normalization Goals

The non-`design-api` backend skills should be tightened so they:

- explicitly state what they own and what they do not own
- align examples with the canonical contract patterns already defined in `design-api`
- remove stale template residue such as placeholders and broken local links
- stop implying that framework examples are the source of truth

## Relationship to External Specs

`spec_backend` still does not replace frontend, security/privacy, platform, product, or organization-wide QA ownership.

Instead:

- backend owns API truth and backend-side implementation guidance
- frontend owns client consumption and UI translation of backend behavior
- security/privacy owns policy while backend implements and translates it
- platform owns deployment/incident policy while backend aligns runtime-facing behavior

## Non-Goals for This Pass

This normalization pass does **not**:

- add new backend domains such as observability, queues, or file storage
- rewrite `design-api` from scratch
- introduce code/build/test infrastructure

Those remain valid future work after the current corpus becomes internally coherent.

## Expected Repository State After This Work

After this pass, `spec_backend` should be able to claim:

- it has a navigable root index
- it has explicit ownership and precedence rules
- its current backend skills no longer compete ambiguously for contract authority
- its examples and references align more closely with the canonical `design-api` contract model

## Verification Strategy

Verification for this repository is structural:

1. confirm the three root governance docs exist
2. re-read the updated planning docs to ensure they no longer describe an empty bootstrap
3. re-read the normalized backend skills to confirm explicit ownership boundaries
4. grep for placeholders, stale bootstrap language, and broken local references
5. report structural verification as the evidence model unless executable tooling is added later
