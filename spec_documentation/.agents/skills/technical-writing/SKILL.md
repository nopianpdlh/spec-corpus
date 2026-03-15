---
name: technical-writing
description: Own documentation authoring quality and structure. Use when deciding how a document should be written, organized, reviewed, and maintained without redefining the system truth owned elsewhere.
allowed-tools: Read Write Edit Glob Grep
metadata:
  tags: technical-writing, documentation, structure, maintenance, audience
  platforms: Claude, ChatGPT, Gemini, Codex
---

# Technical Writing

`technical-writing` is the canonical documentation owner.

It owns document purpose, audience, structure, terminology discipline, navigation, and maintenance expectations. It does **not** own the underlying product/API/platform/security truth being described.

## Use this skill when

- writing a spec, runbook, onboarding guide, operator guide, or architecture note
- deciding how a document should be organized for its audience
- tightening terminology and structure across a doc set
- reviewing whether a document is clear, current, and maintainable

## Do not use this skill as

- a replacement for backend/frontend/platform/security ownership
- an excuse to invent undocumented requirements
- a reason to treat slide decks or changelogs as the default documentation owner

## Authoring loop

### 1. Identify document intent

Capture:

- audience
- purpose
- source-of-truth owners for the system being described
- what action the reader must be able to take afterward

### 2. Choose the right structure

Common structures:

- **spec / design doc** — problem, goals, decisions, constraints, rollout, open questions
- **runbook / operator guide** — symptoms, prerequisites, diagnosis, recovery, escalation
- **onboarding / contributor guide** — prerequisites, setup, common workflows, troubleshooting
- **reference doc** — stable lookup information, contracts, terminology, limits, examples

Do not mix all document types into one giant file unless the audience truly needs that.

### 3. Write with ownership discipline

Every substantial document should make these things obvious:

- what it covers
- what it deliberately does not cover
- which external repo/doc owns semantic truth
- when the document must be updated

### 4. Optimize for retrieval and maintenance

Prefer:

- direct headings
- short sections with a single purpose
- consistent terms
- examples only where they clarify the rule
- explicit links to canonical owners instead of copied truth

### 5. Review for reader usefulness

Check whether the reader can:

- find the relevant section quickly
- distinguish requirements from examples
- tell when a doc is stale
- identify the real source of system truth

## Documentation review template

```markdown
## Documentation Review

### Audience and purpose
- intended readers:
- job this document helps them do:

### Structure
- appropriate doc type?: yes/no
- major sections present:

### Ownership
- semantic source of truth linked?: yes/no
- non-owned areas explicitly bounded?: yes/no

### Maintenance
- freshness expectation clear?: yes/no
- likely drift points:
```

## Boundary rules

- If the main question is **how documentation should be written and structured**, `technical-writing` owns it.
- If the main question is **how shipped changes are communicated**, use `../changelog-maintenance/SKILL.md`.
- If the output is a deck or presentation artifact, use `../presentation-builder/SKILL.md` as a companion.
- If the concern is isolated git workflow, `../using-git-worktrees/SKILL.md` is process support only.

## Common documentation failures

- copying semantic details from another source and letting them drift
- mixing runbook/spec/changelog content into one undifferentiated file
- writing for “everyone” and helping no one
- hiding required prerequisites or escalation paths
- using examples that look normative when they are only illustrative

## Delivery checklist

- [ ] audience and purpose are explicit
- [ ] correct doc shape chosen
- [ ] canonical semantic owner linked
- [ ] scope boundaries are clear
- [ ] maintenance expectations are named
