---
name: authentication-setup
description: Use when designing or reviewing backend authentication and authorization implementation, including credential flows, token/session handling, revocation, secret management, service identity, and authorization enforcement.
metadata:
  tags: authentication, authorization, security, JWT, session, OAuth, RBAC
  platforms: Claude, ChatGPT, Gemini
---

# Authentication Setup

This skill owns backend-side authentication and authorization implementation guidance. It explains how to implement credential, session, token, and permission flows without stealing ownership of the public API contract from `design-api`.

## When to Use

- adding user authentication to a backend service
- choosing between session, JWT, OAuth/OIDC, API key, or service-identity patterns
- defining token/session lifetime, rotation, revocation, or refresh behavior
- implementing authorization boundaries such as roles, scopes, or tenant checks
- reviewing secret handling and auth enforcement patterns before release

## Ownership Boundaries

- `authentication-setup` owns **how auth is implemented and enforced on the backend**.
- it owns credential verification, password hashing, token/session storage strategy, revocation, secret handling discipline, and authorization checks.
- it may define implementation patterns for user auth and service-to-service auth.
- it does **not** own the consumer-facing API contract. `design-api` owns visible auth semantics such as payload shape, `401` vs `403`, and how protected endpoints behave from the client's perspective.
- it does **not** own organization-level security/privacy policy. External security specs still win on policy.
- it does **not** own frontend persistence behavior such as browser token storage decisions.

## Core Decision Model

Choose auth patterns deliberately:

| Situation | Prefer | Why |
|---|---|---|
| browser-backed app with strong server control | session/cookie model | reduces token handling complexity on clients |
| API consumed by multiple first/third-party clients | short-lived access token + refresh/session strategy | clear API boundary and revocation path |
| third-party delegated identity | OAuth/OIDC | standard identity delegation |
| internal service calls | mTLS, workload identity, or signed service token | avoid reusing end-user auth for machine trust |

One service may use more than one mechanism, but each trust boundary must be explicit.

## Implementation Rules

### 1. Credentials and secrets

- never store passwords in plaintext
- use a proven password hasher such as Argon2id or bcrypt
- keep secrets and signing keys out of source control
- define key rotation and token invalidation behavior before production

### 2. Token/session payloads must stay minimal

Include only what the backend and consumers truly need for authorization or correlation.

Default payload fields should be narrow, such as:

- `sub` / user or actor id
- role or scope claims when required
- tenant or organization context when required

Do not include extra profile data like email by default unless there is a clear contract reason.

### 3. Visible auth semantics must match the API contract

Align backend examples to `design-api`:

- `401` → credentials are missing, invalid, expired, or cannot satisfy the request
- `403` → caller is authenticated but not allowed to perform the action

Example error shapes:

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

```json
{
  "error": {
    "code": "insufficient_permission",
    "message": "The authenticated actor is not allowed to perform this action.",
    "requestId": "req_abc123",
    "retryable": false
  }
}
```

### 4. Refresh and revocation behavior must be operationally real

If refresh tokens or long-lived sessions exist, define:

- storage location
- rotation behavior
- revocation trigger paths
- expired-token cleanup path
- device/session visibility if the product needs it

### 5. Authorization checks must be explicit

Do not rely on route naming or frontend assumptions to imply authorization. State whether access is role-, scope-, tenant-, or attribute-based.

### 6. Service-to-service auth is its own domain boundary

Do not reuse end-user JWT assumptions for machine identity. Service auth should document:

- how one service authenticates to another
- how trust is rotated or revoked
- whether downstream calls propagate end-user identity, service identity, or both

## Practical Implementation Pattern

### Password and secret discipline

- prefer Argon2id when available; bcrypt is acceptable when ecosystem constraints require it
- keep cost factors explicit and revisit them over time
- never log raw credentials or long-lived secrets

### Token/session discipline

- prefer short-lived access material
- keep revocation state server-observable where needed
- tie refresh/session invalidation to concrete events such as logout, password reset, or credential compromise

### Authorization discipline

- centralize shared authorization logic
- keep resource ownership or tenant checks explicit
- ensure deny paths use the canonical error semantics expected by `design-api`

## Review Checklist

Use these questions before approving an auth design or implementation:

1. Which trust boundary is this flow protecting: human user, service, admin, tenant, or third party?
2. Why was this auth mechanism chosen over the alternatives?
3. Are the token/session payloads minimal?
4. Are revocation and rotation defined, not implied?
5. Do backend deny paths align with the API contract's `401` vs `403` rules?
6. Are service-to-service and user-auth boundaries kept separate where needed?
7. Is security policy being referenced from the proper external source instead of redefined here?

## Quick Reference

| Topic | Rule |
|---|---|
| Ownership | backend auth implementation only; contract semantics stay with `design-api` |
| Passwords | hash with proven algorithms, never plaintext |
| Secrets | environment/secret manager, rotation required |
| Token payloads | minimal claims only |
| `401` | missing, invalid, or expired credentials |
| `403` | authenticated but forbidden |
| Revocation | define real invalidation paths |
| Service auth | separate machine trust from end-user auth |

## Common Mistakes

- returning `403` for invalid credentials and `401` for unrelated cases
- putting email and other convenience fields into tokens by default
- treating frontend storage behavior as a backend-owned decision
- reusing user-auth patterns for service-to-service trust
- claiming security-policy ownership inside a backend implementation guide
- documenting refresh tokens without specifying revocation/rotation behavior

## Delivery Checklist

- auth mechanism chosen deliberately
- password and secret handling rules documented
- token/session lifecycle documented where relevant
- authorization model documented
- service-to-service behavior documented where relevant
- backend examples align with `design-api` contract semantics
- external security-policy dependencies called out rather than duplicated
