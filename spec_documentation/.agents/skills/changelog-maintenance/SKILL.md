---
name: changelog-maintenance
description: Own release communication and change history. Use when documenting what changed, how it affects readers, and what migration or deprecation guidance must accompany a release.
metadata:
  tags: changelog, release-notes, migration, deprecation, documentation
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Changelog Maintenance

`changelog-maintenance` is the canonical documentation owner for release communication.

It owns changelog structure, release-note clarity, deprecation visibility, and migration guidance for readers. It does **not** redefine the actual behavior of the system or decide whether a release is approved.

## Use this skill when

- preparing a release note or changelog entry
- explaining user-visible, operator-visible, or integrator-visible changes
- documenting deprecations and migrations
- tightening how changes are classified and surfaced over time

## Release communication loop

### 1. Gather grounded change input

Capture from source owners:

- what actually changed
- who is affected
- whether the change is additive, behavioral, deprecated, removed, fixed, or security-relevant
- what action readers must take

### 2. Classify changes for readers

Typical categories:

- Added
- Changed
- Fixed
- Deprecated
- Removed
- Security

Use categories that help readers understand impact, not categories copied blindly from commit history.

### 3. Write for the affected audience

Good release communication answers:

- what changed
- who should care
- whether action is required
- when an old path stops being safe
- where to find the canonical migration or domain documentation

### 4. Make deprecations actionable

If something is deprecated or removed, include:

- what replaces it
- by when consumers must move
- what breaks if they do not
- which canonical doc owns the new behavior

### 5. Keep the historical record trustworthy

Prefer:

- reverse chronological order
- dated entries
- reader-centered language
- links to the canonical docs for deeper detail

## Changelog template

```markdown
## [version] - YYYY-MM-DD

### Changed
- what changed
- who is affected

### Deprecated
- old path
- replacement
- migration deadline or expectation

### Migration
- required actions
- canonical doc links
```

## Boundary rules

- `changelog-maintenance` owns communication, not semantic truth.
- If the meaning of a change is disputed, defer to the relevant product/domain/backend/frontend/platform owner.
- If the issue is broader document quality or doc structure, pair with `../technical-writing/SKILL.md`.

## Common changelog failures

- copying commit messages directly into release notes
- announcing behavior that the canonical spec does not actually define
- saying “various fixes” or “performance improvements” with no reader value
- listing breaking changes without migration guidance
- documenting every internal refactor as if users must care

## Delivery checklist

- [ ] reader-facing impact is clear
- [ ] changes are categorized meaningfully
- [ ] migration/deprecation guidance exists where needed
- [ ] canonical owner docs are linked for semantic detail
- [ ] dates/order remain trustworthy
