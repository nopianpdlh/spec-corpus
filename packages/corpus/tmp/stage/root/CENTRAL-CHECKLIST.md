# Central Checklist

Use this file when starting a new project, new product surface, or major cross-domain workstream.

This is an intake and routing checklist. It does **not** replace the domain-level checklists inside each corpus.

## Step 1: Identify the project shape

Confirm which of these are in scope:

- frontend UI / responsive behavior / accessibility / SEO / analytics
- backend API / auth / storage / backend verification / API publication
- runtime configuration / deployment / bootstrap / infra hardening
- code review / refactoring / test-strategy / performance optimization
- documentation / changelog / release communication / presentations

## Step 2: Activate only the relevant corpora

Route the project deliberately:

- frontend-heavy work → `spec_frontend`
- service/API-heavy work → `spec_backend`
- deploy/runtime/bootstrap-heavy work → `spec_infrastructure`
- quality-gate/review/test/performance-heavy work → `spec_code-quality`
- doc/changelog/release-note/presentation-heavy work → `spec_documentation`

Do **not** activate a corpus just because it exists. Activate it because the work actually crosses that boundary.

## Step 3: Open the corpus-level checklist

Once a corpus is activated, open its own project checklist:

- frontend → `spec_frontend/NEW-PROJECT-CHECKLIST.md`
- backend → `spec_backend/NEW-PROJECT-CHECKLIST.md`
- code quality → `spec_code-quality/NEW-PROJECT-CHECKLIST.md`
- documentation → `spec_documentation/NEW-PROJECT-CHECKLIST.md`
- infrastructure → `spec_infrastructure/NEW-PROJECT-CHECKLIST.md`

## Step 4: Confirm cross-domain seams early

Before implementation, confirm:

- where API truth is owned
- where UI behavior is owned
- where runtime config is owned
- where deployment decisions are owned
- where test/review/performance evidence is expected
- where documentation and change communication are owned

If a seam is unclear, go to the relevant `DOMAIN-OWNERSHIP.md` before continuing.

## Step 5: Choose the first owner skill

Examples:

- new dashboard page → start in `spec_frontend`
- new login API → start in `spec_backend`
- environment variable model → start in `spec_infrastructure`
- refactor risky module → start in `spec_code-quality`
- write release note or migration note → start in `spec_documentation`

## Step 6: Add adjacent corpora only when needed

Typical combinations:

- frontend + backend
- backend + infrastructure
- any domain + code quality
- any domain + documentation

If the work is still single-domain, keep it single-domain.
