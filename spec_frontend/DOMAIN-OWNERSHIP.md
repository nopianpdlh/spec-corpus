# Domain Ownership and Precedence

This file defines which document owns which frontend domain and what to do when documents overlap.

## Precedence Rules

When two documents appear to cover the same topic, resolve them in this order:

1. **Canonical domain owner wins inside its owned scope.**
2. **Profiles, appendices, and audit/reference skills may extend or validate, but not silently override, the owner.**
3. **External spec repositories win on their own domain policy** (backend, security, QA, platform, product), while `spec_frontend` owns the frontend translation of those requirements.
4. **If a conflict is recurring, update this file and the relevant owner skill.** Do not rely on ad-hoc interpretation.

## Frontend-Owned Domains

| Domain | Canonical owner | Includes | Explicitly does not own |
|---|---|---|---|
| Visual direction | `.agents/skills/frontend-design/SKILL.md` | product visual tone, differentiation, typography intent, aesthetic direction | design-token system, component APIs, accessibility policy |
| Design system foundation | `.agents/skills/frontend-design-system/SKILL.md` | tokens, spacing, layout rules, motion defaults, handoff structure | full accessibility policy, analytics, SEO, browser support matrix |
| Responsive implementation | `.agents/skills/responsive-design/SKILL.md` | responsive layouts, breakpoint use, fluid sizing strategy | official browser/device support policy |
| Accessibility | `.agents/skills/web-accessibility/SKILL.md` | semantics, keyboard/focus, ARIA, accessible interaction rules, validation | analytics, SEO strategy, design-token ownership |
| Component architecture | `.agents/skills/ui-component-patterns/SKILL.md` | component composition, prop APIs, reusable architecture patterns | full accessibility ownership, state ownership, stack-specific Tailwind/Next rules |
| State management | `.agents/skills/state-management/SKILL.md` | local/global/server state boundaries, store/query decisions, UI state coordination | analytics semantics, observability semantics |
| Analytics implementation | `.agents/skills/frontend-analytics-implementation/SKILL.md` | event contracts, trigger rules, payload boundaries, consent-safe instrumentation | dashboards, warehousing, reporting models |
| SEO implementation | `.agents/skills/frontend-seo-implementation/SKILL.md` | metadata, canonicals, robots, search-visible rendering behavior, structured-data policy | SEO audits, editorial strategy, non-frontend sitemap ownership |
| Browser/device support | `.agents/skills/browser-device-support/SKILL.md` | support matrix, fallback stance, enhancement policy, QA coverage expectations | responsive layout rules, accessibility ownership |
| Frontend observability | `.agents/skills/frontend-observability/SKILL.md` | client error telemetry, release monitoring expectations, safe operational context | analytics semantics, backend alert routing, incident policy |
| External spec integration | `.agents/skills/frontend-external-spec-integration/SKILL.md` | cross-spec dependency rules, frontend translation of external requirements, conflict escalation | backend/security/QA/platform/product ownership itself |

## Profiles, Appendices, and Audit Companions

These documents are valid but non-owning unless explicitly stated otherwise.

| File | Role | Relationship to owners |
|---|---|---|
| `.agents/skills/tailwind-design-system/SKILL.md` | Tailwind v4 + React 19 profile | applies only when that stack is chosen; does not replace design-system or component owners |
| `.agents/skills/vercel-react-best-practices/SKILL.md` | React/Next/Vercel performance appendix | complements the baseline for that stack |
| `.agents/skills/ui-ux-pro-max/SKILL.md` | heuristic/reference library | inspiration and validation source, not a baseline owner |
| `.agents/skills/web-design-guidelines/SKILL.md` | external Vercel review wrapper | validates implementations and surfaces conflicts with local baseline |
| `.agents/skills/seo-audit/SKILL.md` | SEO audit companion | validates SEO output after implementation; does not own SEO policy |
| `.agents/skills/react-grab/SKILL.md` | tooling utility | supports implementation workflow, not spec ownership |

## External Domain Ownership

`spec_frontend` must integrate with external domain owners rather than duplicate them.

| External domain | Owned outside `spec_frontend` | Frontend responsibility |
|---|---|---|
| Backend API contracts | e.g. `spec_backend` | implement UI states and client behavior against the consumed contract |
| Security / privacy | e.g. `spec_security` | enforce frontend-safe handling, consent behavior, session/UI constraints |
| QA / release governance | e.g. `spec_qa` | satisfy required frontend validations and release gates |
| Product requirements | PRD/domain spec | implement frontend behavior, acceptance states, discoverability, analytics hooks |
| Platform / infrastructure | platform spec | align build/runtime assumptions and monitoring handoff |

## Conflict Resolution Workflow

When overlap appears:

1. identify the domain being disputed
2. locate its canonical owner in the table above
3. check whether the conflicting document is a profile/reference or an external owner
4. apply the owner’s rule within its scope
5. if the boundary is unclear, update this file and the relevant owner skill so the ambiguity does not repeat

## Practical Examples

- **A Tailwind profile disagrees with generic component guidance** → `ui-component-patterns` owns the generic baseline; `tailwind-design-system` applies only for Tailwind v4 + React 19 projects.
- **An SEO audit suggests a rendering issue** → `frontend-seo-implementation` owns implementation policy; `seo-audit` validates the outcome and may trigger updates to the policy.
- **A security repo requires stricter consent behavior** → the external security spec owns the policy; `frontend-analytics-implementation` and `frontend-external-spec-integration` define how that policy changes frontend instrumentation.
- **A browser-specific bug appears in a core feature** → `browser-device-support` owns the support stance and fallback expectation; `responsive-design` may still own layout adjustments.
