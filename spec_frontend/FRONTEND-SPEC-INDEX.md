# Frontend Spec Index

`spec_frontend` is the reusable frontend baseline for cross-project product delivery. It is organized around **canonical domain owners**, with stack-specific profiles and audit/reference skills kept separate so the baseline stays stable.

Use this file as the front door for the frontend corpus after routing from the root docs.

## How to Read This Repo

There are three layers:

1. **Core baseline owners** — the canonical source of truth for frontend-owned domains.
2. **Profiles / references / audit companions** — useful specialized guidance that does not replace the baseline owner.
3. **Planning and governance docs** — documents that explain how the baseline fits together and how to adopt it on a new project.

If two documents overlap, use `DOMAIN-OWNERSHIP.md` to resolve precedence.

## Core Baseline Owners

| Domain | Owner | Use for |
|---|---|---|
| Visual direction | `.agents/skills/frontend-design/SKILL.md` | aesthetic direction, tone, differentiation, typography intent |
| Design tokens / layout / motion | `.agents/skills/frontend-design-system/SKILL.md` | token systems, layout structure, motion defaults, handoff |
| Responsive implementation | `.agents/skills/responsive-design/SKILL.md` | breakpoints, layout adaptation, responsive behavior |
| Accessibility | `.agents/skills/web-accessibility/SKILL.md` | semantic HTML, keyboard/screen reader behavior, accessible interaction rules |
| Component architecture | `.agents/skills/ui-component-patterns/SKILL.md` | reusable component APIs, composition, architecture patterns |
| State management | `.agents/skills/state-management/SKILL.md` | local/global/server state boundaries and implementation choices |
| Analytics implementation | `.agents/skills/frontend-analytics-implementation/SKILL.md` | event design, trigger timing, payload boundaries, consent-safe tracking |
| SEO implementation | `.agents/skills/frontend-seo-implementation/SKILL.md` | metadata, canonicals, robots behavior, structured-data policy |
| Browser / device support | `.agents/skills/browser-device-support/SKILL.md` | support matrix, progressive enhancement, fallback policy, QA coverage |
| Frontend observability | `.agents/skills/frontend-observability/SKILL.md` | client error telemetry, release monitoring, performance signal capture |
| External spec integration | `.agents/skills/frontend-external-spec-integration/SKILL.md` | how frontend consumes backend/security/QA/product/platform specs |

## Profiles, References, and Audit Companions

These files remain important, but they do **not** replace the baseline owners above.

| File | Role |
|---|---|
| `.agents/skills/tailwind-design-system/SKILL.md` | Tailwind CSS v4 + React 19 profile |
| `.agents/skills/vercel-react-best-practices/SKILL.md` | React / Next.js / Vercel performance appendix |
| `.agents/skills/ui-ux-pro-max/SKILL.md` | broad heuristic/reference library for design exploration |
| `.agents/skills/web-design-guidelines/SKILL.md` | external Vercel-guideline review wrapper |
| `.agents/skills/seo-audit/SKILL.md` | SEO audit/review companion for validating implementation |
| `.agents/skills/react-grab/SKILL.md` | tooling utility for extracting React component context |

## Recommended Reading Order

### If you are starting a new project

1. `NEW-PROJECT-CHECKLIST.md`
2. `DOMAIN-OWNERSHIP.md`
3. the relevant core baseline owners for your project scope
4. any stack-specific profiles that apply

### If you are resolving overlap or conflict

1. `DOMAIN-OWNERSHIP.md`
2. the domain owner skill
3. any profile/reference skill that also touches the topic
4. external spec repositories if the topic is owned outside frontend

### If you are implementing a feature

Start from the owner for the affected domain, then pull in supporting owners as needed:

- feature UI → `frontend-design`, `frontend-design-system`, `ui-component-patterns`
- responsive behavior → `responsive-design`
- accessibility-sensitive interaction → `web-accessibility`
- analytics → `frontend-analytics-implementation`
- SEO-sensitive pages → `frontend-seo-implementation` plus `seo-audit`
- reliability/release monitoring → `frontend-observability`
- external dependency boundary questions → `frontend-external-spec-integration`

## Repository Planning Docs

The current evolution of the baseline is documented in:

- `docs/plans/2026-03-14-spec-frontend-phase-1-normalization-design.md`
- `docs/plans/2026-03-14-spec-frontend-phase-1-normalization-plan.md`
- `docs/plans/2026-03-14-spec-frontend-phase-2-3-design.md`
- `docs/plans/2026-03-14-spec-frontend-phase-2-3-plan.md`

## What This Repo Does Not Own

`spec_frontend` does **not** replace:

- backend API truth
- security/privacy ownership
- QA/test governance outside frontend-facing execution requirements
- infrastructure / incident-response policy
- product strategy or editorial taxonomy ownership

Use `frontend-external-spec-integration` and `DOMAIN-OWNERSHIP.md` to connect those external domains safely.
