# spec_frontend Phase 2/3 Coverage and Governance Design

**Goal:** Finish `spec_frontend` as a reusable frontend baseline by adding the missing frontend-owned domains and the coordination documents that make the repository usable across different projects.

## Problem Statement

Phase 1 made the current skill corpus coherent, but coherence alone is not enough. The repository still lacks several baseline frontend domains that teams need during real delivery, and it still lacks the documents that explain how the skills fit together.

Without Phase 2/3, the repository remains high quality but incomplete in practice:

- analytics behavior still has no canonical owner
- frontend SEO behavior still relies on an audit skill instead of an implementation policy
- browser/device support expectations are implicit instead of explicit
- frontend observability behavior is missing
- cross-repo/spec integration rules are missing
- new users still do not have a single map, ownership matrix, or adoption checklist

## Design Principles

1. **Add missing domains without re-opening Phase 1 drift.** New skills should extend the baseline, not redefine existing owners.
2. **Policy beats audit.** Where an audit/reference skill already exists, the new baseline skill should own implementation policy while the audit skill remains a companion.
3. **Cross-project usability requires coordination docs.** The baseline should be discoverable and adoptable without tribal knowledge.
4. **Frontend scope stays frontend-owned.** Integration with backend/security/testing specs should be explicit, but this repo should not absorb ownership that belongs elsewhere.

## New Baseline Owners Added in Phase 2

- `frontend-analytics-implementation` → analytics event design, tracking structure, privacy-safe instrumentation boundaries, validation workflow
- `frontend-seo-implementation` → metadata, canonicals, robots behavior, sitemap/frontend discoverability hooks, JSON-LD integration policy
- `browser-device-support` → support matrix policy, breakpoint/device expectations, graceful degradation, validation coverage
- `frontend-observability` → client error logging, performance telemetry hooks, correlation context, release-time monitoring expectations
- `frontend-external-spec-integration` → how frontend teams consume backend/security/testing/domain specs without duplicating ownership

## Relationship to Existing Skills

### Core baseline skills remain owners of their current domains

- `frontend-design` still owns visual direction
- `frontend-design-system` still owns shared tokens/layout/motion
- `responsive-design` still owns responsive implementation patterns
- `web-accessibility` still owns accessibility rules and validation
- `ui-component-patterns` still owns reusable component architecture
- `state-management` still owns state boundaries and implementation choices

### Existing reference/audit skills remain companions, not replacements

- `seo-audit` remains the SEO audit/review companion
- `vercel-react-best-practices` remains a React/Next/Vercel appendix
- `tailwind-design-system` remains a Tailwind v4 + React 19 profile
- `ui-ux-pro-max` remains a heuristic/reference library
- `web-design-guidelines` remains an external validator wrapper

## Governance Layer Added in Phase 3

Phase 3 adds three top-level docs that make the baseline usable at repository scale:

1. `FRONTEND-SPEC-INDEX.md`
   - front door into the repository
   - explains the difference between baseline owners and profiles/references
   - routes readers to the right skills quickly

2. `DOMAIN-OWNERSHIP.md`
   - defines which file owns which frontend domain
   - defines precedence when documents overlap
   - defines how external spec repos fit into frontend work

3. `NEW-PROJECT-CHECKLIST.md`
   - converts the repository from “good reference” into “adoptable baseline”
   - ensures a new project selects baseline skills, stack profiles, and external spec dependencies deliberately

## Non-Goals for Phase 2/3

Phase 2/3 does **not**:

- replace backend, security, or QA spec repositories
- rewrite existing normalized skills unless a new cross-reference is needed
- create stack-specific implementation skills beyond the already-scoped profiles
- introduce app code, tests, or build tooling into this repository

## Expected Repository State After Phase 2/3

After these phases, `spec_frontend` should be able to claim:

- every major frontend-owned baseline domain has a canonical owner
- SEO audit and implementation are separated cleanly
- analytics, observability, browser/device policy, and external-spec integration are documented as first-class concerns
- new projects can discover the right documents quickly
- domain ownership and precedence are explicit rather than implied
- the repo can be adopted across projects without guessing how pieces fit together

## Verification Strategy

Because this repository is documentation-first, verification remains structural:

1. confirm the new files exist in the expected locations
2. confirm the index and ownership docs reference the correct owners
3. confirm the new skills do not silently re-own accessibility, component architecture, design-system, or state domains
4. search for required new filenames and key governance headings
5. run diagnostics where supported and report the result explicitly
