# New Project Checklist

Use this checklist when adopting `spec_backend` for a new production backend service.

The goal is not to load every backend skill blindly. The goal is to select the correct owners, make external dependencies explicit, define contract/storage/auth/testing expectations early, and prevent implementation from becoming the de facto spec.

## 1. Confirm Baseline Adoption

- [ ] project will use `spec_backend` as the backend baseline
- [ ] team has read `BACKEND-SPEC-INDEX.md`
- [ ] team has read `DOMAIN-OWNERSHIP.md`
- [ ] canonical owner set has been acknowledged:
  - [ ] `design-api`
  - [ ] `authentication-setup` if auth or service identity exists
  - [ ] `database-schema-design` if durable storage exists
  - [ ] `backend-testing`
  - [ ] `api-documentation` if the service publishes a consumer-visible contract

## 2. Lock the Contract-First Decisions

- [ ] primary API style chosen deliberately (REST, GraphQL, async job, webhook, mixed)
- [ ] public resource boundaries defined before controller/framework implementation
- [ ] naming convention for the external contract defined
- [ ] success and error envelope policy defined
- [ ] compatibility / versioning / deprecation stance defined
- [ ] consumer-visible auth semantics defined (`401`, `403`, throttling, tenant/scope behavior)

## 3. Lock the Authentication and Authorization Model

- [ ] human-user auth approach defined (session, JWT, OAuth/OIDC, mixed) where relevant
- [ ] service-to-service auth approach defined where relevant
- [ ] token/session lifetime and revocation strategy defined
- [ ] secret rotation/storage approach identified
- [ ] authorization boundary identified (role, scope, tenant, attribute-based, mixed)
- [ ] auth implementation guidance reviewed in `authentication-setup`

## 4. Lock the Storage Model

- [ ] primary datastore(s) identified
- [ ] core entities and relationships identified
- [ ] internal naming convention chosen for storage model
- [ ] mapping from storage model to public API model made explicit
- [ ] indexing strategy reviewed for critical paths
- [ ] migration safety rules agreed before first production schema change

## 5. Define Verification Expectations

- [ ] unit/service/integration/API test scope defined
- [ ] contract testing strategy defined for consumer-visible surfaces
- [ ] failure-path coverage expectations documented
- [ ] external dependencies that must be mocked or isolated identified
- [ ] release verification evidence path defined

## 6. Define Publication Expectations

- [ ] OpenAPI or equivalent publication format chosen for published surfaces
- [ ] canonical examples use the real contract shape from `design-api`
- [ ] authentication, error, pagination, and rate-limit behavior are documented where relevant
- [ ] changelog/deprecation communication path defined

## 7. Define External Spec Dependencies

- [ ] frontend consumer spec identified if UI clients depend on this service
- [ ] security/privacy policy source identified
- [ ] product / PRD / acceptance criteria source identified
- [ ] platform / infrastructure source identified if needed
- [ ] QA / release-governance source identified if needed

For each external dependency, record:

- owning repo/doc
- what the backend consumes from it
- who resolves conflicts
- which backend-visible behavior changes because of it

## 8. Pre-Implementation Readiness Check

Before implementation begins, confirm:

- [ ] no major backend domain is ownerless
- [ ] contract semantics are not being invented inside auth, database, or docs workstreams
- [ ] storage schema is not being treated as the public API
- [ ] publication docs reflect the contract instead of redefining it
- [ ] release verification path is explicit rather than assumed

## Minimal Adoption Rule

If a project cannot explain:

- which doc owns contract design,
- which doc owns auth implementation,
- which doc owns storage decisions,
- which doc owns backend verification,
- and which external repos own frontend/security/platform/product policy,

then the backend baseline has not actually been adopted yet.
