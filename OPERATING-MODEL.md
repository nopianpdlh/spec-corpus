# Operating Model

This repository is a dispatch layer over five governed corpora.

Its purpose is to help an agent or engineer decide:

1. where to start,
2. which corpus owns the work,
3. what order to read,
4. how to handle overlap.

## Core rules

### 1. One owner per domain

Each corpus defines its own canonical owners. At repo level, the rule is the same: route to the corpus that owns the domain first.

Examples:

- UI structure and client behavior → `spec_frontend`
- API contract and backend auth/storage/testing/publication → `spec_backend`
- review/refactor/test-strategy/performance evidence → `spec_code-quality`
- writing/changelog communication → `spec_documentation`
- runtime config/deploy/bootstrap/hardening → `spec_infrastructure`

### 2. Do not load all corpora at once

This repository is intentionally split so work can stay scoped.

Correct pattern:

1. read root docs,
2. route into the relevant corpus index,
3. read that corpus ownership/checklist docs,
4. load the specific owner skill,
5. pull in additional corpora only if the work crosses a real boundary.

Wrong pattern:

- reading every `spec_*` directory up front,
- treating companions as canonical owners,
- asking infrastructure to define backend API semantics,
- asking documentation to redefine product truth.

## Agent intake sequence

### If the task is new or ambiguous

1. Read `README.md`
2. Read `ARCHITECTURE.md`
3. Read `CENTRAL-CHECKLIST.md`
4. Choose the primary corpus
5. Read that corpus index file
6. Read that corpus `DOMAIN-OWNERSHIP.md`
7. Read that corpus `NEW-PROJECT-CHECKLIST.md` if adoption/project setup is involved
8. Open the specific owner skill(s)

### If the task is already clearly scoped

1. Identify the owning corpus
2. Read the corpus index doc
3. Read the owner skill
4. Pull in supporting corpora only when needed

### If the task spans multiple domains

Use the primary owner first, then add adjacent owners deliberately.

Examples:

- build a login flow API → `spec_backend` first, then `spec_infrastructure` if runtime/deploy concerns appear, then `spec_documentation` if consumer docs/changelog are required
- launch a new UI surface backed by an API → `spec_frontend` and `spec_backend`, then `spec_code-quality` for review/testing/perf gates
- write a migration or release note → `spec_documentation` first, then the domain owner that defines the underlying change

## Cross-corpus overlap rules

### Frontend vs Backend

- `spec_backend` owns consumer-facing backend contract semantics.
- `spec_frontend` owns how the client consumes and presents those semantics.

### Backend vs Infrastructure

- `spec_backend` owns what the service means.
- `spec_infrastructure` owns how it is configured, deployed, bootstrapped, and hardened.

### Domain corpora vs Code Quality

- domain corpora own the behavior and semantics.
- `spec_code-quality` owns how changes are reviewed, tested, refactored, and optimized.

### Domain corpora vs Documentation

- domain corpora own truth.
- `spec_documentation` owns how that truth is written, packaged, and communicated.

## Gaps and escalation

If the correct owner is unclear:

1. read the relevant corpus `DOMAIN-OWNERSHIP.md` files,
2. identify the nearest canonical owner,
3. treat companions/process utilities as non-owning,
4. document the ambiguity,
5. if the gap is recurring, add it back to the corpus governance in a later hardening pass.

## Phased usage model

### Intake / new project

- start at `CENTRAL-CHECKLIST.md`
- activate only the corpora relevant to the project

### Design / planning

- read the primary corpus index and ownership doc
- choose the owner skills for the planned work

### Implementation

- work from the owner skill outward
- only add adjacent corpora when a real boundary is crossed

### Review / hardening

- bring in `spec_code-quality`
- bring in `spec_documentation` if communication or docs are part of the deliverable
- bring in `spec_infrastructure` if runtime/deploy/bootstrap/hardening is affected
