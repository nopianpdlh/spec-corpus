# Domain Ownership and Precedence

This file defines which document owns which backend domain and what to do when documents overlap.

## Precedence Rules

When two documents appear to cover the same topic, resolve them in this order:

1. **The canonical owner wins inside its domain.**
2. **Adjacent owners may inform each other, but they do not silently override another owner's scope.**
3. **Publication/reference docs translate and package contract truth; they do not replace it.**
4. **External spec repositories win on their own policy domains** (frontend, security/privacy, platform, product, QA), while `spec_backend` owns the backend translation of those requirements.
5. **If a conflict keeps recurring, update this file and the relevant owner skill.** Do not rely on tribal interpretation.

## Backend-Owned Domains

| Domain | Canonical owner | Includes | Explicitly does not own |
|---|---|---|---|
| API contract design | `.agents/skills/design-api/SKILL.md` | resource modeling, transport choice, request/response shape, field naming for public contracts, status/error semantics, pagination, idempotency, compatibility, consumer-visible auth semantics | storage schema, secret policy, frontend UI translation, platform incident policy |
| Authentication and authorization implementation | `.agents/skills/authentication-setup/SKILL.md` | identity flows, credential verification, password/token/session handling, refresh/revocation strategy, service-to-service auth implementation, authorization enforcement patterns | public API contract design, documentation ownership, frontend token persistence UX |
| Database and storage design | `.agents/skills/database-schema-design/SKILL.md` | entity modeling, storage relationships, indexing, constraints, migrations, retention-friendly schema decisions, mapping internal models to API resources | public contract shape, consumer-visible naming, auth/session policy |
| Backend testing and verification | `.agents/skills/backend-testing/SKILL.md` | unit/service/integration/API/contract testing strategy, failure-path coverage, test isolation, backend verification gates | owning the API contract itself, product-wide QA governance, frontend test behavior |
| API publication and reference docs | `.agents/skills/api-documentation/SKILL.md` | OpenAPI publishing, example curation, changelog/reference structure, developer-facing documentation packaging | changing API semantics, redefining auth behavior, inventing payload shapes outside `design-api` |

## Practical Boundary Rules

- If the question is **what clients can rely on**, `design-api` owns it.
- If the question is **how credentials, sessions, or tokens are implemented and enforced**, `authentication-setup` owns it.
- If the question is **how data is stored and migrated internally**, `database-schema-design` owns it.
- If the question is **how backend behavior is validated before release**, `backend-testing` owns it.
- If the question is **how the contract is published for humans and tooling**, `api-documentation` owns it.

## Cross-Owner Examples

- **A JWT middleware example returns `403` for an invalid token** → `design-api` owns the client-visible status semantics; `authentication-setup` must align its examples to that contract.
- **A table uses `snake_case`, but public JSON uses `camelCase`** → `database-schema-design` owns the internal schema and `design-api` owns the external contract; mapping is expected, not a contradiction.
- **An OpenAPI example omits the canonical error envelope** → `api-documentation` owns publication quality, but the payload shape still comes from `design-api`.
- **A contract test fails because the implementation drifted from the published spec** → `backend-testing` owns the verification workflow; `design-api` still owns the target contract.

## External Domain Ownership

`spec_backend` must integrate with external owners rather than duplicating them.

| External domain | Owned outside `spec_backend` | Backend responsibility |
|---|---|---|
| Frontend consumption and UI behavior | e.g. `spec_frontend` | expose stable contracts and backend semantics that frontend can consume safely |
| Security and privacy policy | e.g. `spec_security` | implement backend-safe handling and translate policy into backend behavior without claiming policy ownership |
| Platform / infrastructure | platform spec | align runtime assumptions, deployment interfaces, observability handoff, and operational constraints |
| Product requirements | PRD/domain spec | implement backend behavior that satisfies the product contract |
| QA / release governance | e.g. `spec_qa` | satisfy backend-facing verification and release evidence requirements |

## Conflict Resolution Workflow

When overlap appears:

1. identify the domain being disputed
2. locate its owner in the table above
3. check whether the conflicting document is another owner, a publication/reference doc, or an external owner
4. apply the owner's rule inside its scope
5. if the boundary is still unclear, update this file and the relevant owner skill so the ambiguity does not repeat
