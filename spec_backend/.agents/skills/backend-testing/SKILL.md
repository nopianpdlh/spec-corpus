---
name: backend-testing
description: Use when defining or reviewing backend verification strategy, including unit, service, integration, API, and contract testing for backend behavior and release safety.
metadata:
  tags: testing, backend, contract-testing, integration-test, API-test, regression
  platforms: Claude, ChatGPT, Gemini
---

# Backend Testing

This skill owns how backend behavior is verified before changes ship. It focuses on backend testing strategy and evidence, including contract verification against the API truth defined by `design-api`.

## When to Use

- adding tests for a new backend capability
- deciding which test layers are required for a backend change
- verifying API behavior, auth behavior, data-access logic, or migration safety
- adding regression coverage after a bug fix
- reviewing whether release evidence is strong enough for a backend change

## Ownership Boundaries

- `backend-testing` owns backend verification strategy.
- it owns test-layer choices, isolation rules, contract verification, error-path coverage, and release evidence expectations.
- it owns how backend implementations are checked against the intended behavior.
- it does **not** own the API contract itself; `design-api` does.
- it does **not** own frontend/UI testing policy.
- it does **not** replace organization-wide QA governance outside backend-facing verification.

## Testing Model

Use the lightest layer that can prove the behavior, but do not skip layers that protect high-risk backend changes.

| Layer | Use for | Should prove |
|---|---|---|
| Unit test | pure logic or isolated business rules | deterministic behavior without infrastructure |
| Service test | domain logic with mocked collaborators | orchestration and business invariants |
| Integration test | real storage/framework boundaries | component interaction and persistence behavior |
| API test | HTTP/schema-visible behavior | route semantics, status codes, request/response envelopes |
| Contract test | published consumer contract | implementation still matches `design-api` and published docs |

## Core Rules

### 1. Test the contract, not just the implementation path

If a change affects a consumer-facing API, tests should verify:

- expected status code
- success and error envelope shape
- required fields and field naming
- auth/permission behavior when relevant
- pagination/filter/search semantics when relevant

Example assertion shape:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "The supplied credentials are invalid.",
    "requestId": "req_abc123",
    "retryable": false
  }
}
```

### 2. Failure paths are part of the release surface

Do not stop at happy-path coverage. Backend tests should cover the failure and denial paths that consumers and operators will actually hit.

### 3. Keep tests isolated

- tests must not depend on execution order
- external dependencies should be mocked, stubbed, or isolated unless the test intentionally verifies the integration
- production databases and live third-party APIs are out of scope for repeatable test suites

### 4. Contract tests are the bridge to consumers

When a backend surface is consumed by `spec_frontend` or other clients, add tests that prove the implementation still matches the intended published contract.

### 5. Prefer deterministic setup over timing guesses

Use controlled fixtures, explicit setup/teardown, and deterministic clocks where needed. Do not rely on arbitrary sleeps to make backend tests pass.

## Practical Coverage Checklist

For a typical API change, ask whether tests cover:

- the successful path
- validation failures
- authentication failures
- authorization failures
- missing-resource / invalid-state behavior
- persistence side effects where relevant
- backward-compatible contract shape where relevant

## Release Evidence Checklist

Before claiming a backend change is verified, gather evidence for the layers that apply:

1. unit/service tests for business logic changes
2. integration tests for storage or framework boundaries
3. API or contract tests for consumer-visible behavior
4. migration verification when schema changes are involved
5. documentation/example updates when contract behavior changed

## Quick Reference

| Topic | Rule |
|---|---|
| Contract verification | backend behavior must match `design-api` |
| Error paths | test them explicitly |
| Isolation | no shared state or live dependency reliance |
| External services | mock or isolate unless the integration is the subject |
| Frontend/UI tests | out of scope for this owner |
| Release claims | must be backed by actual verification evidence |

## Common Mistakes

- verifying only `200`/`201` paths and skipping denial or failure cases
- testing internal implementation details while missing the API contract surface
- treating a backend route as verified without checking the real response envelope
- relying on sleeps or flaky timing instead of deterministic coordination
- letting test fixtures drift away from the published contract
- importing frontend/UI testing concerns into backend verification guidance

## Delivery Checklist

- required test layers chosen deliberately
- failure-path coverage included where relevant
- contract verification included for consumer-visible changes
- tests isolated from production state and live third-party systems
- release evidence recorded from actual verification steps
