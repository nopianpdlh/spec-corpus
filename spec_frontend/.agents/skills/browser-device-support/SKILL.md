---
name: browser-device-support
description: Use when defining supported browsers, device classes, degradation rules, responsive QA coverage, or feature support expectations for production frontend projects.
---

# Browser Device Support

This skill is the baseline owner for browser and device support policy. It defines what environments a frontend project must support, how progressive enhancement and graceful degradation work, and how teams convert responsive assumptions into explicit compatibility coverage.

## When to Use

- starting a new frontend project
- defining browser support and mobile/tablet/desktop expectations
- deciding whether a feature needs polyfills, fallbacks, or progressive enhancement
- planning QA coverage across devices and interaction modes
- reviewing whether a feature is safe to ship across the supported matrix

## Ownership Boundaries

- `browser-device-support` owns support policy, compatibility expectations, fallback rules, and validation coverage.
- `responsive-design` owns layout/adaptation patterns, not the official support matrix.
- `web-accessibility` owns accessible interaction requirements across keyboard, screen readers, zoom, and reduced-motion contexts.
- stack/platform owners elsewhere may define platform-specific build targets, but this skill owns the frontend-facing support stance.

## Core Pattern

### 1. Define supported environments explicitly

Every project should state:

- supported desktop browsers
- supported mobile browsers
- supported device classes (small mobile, large mobile, tablet, laptop, wide desktop)
- interaction assumptions (touch, keyboard, pointer, reduced motion, dark mode where relevant)
- minimum support stance for older or partial environments

Example support statement:

- latest two stable versions of Chrome, Edge, Safari, and Firefox
- current iOS Safari and Android Chrome baseline
- responsive support across mobile, tablet, laptop, and wide desktop breakpoints
- graceful degradation for non-critical advanced APIs

### 2. Separate baseline support from enhancement layers

For each feature, define:

- **baseline behavior** — what must always work
- **enhanced behavior** — what is optional when the environment supports it

Example:

- baseline: form submission, navigation, content reading, search, purchase, account flows
- enhancement: fancy view transitions, background blur, advanced sharing API, richer animations

### 3. Prefer progressive enhancement over silent failure

If an advanced browser capability is unavailable:

- the core task must still work
- the UI should fall back predictably
- analytics or observability may record unsupported capability states when useful

### 4. Test real interaction modes, not just viewport widths

Browser/device support is not only width-based. Cover:

- touch targets and touch-specific ergonomics
- keyboard access
- hover versus no-hover assumptions
- high zoom / text scaling
- reduced motion
- slow network / constrained CPU where relevant

## Implementation Workflow

### Step 1: Write the support matrix

Document browser families, device classes, and interaction modes.

### Step 2: Classify features by support sensitivity

Mark features as:

- core path
- enhanced but optional
- experimental / gated

### Step 3: Define fallback behavior

For anything beyond the baseline, specify:

- unsupported behavior
- fallback UI/UX
- whether the fallback is silent, explicit, or feature-gated

### Step 4: Attach QA coverage

For every release-ready feature, define minimum validation coverage across:

- one desktop Chromium browser
- one desktop Safari or Firefox path if supported
- one mobile Safari path
- one Android Chrome path
- one keyboard-only pass for critical flows

### Step 5: Review after major feature additions

Any feature that depends on APIs like clipboard, sharing, payments, media capture, drag-and-drop, or advanced motion should update the support notes.

## Quick Reference

| Topic | Rule |
|---|---|
| Support matrix | Explicit, versioned, and project-visible |
| Core flows | Must work across supported environments |
| Advanced APIs | Progressive enhancement by default |
| QA | Cover browsers, devices, and interaction modes |
| Ownership | Policy lives here; layout rules live in `responsive-design` |

## Common Mistakes

- treating “responsive” as equivalent to “fully supported” 
- assuming hover, fine pointer, or latest APIs everywhere
- shipping advanced visual effects without reduced-motion or fallback behavior
- validating only in one desktop browser
- leaving device/browser support implicit until bugs appear in production

## Delivery Checklist

- browser/device support matrix documented
- core vs enhanced feature behavior defined
- fallback rules captured for advanced APIs
- QA coverage defined across supported environments
- release notes updated when support assumptions change
