# spec_frontend Phase 2/3 Coverage and Governance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete `spec_frontend` by adding the missing frontend-owned baseline skills and the governance documents that make the repository usable across different production projects.

**Architecture:** Phase 2/3 extends the normalized baseline rather than rewriting it. New skills are added only for missing frontend-owned domains, and top-level governance docs summarize routing, ownership, precedence, and project adoption without duplicating each skill’s full content.

**Tech Stack:** Markdown skill files under `.agents/skills/`, governance docs at repo root, and planning docs in `docs/plans/`.

---

### Task 1: Save the Phase 2/3 design and execution record

**Files:**
- Create: `docs/plans/2026-03-14-spec-frontend-phase-2-3-design.md`
- Create: `docs/plans/2026-03-14-spec-frontend-phase-2-3-plan.md`

**Step 1: Capture the remaining gap model**

Run: read the Phase 1 design doc and the current owner skills.
Expected: confirm that analytics, SEO implementation, browser/device support, observability, external-spec integration, and governance docs are the remaining deliverables.

**Step 2: Write the design doc**

Document:
- new domain owners
- relationship to existing baseline skills
- governance doc purpose
- non-goals and expected final repo state

**Step 3: Write the implementation plan**

Include exact file paths, domain boundaries, and structural verification steps.

**Step 4: Verify docs exist and are readable**

Run: read both files back.
Expected: they match the approved finish-the-repo scope.

---

### Task 2: Add the missing frontend-owned baseline skills

**Files:**
- Create: `.agents/skills/frontend-analytics-implementation/SKILL.md`
- Create: `.agents/skills/frontend-seo-implementation/SKILL.md`
- Create: `.agents/skills/browser-device-support/SKILL.md`
- Create: `.agents/skills/frontend-observability/SKILL.md`
- Create: `.agents/skills/frontend-external-spec-integration/SKILL.md`

**Step 1: Write narrowly owned skills**

Each skill should own one missing domain and defer to existing owners where appropriate.

**Step 2: Add cross-references to current owners**

Ensure the new skills reference `frontend-design-system`, `responsive-design`, `web-accessibility`, `ui-component-patterns`, `state-management`, and `seo-audit` only where those existing skills already own the topic.

**Step 3: Keep implementation policy separate from reference/audit material**

Ensure `frontend-seo-implementation` complements `seo-audit` rather than replacing it, and that observability/analytics guidance stays frontend-owned without re-owning backend infrastructure.

**Step 4: Verify all five skills exist and are internally coherent**

Run: read the new files back and confirm each has a clear scope note, overview, workflow/pattern guidance, and boundaries.

---

### Task 3: Add governance documents for repository usability

**Files:**
- Create: `FRONTEND-SPEC-INDEX.md`
- Create: `DOMAIN-OWNERSHIP.md`
- Create: `NEW-PROJECT-CHECKLIST.md`

**Step 1: Write the repository index**

Summarize baseline owners, profiles/references, and the correct entry path for new users.

**Step 2: Write the ownership and precedence matrix**

Define which file owns each topic and what happens when local docs, appendices, and external repos overlap.

**Step 3: Write the project adoption checklist**

Turn the repository into a practical onboarding baseline for a new frontend project.

**Step 4: Verify the governance docs coordinate rather than duplicate**

Run: re-read the docs and confirm they route correctly instead of restating every underlying skill.

---

### Task 4: Run the final structural verification sweep

**Files:**
- Verify all new files created in Tasks 1–3

**Step 1: Confirm the new files exist**

Run searches/globs for:
- `docs/plans/2026-03-14-spec-frontend-phase-2-3-design.md`
- `docs/plans/2026-03-14-spec-frontend-phase-2-3-plan.md`
- `.agents/skills/frontend-analytics-implementation/SKILL.md`
- `.agents/skills/frontend-seo-implementation/SKILL.md`
- `.agents/skills/browser-device-support/SKILL.md`
- `.agents/skills/frontend-observability/SKILL.md`
- `.agents/skills/frontend-external-spec-integration/SKILL.md`
- `FRONTEND-SPEC-INDEX.md`
- `DOMAIN-OWNERSHIP.md`
- `NEW-PROJECT-CHECKLIST.md`

Expected: every file exists exactly once.

**Step 2: Confirm governance coverage**

Search for headings and owner references so the governance docs clearly cover indexing, ownership, precedence, and project adoption.

**Step 3: Confirm the baseline is now self-coordinating**

Re-read the index and ownership docs plus a sample of the new skills to verify that the repo now explains how to use itself.

**Step 4: Run diagnostics where supported**

Run language-server diagnostics on modified files if available.
Expected: zero diagnostics, or explicit note that markdown diagnostics are unavailable in this workspace.

**Step 5: Record the completion report**

Report:
- what was added
- what ownership model is now in place
- what verification was run
- any small follow-up issues that remain outside the committed Phase 2/3 scope
