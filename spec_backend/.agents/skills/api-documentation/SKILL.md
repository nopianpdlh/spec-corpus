---
name: api-documentation
description: Use when publishing or reviewing developer-facing API references, OpenAPI descriptions, examples, and changelog notes so they accurately reflect the backend contract owned by design-api.
metadata:
  tags: api-documentation, OpenAPI, Swagger, Redoc, developer-docs, changelog
  platforms: Claude, ChatGPT, Gemini
---

# API Documentation

This skill owns how backend API contracts are **published for humans and tooling**. It is not the source of truth for API semantics; `design-api` owns the contract itself.

## When to Use

- publishing or updating OpenAPI / Swagger / Redoc descriptions
- adding developer-facing examples, guides, or changelog notes
- reviewing whether reference docs still match the actual contract
- packaging auth, pagination, error, and deprecation guidance for consumers

## Ownership Boundaries

- `api-documentation` owns the **publication layer** for backend APIs.
- it owns OpenAPI structure, example quality, reference-guide organization, and changelog discipline.
- it owns how examples are packaged so consumers can implement without reverse-engineering code.
- it does **not** own route semantics, payload shape, status-code meaning, compatibility rules, or auth-visible contract behavior; `design-api` owns those.
- it does **not** own frontend consumption, SDK strategy, or product copy outside backend-reference needs.

## Core Publishing Rule

Documentation must **reflect** the contract, not invent it.

That means every published surface should derive from the canonical backend contract and preserve:

- the same resource names
- the same request and response shapes
- the same field naming convention for the public surface
- the same error envelope and status-code semantics
- the same pagination, filtering, retry, idempotency, and deprecation rules

## What Every Published Surface Must Include

For every stable consumer-facing route or operation, publish:

1. route and method or schema entry
2. request example
3. success example
4. failure examples for the important paths
5. auth requirements when relevant
6. pagination/filter/search rules when relevant
7. rate-limit, retry, idempotency, or async-completion notes when relevant
8. deprecation/sunset notes when active

## OpenAPI / Reference Policy

### 1. Prefer one canonical published source

Do not maintain multiple conflicting descriptions of the same contract. If OpenAPI is the canonical published artifact, keep prose guides consistent with it.

### 2. Examples must use the real contract shape

When the contract uses envelopes, the docs must use the same envelopes.

Example success response:

```json
{
  "data": {
    "id": "usr_123",
    "email": "user@example.com",
    "role": "member",
    "createdAt": "2026-03-15T10:00:00Z"
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

Example error response:

```json
{
  "error": {
    "code": "authentication_required",
    "message": "Authentication is required for this operation.",
    "requestId": "req_abc123",
    "retryable": false
  }
}
```

### 3. Auth docs must respect contract semantics

If the contract distinguishes `401` and `403`, the published docs must do the same:

- `401` → missing, invalid, or expired credentials
- `403` → authenticated caller lacks permission for the action

### 4. Async and idempotent flows need more than a path listing

If the operation is asynchronous or retriable, publish:

- idempotency-key rules if used
- whether the first response is `202`
- how the client checks status
- terminal-state examples

### 5. Deprecation must be visible in docs

If a contract is deprecated, the reference docs must state:

- what is deprecated
- what replaces it
- when the deprecation started
- when removal is planned

## Reference Structure Pattern

Use a structure that keeps discovery simple:

```text
docs/
├── README.md
├── authentication.md
├── api-reference/
│   ├── users.md
│   ├── auth.md
│   └── orders.md
├── guides/
│   ├── pagination.md
│   ├── errors.md
│   ├── idempotency.md
│   └── webhooks.md
├── changelog.md
└── openapi.yaml
```

The exact folder shape can change by project, but the contract coverage cannot.

## Practical Publishing Checklist

Use these questions before publishing or approving backend docs:

1. Does every example match the current `design-api` contract shape?
2. Are important failure cases documented, not just success paths?
3. Are auth expectations explicit?
4. Are pagination, filters, retry rules, or async completion rules documented where relevant?
5. Is any deprecated surface clearly marked with migration guidance?
6. Would a frontend or partner team still need to guess hidden backend behavior after reading this?

## Quick Reference

| Topic | Rule |
|---|---|
| Contract source | comes from `design-api`, not from docs formatting choices |
| Examples | must use the real success/error shape |
| Auth docs | must preserve `401` vs `403` semantics |
| Async flows | must include status/completion guidance |
| Changelog | required for behavior-changing and breaking contract changes |
| Publication quality | no placeholders, no fake examples, no ad-hoc drift |

## Common Mistakes

- treating OpenAPI examples as a place to redesign the contract
- documenting only success responses and hiding failure paths
- publishing a simple `{ "error": "..." }` example when the canonical contract uses structured errors
- collapsing `401` and `403` into the same explanation
- forgetting to document pagination, idempotency, or async semantics
- leaving placeholder or demo-only content in a supposedly reusable baseline

## Delivery Checklist

- published artifact exists for the relevant API surface
- examples match the canonical contract
- auth and error behaviors are documented where relevant
- pagination/filter/retry/deprecation rules are documented where relevant
- placeholders and broken references removed
- consumer teams can implement against the published docs without guessing
