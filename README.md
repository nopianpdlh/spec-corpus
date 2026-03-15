# Spec Corpus

This repository is a governed multi-domain spec corpus for web projects.

It is not a starter app, boilerplate, or single monolithic specification. It is a reusable operating baseline that helps agents and engineers route into the right domain guidance, use the right owners, and avoid mixing concerns across frontend, backend, infrastructure, quality, and documentation.

## What lives here

The repository currently contains five hardened corpora:

| Corpus | Entry point | Purpose |
|---|---|---|
| `spec_frontend` | `spec_frontend/FRONTEND-SPEC-INDEX.md` | frontend product delivery, UI architecture, accessibility, responsive behavior, SEO, analytics, frontend observability |
| `spec_backend` | `spec_backend/BACKEND-SPEC-INDEX.md` | API contract design, auth implementation, storage design, backend verification, API publication |
| `spec_code-quality` | `spec_code-quality/CODE-QUALITY-SPEC-INDEX.md` | review, refactoring, testing strategy, performance optimization, debugging support |
| `spec_documentation` | `spec_documentation/DOCS-SPEC-INDEX.md` | documentation authoring, release communication, presentation/documentation support |
| `spec_infrastructure` | `spec_infrastructure/INFRA-SPEC-INDEX.md` | runtime configuration, deployment automation, bootstrap setup, infra-facing hardening |

Each corpus already contains its own:

- spec index/front door
- `DOMAIN-OWNERSHIP.md`
- `NEW-PROJECT-CHECKLIST.md`
- canonical owners and companion/process skills

The job of the **root** is different: it helps you start, route, and sequence work across corpora.

## Start here

Use the root docs in this order:

1. `OPERATING-MODEL.md` — how this repository is meant to be used
2. `ARCHITECTURE.md` — how the repo is structured and how corpora relate
3. `CENTRAL-CHECKLIST.md` — intake path for a new project or major workstream
4. the relevant corpus index doc
5. the relevant corpus `DOMAIN-OWNERSHIP.md` and `NEW-PROJECT-CHECKLIST.md`
6. the specific owner skill(s) needed for the task

## Critical usage rule

Do **not** load every corpus at once.

Start at the root, determine which domain(s) matter, then route into the relevant corpus only. Load additional corpora only when the work crosses a real domain boundary.

## Root operating docs

- `OPERATING-MODEL.md` — repo-level routing, sequencing, and overlap handling
- `ARCHITECTURE.md` — directory map and repeated governance pattern
- `CENTRAL-CHECKLIST.md` — cross-domain intake checklist for new projects and major initiatives
- `CONTRIBUTING.md` — how this corpus evolves and how new domains/skills are hardened safely
