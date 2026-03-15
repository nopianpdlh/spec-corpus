# Backend Spec Index

`spec_backend` is the reusable backend baseline for defining stable service behavior across projects. It is organized around **explicit domain ownership** so API contract truth, auth implementation, storage design, testing, and documentation do not silently redefine each other.

Use this file as the entry point for the backend corpus after routing from the root docs.

## How to Read This Repo

There are three layers:

1. **Core baseline owners** — canonical owners for backend-owned domains.
2. **Supporting publication/reference skills** — useful, but not allowed to override domain owners outside their scope.
3. **Planning and governance docs** — documents that explain how to adopt and extend the baseline safely.

If two documents appear to overlap, use `DOMAIN-OWNERSHIP.md` to resolve precedence.

## Core Baseline Owners

| Domain | Owner | Use for |
|---|---|---|
| API contract design | `.agents/skills/design-api/SKILL.md` | resource modeling, transport choice, request/response contracts, error taxonomy, compatibility, consumer-visible semantics |
| Authentication and authorization implementation | `.agents/skills/authentication-setup/SKILL.md` | identity flows, credential/session/token handling, enforcement patterns, revocation/rotation rules |
| Database and storage design | `.agents/skills/database-schema-design/SKILL.md` | schema modeling, relationships, indexing, migration safety, storage/API boundary decisions |
| Backend testing and verification | `.agents/skills/backend-testing/SKILL.md` | unit/service/integration/API/contract testing strategy and release verification |
| API publication and reference docs | `.agents/skills/api-documentation/SKILL.md` | OpenAPI publication, examples, changelog/reference discipline, consumer-facing documentation packaging |

## Owner Relationship Summary

- `design-api` owns the **consumer-facing backend contract**.
- `authentication-setup` may define how auth is implemented, but it does not redefine API contract semantics already owned by `design-api`.
- `database-schema-design` owns internal storage truth, not the external resource shape consumed by clients.
- `backend-testing` owns how backend behavior is verified, including contract verification against the canonical API design.
- `api-documentation` owns how the contract is published and packaged for readers and tooling, not what the contract means.

## Recommended Reading Order

### If you are adopting `spec_backend` on a new service

1. `DOMAIN-OWNERSHIP.md`
2. `NEW-PROJECT-CHECKLIST.md`
3. `.agents/skills/design-api/SKILL.md`
4. the additional owner skills that match the service scope
5. `.agents/skills/api-documentation/SKILL.md` when the contract needs to be published for consumers

### If you are designing a new backend surface

1. `design-api`
2. `authentication-setup` if protected access or identity flows exist
3. `database-schema-design` if storage or migration decisions are required
4. `backend-testing`
5. `api-documentation`

### If you are resolving overlap or conflict

1. `DOMAIN-OWNERSHIP.md`
2. the owner for the disputed domain
3. any supporting skill that also touches the topic
4. external domain specs when the topic is owned outside backend

## Repository Planning Docs

The current backend baseline evolution is documented in:

- `docs/plans/2026-03-14-spec-backend-design-api-design.md`
- `docs/plans/2026-03-14-spec-backend-design-api-plan.md`

## What This Repo Does Not Own

`spec_backend` does **not** replace:

- frontend rendering, UI state, or client-side adaptation logic
- security/privacy policy ownership beyond backend implementation and contract translation
- platform/infrastructure incident policy or deployment governance
- product strategy or acceptance-criteria ownership
- organization-wide QA policy outside backend-facing verification requirements

Use `DOMAIN-OWNERSHIP.md` to connect these external domains safely.
