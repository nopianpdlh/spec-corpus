---
name: frontend-external-spec-integration
description: Use when a frontend project must consume backend, security, QA, product, or platform specifications without duplicating ownership inside the frontend spec repository.
---

# Frontend External Spec Integration

This skill is the baseline owner for how `spec_frontend` integrates with other specification repositories and domain authorities. It prevents the frontend baseline from drifting into backend, security, or QA ownership while still making cross-spec dependencies explicit.

## When to Use

- starting a project that uses multiple spec repositories
- deciding whether a rule belongs in `spec_frontend` or an external domain spec
- documenting how frontend teams consume backend contracts or security requirements
- resolving overlap between frontend guidance and external specs
- defining cross-repo handoff expectations for delivery readiness

## Ownership Boundaries

- `frontend-external-spec-integration` owns the integration rules and handoff model.
- it does **not** replace backend, security, QA/testing, product, or platform specs.
- `DOMAIN-OWNERSHIP.md` should summarize the final owner matrix; this skill defines the operational pattern for working across those boundaries.

## Core Pattern

### 1. Keep frontend ownership explicit

Frontend owns:

- UI behavior and interaction patterns
- layout, responsiveness, accessibility, and component architecture
- client-side state boundaries
- frontend analytics, SEO implementation, browser/device policy, and client observability
- how the frontend consumes external requirements

Frontend does **not** automatically own:

- backend API truth
- authentication/session security policy
- data retention and privacy policy
- non-frontend QA governance
- infrastructure and incident response policy

### 2. Integrate external specs through dependencies, not duplication

For every external dependency, record:

- owning repo or document
- what the frontend must consume from it
- where conflicts are escalated
- what must be validated before release

Example dependency table:

| External domain | Owned elsewhere | Frontend responsibility |
|---|---|---|
| API contracts | `spec_backend` | align request/response assumptions, error states, loading states |
| Security/privacy | `spec_security` | apply frontend-safe session, consent, secret-handling, and UI exposure rules |
| QA/testing | `spec_qa` or equivalent | validate frontend critical flows against required test gates |
| Product requirements | PRD/domain spec | implement user-facing behavior and acceptance criteria |

### 3. Resolve overlap with precedence rules

When documents overlap:

1. the domain owner wins on domain-specific rules
2. `spec_frontend` wins on frontend implementation patterns inside its owned scope
3. conflicts must be documented and surfaced, never silently patched by improvisation

### 4. Convert external constraints into frontend-visible behavior

Do not merely link external docs. Translate them into frontend consequences:

- API errors → loading/error/empty behavior
- security constraints → session UI, token handling boundaries, upload/download restrictions
- QA requirements → release check coverage for supported browsers/devices and critical flows
- product requirements → frontend states, content structure, analytics hooks, SEO rules where relevant

## Integration Workflow

### Step 1: Identify external dependencies early

For a new project, list every external spec repo or domain authority the frontend depends on.

### Step 2: Define consumed contracts

For each dependency, note what the frontend actually needs, such as:

- API shapes and error taxonomy
- auth/session constraints
- privacy/consent rules
- release gates
- content or taxonomy requirements

### Step 3: Define the frontend translation layer

For each external dependency, define what changes in the UI, component behavior, route behavior, state, analytics, SEO, or observability.

### Step 4: Document conflict escalation

If local frontend guidance and external domain guidance conflict:

- do not silently pick whichever is easier
- record the conflict
- defer to the domain owner for domain policy questions
- update local governance docs if the recurring boundary needs clearer precedence

### Step 5: Use governance docs as the stable map

Once created, keep `FRONTEND-SPEC-INDEX.md`, `DOMAIN-OWNERSHIP.md`, and `NEW-PROJECT-CHECKLIST.md` aligned with the cross-spec integration model.

## Quick Reference

| Topic | Rule |
|---|---|
| Ownership | Do not duplicate external domain rules |
| Consumption | Translate external constraints into frontend behavior |
| Conflicts | Surface and escalate; do not silently improvise |
| Frontend scope | Own UI implementation, not every dependency domain |
| Governance | Keep ownership matrix and checklist aligned |

## Common Mistakes

- copying backend/security/testing rules into frontend docs verbatim
- leaving external dependencies implicit until implementation is already drifting
- failing to convert external requirements into frontend states and behaviors
- resolving cross-spec conflicts ad hoc in code or prompts without documenting precedence
- treating links to external repos as sufficient integration guidance

## Delivery Checklist

- external spec dependencies listed for the project
- consumed contracts and constraints identified
- frontend translation consequences documented
- conflict escalation path defined
- governance docs updated to reflect recurring ownership boundaries
