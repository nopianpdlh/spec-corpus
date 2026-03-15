# New Project Checklist

Use this checklist when adopting `spec_frontend` for a new production project.

The goal is not to load every skill blindly. The goal is to select the correct baseline owners, add the right profiles, connect external spec dependencies, and make release expectations explicit from the start.

## 1. Confirm Baseline Adoption

- [ ] project will use `spec_frontend` as the frontend baseline
- [ ] team has read `FRONTEND-SPEC-INDEX.md`
- [ ] team has read `DOMAIN-OWNERSHIP.md`
- [ ] baseline owner set has been acknowledged:
  - [ ] `frontend-design`
  - [ ] `frontend-design-system`
  - [ ] `responsive-design`
  - [ ] `web-accessibility`
  - [ ] `ui-component-patterns`
  - [ ] `state-management`
  - [ ] `frontend-analytics-implementation`
  - [ ] `frontend-seo-implementation` (if public/search-visible web surface exists)
  - [ ] `browser-device-support`
  - [ ] `frontend-observability`
  - [ ] `frontend-external-spec-integration`

## 2. Choose Applicable Profiles and Companions

Only adopt these when they match the project stack or workflow.

- [ ] `tailwind-design-system` if the project uses Tailwind CSS v4 / React 19 profile assumptions
- [ ] `vercel-react-best-practices` if the project uses React + Next.js / Vercel patterns
- [ ] `ui-ux-pro-max` as optional reference/inspiration layer
- [ ] `web-design-guidelines` as external review validator
- [ ] `seo-audit` as implementation-review companion for search-visible experiences
- [ ] `react-grab` if AI/browser-assisted component extraction is part of the workflow

## 3. Define External Spec Dependencies

List the non-frontend domains the project depends on.

- [ ] backend/API contract source identified
- [ ] security/privacy source identified
- [ ] QA/release-governance source identified
- [ ] product / PRD / acceptance-criteria source identified
- [ ] platform / infrastructure source identified if needed
- [ ] cross-spec integration rules reviewed in `frontend-external-spec-integration`

For each dependency, record:

- owning repo/doc
- what the frontend consumes from it
- who resolves conflicts
- which frontend-visible behavior must change because of it

## 4. Lock Frontend Baseline Decisions

- [ ] visual direction owner agreed (`frontend-design`)
- [ ] design-token/layout/motion owner agreed (`frontend-design-system`)
- [ ] responsive strategy agreed (`responsive-design`)
- [ ] accessibility validation owner agreed (`web-accessibility`)
- [ ] component architecture owner agreed (`ui-component-patterns`)
- [ ] state model owner agreed (`state-management`)
- [ ] browser/device support matrix documented (`browser-device-support`)

## 5. Lock Product-Critical Non-Visual Frontend Policies

- [ ] analytics event contract approach defined (`frontend-analytics-implementation`)
- [ ] observability / release telemetry expectations defined (`frontend-observability`)
- [ ] SEO implementation policy defined for public pages (`frontend-seo-implementation`)
- [ ] non-indexable/private/search-result routes explicitly identified where relevant
- [ ] consent/privacy implications applied to analytics and client logging

## 6. Define Support and Validation Expectations

- [ ] supported browsers documented
- [ ] supported device classes documented
- [ ] fallback rules for advanced APIs documented
- [ ] accessibility validation expectations documented
- [ ] analytics validation path documented
- [ ] observability/release monitoring path documented
- [ ] SEO validation path documented where applicable

## 7. Pre-Implementation Readiness Check

Before feature implementation begins, confirm:

- [ ] no major domain is ownerless
- [ ] profiles/reference skills are not being treated as canonical owners
- [ ] external dependencies are explicit rather than assumed
- [ ] project-specific deviations from the baseline are documented
- [ ] conflict escalation path is clear

## 8. Release-Readiness Check

Before the first production release, confirm:

- [ ] accessibility-critical flows have been validated
- [ ] analytics events fire at intended moments with safe payloads
- [ ] critical observability signals include version/release context
- [ ] supported browser/device coverage has been exercised
- [ ] public/indexable pages follow the agreed SEO implementation policy
- [ ] external spec dependencies have been honored in frontend behavior

## Minimal Adoption Rule

If a project cannot explain:

- which doc owns each major frontend domain,
- which profiles are optional versus canonical,
- and which external repos own backend/security/QA/product policy,

then the baseline has not actually been adopted yet.
