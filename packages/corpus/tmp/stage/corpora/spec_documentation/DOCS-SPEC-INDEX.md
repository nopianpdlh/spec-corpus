# Documentation Spec Index

`spec_documentation` is the reusable baseline for authoring, maintaining, and packaging project documentation without silently taking ownership of the underlying product or technical domains.

Use this file as the entry point for the documentation corpus after routing from the root docs.

## How to Read This Repo

There are three layers:

1. **Canonical documentation owners** — the skills that define writing standards and release-communication expectations.
2. **Supporting companions** — specialized or process-oriented skills that help documentation work happen, but do not own documentation policy broadly.
3. **Governance docs** — documents that explain precedence, adoption, and safe reuse.

If two docs appear to overlap, use `DOMAIN-OWNERSHIP.md` to resolve precedence.

## Canonical Documentation Owners

| Domain | Owner | Use for |
|---|---|---|
| Documentation authoring and structure | `.agents/skills/technical-writing/SKILL.md` | audience, purpose, structure, terminology, maintenance expectations, doc review quality |
| Release communication and change visibility | `.agents/skills/changelog-maintenance/SKILL.md` | changelogs, release notes, deprecation/migration communication, operator/user-facing change summaries |

## Supporting Companions

| Skill | Role |
|---|---|
| `.agents/skills/presentation-builder/SKILL.md` | specialist companion for slide-deck and presentation artifact creation |
| `.agents/skills/using-git-worktrees/SKILL.md` | workflow utility for isolated doc work; not a documentation-domain owner |

## Owner Relationship Summary

- `technical-writing` owns how documentation is written and structured.
- `changelog-maintenance` owns how shipped changes are communicated over time.
- `presentation-builder` helps package information for presentations, but does not redefine documentation standards.
- `using-git-worktrees` helps contributors isolate work; it does not own documentation policy.

## Recommended Reading Order

1. `DOMAIN-OWNERSHIP.md`
2. `NEW-PROJECT-CHECKLIST.md`
3. `technical-writing`
4. `changelog-maintenance` if the project ships user-visible changes over time
5. `presentation-builder` when a presentation artifact is required
6. `using-git-worktrees` when contributors need isolated workspaces

## What This Repo Does Not Own

`spec_documentation` does **not** replace:

- product requirements or domain truth
- frontend/backend/platform/security policy ownership
- source-of-truth API or runtime semantics
- release approval authority

It owns how information is documented and communicated, not what the underlying systems mean.
