---
name: design-api
description: Use when defining or reviewing canonical backend API contract rules, including resource modeling, transport choice, request and response design, error taxonomy, compatibility policy, and consumer-facing API guarantees.
---

# Design API

This skill is the canonical owner for backend API design inside `spec_backend`. It defines how backend services expose stable contracts so consumers such as `spec_frontend`, partner clients, and external integrators can rely on API behavior without reverse-engineering framework habits or endpoint-by-endpoint improvisation.

## When to Use

- designing a new API surface, route family, schema, webhook, or mutation set
- reviewing whether an API change is breaking, additive, or behavior-changing
- defining request and response contracts, status codes, and error models
- choosing between REST, GraphQL, async job, or webhook patterns
- standardizing pagination, filtering, sorting, search, idempotency, and deprecation behavior
- aligning backend API truth with downstream consumers without letting consumers redefine the contract

## Ownership Boundaries

- `design-api` owns backend API contract design and compatibility policy.
- it owns how public or consumer-facing APIs are modeled, named, structured, versioned, and documented.
- it owns API-visible authentication and authorization contract semantics such as auth requirements, `401` vs `403` behavior, scope/tenant context expectations, and consumer-visible rate-limit signaling.
- it does **not** own frontend rendering or UI translation; `spec_frontend` consumes this contract.
- it does **not** own security/privacy policy such as secret handling, token lifecycle, or data-classification ownership.
- it does **not** own storage schema, ORM style, or service-internal code organization unless those details surface in the public contract.
- it does **not** own infrastructure alert routing or incident process design, though it does own consumer-visible operational signals like rate-limit and retry behavior.

## Core Pattern

### 1. Start with domain boundaries, not controller names

Design APIs around stable domain nouns and explicit lifecycle boundaries.

Prefer:

- `/users/{userId}/orders`
- `/payments/{paymentId}`
- `/reports/{reportId}/status`

Avoid action-first or implementation-leaking shapes such as:

- `/getUserOrders`
- `/createPaymentNow`
- `/runMonthlyJob`

If an action matters, express it through a resource transition or explicit command boundary rather than burying domain semantics in ad-hoc verb paths.

### 2. Choose interface style explicitly

Do not default to REST, GraphQL, or background jobs by habit. Pick the interface style that matches the problem.

| Situation | Prefer | Why |
|---|---|---|
| stable resource lifecycle, external integrations, cacheable reads | REST | strong resource semantics and predictable HTTP behavior |
| client-shaped aggregate reads across related entities | GraphQL | lets consumers request precise shapes without proliferating REST variants |
| long-running writes or heavy processing | async job pattern | avoids fake synchronous success for work that is not complete yet |
| outbound event delivery to third parties | webhook contract | makes event delivery explicit instead of overloading polling endpoints |

One product may use more than one style, but the boundary between them must be explicit.

### 3. Define contract rules before implementation details

Before implementation starts, define:

- primary resource name
- identifier format expectation
- field naming convention for the external contract
- required vs optional vs nullable fields
- time format expectation
- enum stability rules
- success envelope or body shape
- error envelope or body shape

Use one naming convention per API surface. Do **not** mix `snake_case`, `camelCase`, and one-off aliases inside the same public contract.

For JSON APIs, a consistent success envelope is easier to evolve than ad-hoc payloads.

Example success pattern:

```json
{
  "data": {
    "id": "pay_123",
    "status": "pending",
    "amount": 125000,
    "currency": "IDR",
    "createdAt": "2026-03-14T10:00:00Z"
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

If a surface does **not** use envelopes, that must also be explicit and consistent. The problem is inconsistency, not the mere existence of a wrapper.

### 4. Make error contracts machine-readable

Errors should be stable contracts, not improvised strings.

Define:

- HTTP status code
- stable error code
- human-readable message
- optional field-level details
- request or trace identifier if safe to expose
- retryability hint when relevant

Example error response:

```json
{
  "error": {
    "code": "invalid_payment_method",
    "message": "The selected payment method cannot be used for this transaction.",
    "details": {
      "field": "paymentMethodId"
    },
    "requestId": "req_abc123",
    "retryable": false
  }
}
```

Recommended baseline taxonomy:

| Situation | Status | Contract expectation |
|---|---|---|
| validation failure | `400` or `422` | stable field-aware error code and details |
| missing authentication | `401` | explicit auth challenge or reason |
| insufficient permission | `403` | no ambiguity with authentication failure |
| missing resource | `404` | do not overload as validation or authorization noise |
| conflict / invalid state transition | `409` | explain which business rule was violated |
| rate limit hit | `429` | include retry guidance |
| transient unavailability | `503` | include retry guidance if appropriate |
| unexpected failure | `500` | stable generic code, no sensitive leakage |

### 5. Collections need explicit rules

Collection endpoints or list fields must define:

- pagination model
- default ordering
- filter syntax
- search behavior
- max page size or window

Use cursor pagination by default for volatile or user-facing feeds. Page/offset is acceptable for stable administrative lists or small bounded datasets where the trade-off is explicit.

Document query behavior instead of letting every endpoint invent its own parameter names.

Example collection contract:

```http
GET /orders?status=paid&cursor=cur_456&limit=20&sort=-createdAt
```

### 6. Auth and authorization semantics must be visible in the contract

`design-api` does not own security policy, but it **does** own what API consumers can rely on when interacting with protected surfaces.

Define explicitly:

- which endpoints or fields require authentication
- how authentication failure differs from authorization failure
- whether tenant, scope, or actor context changes visible behavior
- whether rate limits apply globally, per actor, per token, or per tenant
- what the consumer can expect in the error contract when access is denied or throttled

Consumers should not have to guess whether a failed request means:

- credentials are missing or expired
- access is valid but insufficient for the requested action
- a tenant boundary or scope boundary was violated
- the caller is temporarily throttled and can retry later

Where helpful, expose contract-level metadata such as retry timing or scope-related error codes, but keep secret-handling and policy internals outside this skill.

### 7. Writes must define idempotency and completion semantics

For writes with financial, external, or retriable side effects, define idempotency behavior explicitly.

Use idempotency keys when clients may safely retry a request without duplicating the effect.

If work is not complete when the request returns, do not pretend it is synchronous. Prefer:

- `202 Accepted`
- job or operation resource identifier
- status endpoint or polling contract
- webhook/event callback when appropriate

Example async pattern:

1. `POST /exports` returns `202` with operation id
2. client polls `GET /exports/{exportId}` or receives webhook
3. final resource reports terminal state and artifact URL when ready

### 8. Async jobs and webhooks need delivery semantics

If an API surface involves polling, callbacks, or event delivery, define the delivery contract explicitly.

At minimum, document:

- whether delivery is at-most-once, at-least-once, or effectively retried until acknowledged
- whether ordering is guaranteed, best-effort, or irrelevant
- whether duplicate deliveries are possible and how consumers should handle them
- what acknowledgement or retry behavior the consumer must support
- how terminal success, failure, and timeout states are represented

Do not leave delivery semantics implicit in worker behavior or queue settings. If consumers are expected to be idempotent, say so in the contract.

### 9. Compatibility is a design rule, not a cleanup task

Default to backward compatibility.

Treat these as breaking unless explicitly versioned or coordinated:

- removing fields
- renaming fields
- changing type or format
- changing enum meaning
- changing pagination semantics
- changing status-code meaning
- turning optional into required
- changing nullability or default behavior in a consumer-visible way

Prefer additive evolution:

- add new optional fields
- add new endpoints or operations
- add new enum values only when consumers are expected to tolerate unknown values
- deprecate before removal

Version only when the compatibility boundary truly changes. Do not use versioning to excuse avoidable contract drift.

### 10. Classify changes before they ship

Every API change should be classified before implementation or release notes are written.

Use a simple gate:

| Change type | Typical examples | Required stance |
|---|---|---|
| additive | new optional field, new endpoint, new filter | normally safe, still document |
| behavior-changing but non-breaking | tighter validation, new rate-limit policy, different async timing | coordinate with consumers and document clearly |
| breaking | removed field, renamed field, changed type, changed status semantics | version, deprecate, or explicitly migrate consumers |

`design-api` owns this classification rule so consumer teams like `spec_frontend` know what they can absorb safely and what requires coordinated migration.

### 11. Deprecation must be operationally real

If an API contract is being retired or replaced, define:

- what is deprecated
- which consumers are affected
- migration target
- deprecation start date
- sunset or removal date
- validation or telemetry signals used to know whether migration is complete

Do not rely on tribal knowledge or release-note archaeology.

### 12. Consumer alignment is part of design quality

An API is not well designed if consumers must infer contract semantics from implementation quirks.

For every stable surface, publish:

- route or schema definition
- request example
- success example
- error examples
- pagination/filter/search rules where applicable
- idempotency/retry rules where applicable
- deprecation expectations if active

`spec_frontend` should consume this contract rather than restating backend truth. If frontend UX needs an error/loading translation layer, backend still owns the source error taxonomy and contract semantics.

## Practical Contract Review Checklist

Use these questions before approving an API surface:

1. What resource or domain boundary does this contract represent?
2. Why is this REST, GraphQL, async job, or webhook instead of another pattern?
3. Are naming and field conventions consistent with the rest of the API surface?
4. Are success and error contracts deterministic and machine-readable?
5. Are pagination/filter/sort/search semantics explicit?
6. Are idempotency and retry behaviors defined for retriable writes?
7. Are auth, authorization, and throttling semantics visible in the contract?
8. If this surface uses async jobs or webhooks, are delivery semantics explicit?
9. Is this change backward compatible? If not, what is the versioning/deprecation plan?
10. Can `spec_frontend` or another consumer implement against this without guessing hidden rules?

## Quick Reference

| Topic | Rule |
|---|---|
| Modeling | design around domain resources and explicit boundaries |
| Interface style | choose REST / GraphQL / async / webhook deliberately |
| Naming | one external naming convention per API surface |
| Errors | stable error codes and predictable status mapping |
| Collections | explicit pagination, filter, sort, and search rules |
| Auth semantics | make `401`, `403`, scope, tenant, and throttling behavior explicit |
| Writes | define idempotency and completion semantics |
| Delivery | define retries, duplicates, ordering, and terminal states for async/webhook flows |
| Compatibility | default to backward compatibility |
| Change review | classify additive vs behavior-changing vs breaking before release |
| Lifecycle | deprecate explicitly before removal |
| Consumers | publish examples and contract guarantees |

## Common Mistakes

- designing endpoints around controller names or database tables instead of domain boundaries
- mixing raw payloads, wrapped payloads, and inconsistent pagination shapes across related endpoints
- using free-form error messages as the only contract
- leaving `401`, `403`, scope, and throttling behavior implicit
- hiding long-running work behind fake synchronous success responses
- leaving webhook or async delivery semantics undefined and expecting consumers to infer retries or ordering
- making breaking changes without a compatibility or deprecation policy
- shipping behavior-changing contract changes without classifying them for consumers first
- letting frontend or partner teams become the de facto source of truth for API behavior
- overloading security, infrastructure, and UI concerns into the API design owner instead of keeping boundaries explicit

## Delivery Checklist

- resource and boundary model defined
- transport style chosen deliberately
- request and response contract documented
- error taxonomy and status mapping documented
- auth, authorization, and throttling semantics documented where relevant
- pagination/filter/sort/search rules documented where relevant
- idempotency and async behavior documented where relevant
- delivery semantics documented for webhook or job-based flows
- compatibility and deprecation policy documented
- change classification recorded for consumer-facing modifications
- consumer-facing examples published
- downstream consumers can implement against the contract without guessing hidden rules
