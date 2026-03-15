---
name: frontend-analytics-implementation
description: Use when defining frontend analytics events, data-layer rules, privacy-safe instrumentation, or release-time tracking validation for product features across web projects.
---

# Frontend Analytics Implementation

This skill is the baseline owner for frontend analytics implementation. It defines how the UI emits product events, how event contracts stay stable, and how teams validate tracking without leaking ownership into backend analytics pipelines or marketing analysis.

## When to Use

- adding analytics to a new feature flow
- defining event names, payloads, and trigger rules
- deciding what belongs in the client event contract versus backend enrichment
- validating analytics before release
- reviewing whether analytics behavior is privacy-safe and maintainable

Do **not** use this skill to design dashboards, attribution models, or warehouse schemas. Keep frontend ownership focused on event intent, trigger timing, payload boundaries, consent handling, and validation.

## Ownership Boundaries

- `frontend-analytics-implementation` owns event design, trigger rules, payload structure, consent gating, and release validation from the frontend side.
- `state-management` owns how view state is modeled; analytics should observe state transitions, not replace state design.
- `ui-component-patterns` owns component architecture; analytics hooks should fit the component tree instead of warping it.
- `web-accessibility` owns accessibility behavior; never fire misleading events from non-semantic interactions.
- backend or data-platform specs own downstream enrichment, warehousing, identity stitching, and reporting semantics.

## Core Pattern

### 1. Start with a tracking contract, not ad-hoc calls

For every event, define:

- **event name** — stable, human-readable, product-oriented
- **user intent** — what user action or system milestone it represents
- **trigger** — the exact UI moment when it fires
- **required properties** — minimal payload required for analysis
- **forbidden properties** — PII, secrets, freeform sensitive text unless explicitly approved elsewhere
- **dedupe rule** — whether the event may fire once per view, per click, per submission, or per successful outcome

Example contract:

| Field | Example |
|---|---|
| Event name | `signup_submitted` |
| User intent | User completed the signup form submission |
| Trigger | After client validation passes and submit action is dispatched |
| Required properties | `plan`, `entry_point`, `experiment_variant` |
| Forbidden properties | email, full name, access token, raw form notes |
| Dedupe rule | once per submit attempt |

### 2. Track outcomes, not implementation noise

Prefer product events such as:

- `checkout_started`
- `search_results_viewed`
- `pricing_cta_clicked`
- `profile_save_failed`

Avoid low-value noise such as:

- `button_blue_clicked`
- `div_rendered`
- `modal_component_mounted`

If the event name exposes implementation details instead of product intent, redesign it.

### 3. Separate user intent from technical diagnostics

Frontend analytics and frontend observability are related but different.

- analytics answers: **what meaningful product behavior happened?**
- observability answers: **what failed, slowed down, or behaved unexpectedly?**

Use `frontend-observability` for errors, traces, and client health signals. Keep analytics focused on user journeys and feature outcomes.

## Implementation Workflow

### Step 1: Map the journey

For a new feature, document:

- entry points
- major steps/screens
- success event
- failure event
- abandon or retry moments worth tracking

### Step 2: Define the event set

Use a narrow set of canonical events:

- one event for key page/view exposure only when it matters
- one event for primary CTA intent
- one event for major success outcome
- one event for major failure outcome if it changes product understanding

Do not log every hover, focus, or render by default.

### Step 3: Define payload discipline

Payloads should be:

- small
- typed/enum-like where possible
- stable across releases
- understandable without reading the component code

Prefer:

```ts
track('checkout_completed', {
  plan: 'pro',
  billing_interval: 'annual',
  coupon_applied: true,
})
```

Avoid:

```ts
track('finishBtnClicked', {
  formState: entireFormObject,
  DOMText: button.innerText,
  debugData: everything,
})
```

### Step 4: Gate by consent and environment

- respect consent before emitting non-essential analytics
- separate production, staging, and local validation modes
- never rely on production dashboards as the first verification step

### Step 5: Validate before release

Before shipping, verify:

- the event fires at the intended moment
- required properties are present
- forbidden fields are not present
- retries, cancellations, and failures do not double-fire success events
- instrumentation still works with loading, empty, and error states

## Quick Reference

| Topic | Rule |
|---|---|
| Event naming | Product-oriented, stable, snake_case or agreed convention |
| Payloads | Minimal, typed, privacy-safe |
| Consent | Required before non-essential analytics |
| Ownership | Frontend owns event trigger and payload boundary |
| Validation | Verify in-browser before release |

## Common Mistakes

- tracking component internals instead of user intent
- placing raw personal data in analytics payloads
- firing events before the actual product milestone occurs
- double-firing on retries or re-renders
- creating different names for the same journey across pages
- mixing observability logs and product analytics into one stream

## Delivery Checklist

- event set documented for the feature
- success/failure triggers defined clearly
- payloads reviewed for privacy and stability
- consent behavior verified
- release validation completed in the browser/network layer
