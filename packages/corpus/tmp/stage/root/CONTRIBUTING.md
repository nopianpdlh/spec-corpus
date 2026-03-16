# Contributing

This repository evolves by hardening reusable domain corpora, not by accumulating random imported skills.

## Contribution principles

1. Preserve one-owner-per-domain.
2. Keep companions and process utilities explicitly non-owning.
3. Add governance before adding volume.
4. Normalize only the parts that create ambiguity, contradiction, or misleading metadata.
5. Align lockfile metadata with reality when a skill becomes materially local.

## Expected corpus shape

A mature corpus should contain:

- an index/front-door doc
- `DOMAIN-OWNERSHIP.md`
- `NEW-PROJECT-CHECKLIST.md`
- canonical owners with bounded scope
- companion/process-only skills where justified
- truthful `skills-lock.json` metadata

## Hardening workflow

Use the same workflow that shaped the existing corpora:

1. review the raw/imported corpus
2. identify missing governance, overlap, contradictions, and misleading metadata
3. create the governance shell
4. normalize only the skills that need clearer local ownership or boundaries
5. keep imported companions only when they remain intentionally non-owning
6. align lockfiles and short metadata with the new reality
7. verify with structural checks and, for significant changes, Oracle review

## Adding a new corpus

A new corpus should only be added when:

- it owns a real domain not already covered cleanly,
- the boundary can be stated clearly,
- it can follow the same governance pattern as the existing corpora.

At minimum, a new corpus should ship with:

- a front-door index
- `DOMAIN-OWNERSHIP.md`
- `NEW-PROJECT-CHECKLIST.md`
- clear owner vs companion classification

## Owner vs companion rules

### Canonical owner

A canonical owner:

- owns a specific domain,
- defines how work in that domain should be approached,
- must not silently redefine adjacent domains.

### Companion or process-only skill

A companion/process skill:

- helps work happen,
- may supply workflow or specialized context,
- must not be treated as the default owner of broad policy or semantics.

## Lockfile policy

If a skill is materially rewritten into a local owner, its lockfile entry should become:

- local file path source
- `sourceType: "local"`
- `computedHash: "local-managed"`

If a skill remains intentionally imported and non-owning, its imported metadata may remain.

## Root-layer contribution rule

Root docs must stay focused on:

- repository identity,
- routing,
- sequencing,
- cross-corpus structure,
- contribution/evolution rules.

They must not become a new mega-spec that duplicates domain truth from inside the corpora.
