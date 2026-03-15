---
name: frontend-observability
description: Use when defining client-side error reporting, telemetry hooks, release monitoring, performance signal capture, or correlation rules for production frontend applications.
---

# Frontend Observability

This skill is the baseline owner for frontend observability. It defines what the client should emit so teams can detect failures, regressions, and degraded user experience without confusing product analytics with operational telemetry.

## When to Use

- adding client error logging or performance telemetry
- defining release monitoring expectations for a frontend feature
- deciding which failures deserve structured reporting from the browser
- reviewing whether a critical user journey is observable in production
- separating analytics events from health/error telemetry

## Ownership Boundaries

- `frontend-observability` owns client-visible health signals: error capture, performance telemetry, environment context, release-time monitoring expectations.
- `frontend-analytics-implementation` owns product analytics and user-behavior events.
- backend/infrastructure specs own server traces, ingestion pipelines, alert routing, and incident processes.
- `state-management` owns how the UI models loading/error state, while this skill owns what operational signal should be emitted when those states matter in production.

## Core Pattern

### 1. Capture signals that help debug real user impact

Useful frontend observability signals include:

- unhandled exceptions
- handled but user-visible failures
- critical network/request failures
- route-level performance degradation
- feature-load or hydration failures
- repeated retry loops or stuck states for critical journeys

Do not treat every console warning or debug note as observability.

### 2. Always include context that helps triage

Operational signals should include safe context such as:

- app version / release identifier
- route or feature name
- environment
- browser/device family when available
- correlation/request id when available and safe
- severity and failure category

Avoid leaking secrets, tokens, or raw personal data.

### 3. Separate user-visible errors from silent diagnostics

At minimum, classify events as:

- user-blocking error
- degraded but recoverable error
- background diagnostic/performance signal

This prevents alert fatigue and keeps release monitoring actionable.

### 4. Observe critical journeys, not every line of code

Prioritize observability around:

- authentication and session continuity
- checkout or conversion funnels
- content fetch and rendering failures on high-value pages
- save/update flows where silent failure is costly
- startup, hydration, and navigation failures

## Implementation Workflow

### Step 1: Identify critical journeys and failure points

For each high-value flow, ask:

- what can fail in a user-visible way?
- what would we want to know within minutes of release?
- what would block support or debugging if not logged?

### Step 2: Define event categories

Use a small set of categories such as:

- `client_exception`
- `api_request_failed`
- `route_render_failed`
- `performance_budget_exceeded`
- `feature_initialization_failed`

### Step 3: Define severity and sampling strategy

Not every event needs the same handling. Document:

- severity
- sampling rule
- whether the signal is always-on or environment-gated

### Step 4: Tie observability to release readiness

Before release, verify:

- critical errors surface in the chosen monitoring path
- release/version tagging is present
- noisy duplicates are controlled
- success-only analytics are not masking operational failures

### Step 5: Keep dashboards and alerts downstream

This skill defines what the frontend emits and why. It does not own downstream alert policy or vendor-specific dashboards.

## Quick Reference

| Topic | Rule |
|---|---|
| Signal scope | User-visible failures and important health signals first |
| Context | Include version, route, environment, severity, safe identifiers |
| Privacy | No secrets or raw sensitive data |
| Separation | Do not merge analytics and observability semantics |
| Release readiness | Validate critical telemetry before shipping |

## Common Mistakes

- treating analytics events as if they were error telemetry
- logging too little context to debug the issue
- logging so much noise that real incidents disappear
- omitting release/version tags
- capturing raw personal data, tokens, or server secrets in client logs
- instrumenting low-value noise while missing critical user-blocking flows

## Delivery Checklist

- critical journeys and failure points mapped
- client signal categories defined
- severity/context rules documented
- privacy-safe payload rules defined
- release validation completed for key telemetry paths
