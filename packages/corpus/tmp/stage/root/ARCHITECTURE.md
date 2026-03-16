# Architecture

## Repository shape

Current project-facing root structure:

- `.sisyphus/` — planning workspace used during hardening and implementation planning
- `spec_frontend/` — governed frontend corpus
- `spec_backend/` — governed backend corpus
- `spec_code-quality/` — governed quality corpus
- `spec_documentation/` — governed documentation corpus
- `spec_infrastructure/` — governed infrastructure corpus

## Why the repo is split by corpus

The repository is separated by domain so each concern can have one clear owner set and one clear governance shell.

This avoids a common failure mode in large reference repos: everything becoming one vague mega-spec with overlapping authority.

## Repeated corpus pattern

Each governed corpus follows the same internal pattern:

1. index/front-door document
2. `DOMAIN-OWNERSHIP.md`
3. `NEW-PROJECT-CHECKLIST.md`
4. canonical local owner skills
5. companion/process-only skills kept explicitly non-owning
6. lockfile metadata aligned with actual local ownership

Current front doors:

- `spec_frontend/FRONTEND-SPEC-INDEX.md`
- `spec_backend/BACKEND-SPEC-INDEX.md`
- `spec_code-quality/CODE-QUALITY-SPEC-INDEX.md`
- `spec_documentation/DOCS-SPEC-INDEX.md`
- `spec_infrastructure/INFRA-SPEC-INDEX.md`

## Cross-corpus relationship model

### Primary delivery corpora

- `spec_frontend`
- `spec_backend`
- `spec_infrastructure`

These are the corpora most likely to drive implementation semantics directly.

### Supporting governance corpora

- `spec_code-quality`
- `spec_documentation`

These support how work is reviewed, improved, verified, documented, and communicated, but they do not replace domain truth.

## Root layer role

The root layer exists to connect the corpora without replacing them.

It provides:

- identity (`README.md`)
- routing and sequencing (`OPERATING-MODEL.md`)
- structure (`ARCHITECTURE.md`)
- cross-domain intake (`CENTRAL-CHECKLIST.md`)
- evolution rules (`CONTRIBUTING.md`)

## Evidence and verification constraints

This repository currently operates as a documentation/spec corpus rather than an executable application.

Current constraints:

- the repo root is not a git repository
- the `spec_*` directories are not git repositories
- there is no project-local `package.json`
- there is no project-local `tsconfig.json`
- there is no executable project-local build/test/typecheck pipeline for the corpus itself
- Markdown LSP diagnostics are not available in this workspace

Because of that, the correct evidence model for changes in this repo is:

- structural verification with Read/Grep/Glob
- consistency checks against live file paths and corpus naming
- targeted review of ownership/routing statements
- Oracle review for final coherence on significant hardening passes
