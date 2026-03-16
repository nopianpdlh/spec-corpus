# spec_frontend Phase 1 Normalization Design

**Goal:** Turn `spec_frontend` from a loose collection of frontend-oriented skills into a coherent reusable frontend baseline by removing internal contradictions, clarifying topic ownership, and separating universal guidance from stack-specific profiles.

## Problem Statement

`spec_frontend` already has strong material for UI quality, accessibility, responsiveness, component architecture, and React/Tailwind implementation. The current blocker is not lack of quality inside each file, but lack of coordination across files.

The highest-friction issues are:

- core rules contradict each other (`Inter` guidance, `forwardRef` guidance, px usage, immutability wording)
- multiple skills re-own the same topic, especially accessibility
- stack-specific guidance is written as if it were universal frontend baseline guidance
- a few files still contain broken references or unfinished placeholder content

Phase 1 solves those structural issues before adding new coverage areas.

## Design Principles

1. **One owner per topic.** Each major frontend domain should have one canonical skill that owns the rules. Other skills may reference that domain, but should not silently redefine it.
2. **Universal baseline first.** Rules that apply across projects belong in the baseline. Stack-specific rules belong in scoped profiles or appendices.
3. **Examples must match rules.** Guidance loses authority when examples contradict the stated rule.
4. **Keep useful specialization.** The goal is not to flatten all skills into one style, but to make their boundaries explicit.

## Ownership Model for Phase 1

### Core baseline owners

- `frontend-design` → visual direction and aesthetic differentiation
- `frontend-design-system` → shared tokens, layout rules, motion token defaults, handoff structure
- `responsive-design` → responsive implementation patterns and breakpoint usage
- `web-accessibility` → canonical accessibility rules and validation
- `ui-component-patterns` → reusable component architecture and composition patterns
- `state-management` → local/global/server state decision-making and implementation boundaries

### Stack-specific or reference-heavy profiles

- `tailwind-design-system` → Tailwind CSS v4 + React 19 profile
- `vercel-react-best-practices` → React/Next.js/Vercel performance appendix
- `ui-ux-pro-max` → broad heuristic/reference library, not canonical owner
- `web-design-guidelines` → external validator wrapper, not local source of truth
- `seo-audit` → audit skill retained for later pairing with an implementation-owner SEO skill

## Phase 1 Scope

### 1. Normalize contradictory wording

- soften absolute anti-Inter wording in `frontend-design`
- keep `frontend-design-system` free to show a neutral baseline sans token example
- align `responsive-design` rules with its own px-based breakpoint/token examples
- distinguish plain-state immutability from Redux Toolkit/Immer reducer mutation in `state-management`
- remove universal `forwardRef` assumptions from `ui-component-patterns`
- scope React 19 ref-as-prop guidance to the Tailwind/React 19 profile only

### 2. Clarify ownership boundaries

- make `web-accessibility` the explicit accessibility source of truth
- reduce duplicated accessibility checklist ownership in `frontend-design-system`
- mark `web-design-guidelines` as an external review layer rather than internal authority

### 3. Fix structural hygiene issues

- remove broken related-skill references
- replace placeholder example sections with real content
- add scope notes where a skill is intentionally stack-specific or reference-heavy

## Non-Goals for Phase 1

Phase 1 does **not** yet:

- add new frontend domains like analytics, observability, browser/device support, or external-spec integration
- create governance docs such as `FRONTEND-SPEC-INDEX.md`, `DOMAIN-OWNERSHIP.md`, or `NEW-PROJECT-CHECKLIST.md`
- normalize metadata/frontmatter format across every skill file

Those belong to later phases once the baseline is internally coherent.

## Expected Repository State After Phase 1

After this phase, `spec_frontend` should be able to claim:

- no major rule conflicts across the current baseline skills
- one clearly implied owner per current frontend topic
- stack-specific rules clearly marked as scoped guidance
- no broken related-skill links or obvious placeholder sections in the normalized files
- examples that reinforce, rather than weaken, the written rules

## Verification Strategy

Because this repository is a skill/spec corpus rather than an executable app, verification is structural:

1. re-read modified files
2. search for removed contradiction markers and placeholder text
3. confirm broken links and misleading absolute rules were eliminated or scoped
4. run diagnostics where supported and report the result explicitly

## Follow-on Phases

### Phase 2 — Coverage

Add the missing frontend-owned domains that make the baseline production-ready, such as state-pattern UX, analytics implementation, SEO implementation, browser/device support, observability, and external spec integration.

### Phase 3 — Governance

Once the baseline is stable, add coordinating docs:

- `FRONTEND-SPEC-INDEX.md`
- `DOMAIN-OWNERSHIP.md`
- `NEW-PROJECT-CHECKLIST.md`

Those docs should summarize and coordinate the baseline, not compensate for unresolved contradictions inside it.
