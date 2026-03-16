# spec_frontend Phase 1 Normalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Normalize `spec_frontend` into a coherent reusable frontend baseline by removing cross-skill contradictions, clarifying ownership, and scoping stack-specific skills.

**Architecture:** Phase 1 updates the existing skill corpus in place rather than rewriting it. The work keeps strong existing guidance, but makes baseline ownership explicit, reduces overlap, and scopes stack-specific material to the profiles where it actually applies.

**Tech Stack:** Markdown skill files under `.agents/skills/`, plus planning docs in `docs/plans/`.

---

### Task 1: Save the design and execution record

**Files:**
- Create: `docs/plans/2026-03-14-spec-frontend-phase-1-normalization-design.md`
- Create: `docs/plans/2026-03-14-spec-frontend-phase-1-normalization-plan.md`

**Step 1: Capture the current structural problem**

Run: repository read-through of the Phase 1 target skills.
Expected: identify the exact contradictions already documented in the audit (fonts, ref strategy, px guidance, immutability wording, accessibility ownership, broken references, placeholders).

**Step 2: Write the design doc**

Document:
- the normalization goal
- the ownership model
- the Phase 1 scope and non-goals
- the expected post-normalization repo state

**Step 3: Write the implementation plan**

Include exact file paths, the normalization sequence, and structural verification steps.

**Step 4: Verify docs exist and are readable**

Run: read both files back.
Expected: the docs clearly describe Phase 1 and match the approved Approach B strategy.

---

### Task 2: Normalize baseline ownership and rule wording

**Files:**
- Modify: `.agents/skills/frontend-design/SKILL.md`
- Modify: `.agents/skills/frontend-design-system/SKILL.md`
- Modify: `.agents/skills/web-accessibility/SKILL.md`

**Step 1: Surface the conflicting baseline rules**

Run: search for the current absolute font wording, `transition: all`, and duplicated accessibility checklist ownership.
Expected: find the exact lines that currently make the baseline inconsistent.

**Step 2: Apply the minimal ownership fixes**

Change the files so that:
- `frontend-design` owns visual direction, but allows neutral/system body fonts when intentionally chosen
- `frontend-design-system` owns tokens/layout/motion defaults
- `web-accessibility` is explicitly the accessibility source of truth

**Step 3: Align examples with the written rules**

Replace `transition: all` with property-scoped transitions and reduce accessibility re-ownership inside `frontend-design-system`.

**Step 4: Verify the contradictions are removed**

Run: search the updated files for the removed contradiction markers.
Expected: no remaining baseline conflict between the three files on font policy, motion defaults, or accessibility ownership.

---

### Task 3: Align implementation guidance with real frontend practice

**Files:**
- Modify: `.agents/skills/responsive-design/SKILL.md`
- Modify: `.agents/skills/state-management/SKILL.md`
- Modify: `.agents/skills/ui-component-patterns/SKILL.md`

**Step 1: Capture the example/rule mismatches**

Run: search for px-heavy examples, direct-mutation wording, placeholder markers, inline object/function prohibitions, and `forwardRef` assumptions.
Expected: reproduce the mismatches documented in the audit.

**Step 2: Normalize the written rules**

Update the files so that:
- responsive guidance prefers relative units for scalable layout values while allowing px for breakpoints and edge-case measurements
- state-management distinguishes plain-state mutation from valid Redux Toolkit/Immer reducer syntax
- component patterns become React-version-aware rather than universally `forwardRef`-based

**Step 3: Fix structural issues**

Replace placeholder sections with real examples, remove out-of-repo related-skill references, and repair the accessibility-unsafe dropdown example.

**Step 4: Verify examples now support the rules**

Run: re-read the updated sections and confirm the examples no longer undermine the prose.

---

### Task 4: Scope stack-specific and external-validator skills correctly

**Files:**
- Modify: `.agents/skills/tailwind-design-system/SKILL.md`
- Modify: `.agents/skills/vercel-react-best-practices/SKILL.md`
- Modify: `.agents/skills/ui-ux-pro-max/SKILL.md`
- Modify: `.agents/skills/web-design-guidelines/SKILL.md`

**Step 1: Identify universal-sounding statements that should be scoped**

Run: search for absolute rules like `Don't use forwardRef`, `Don't use tailwind.config.ts`, and React Native-only assumptions.
Expected: find the lines that currently overstate scope.

**Step 2: Add scope notes and tighten wording**

Update the files so that:
- `tailwind-design-system` is clearly a Tailwind v4 + React 19 profile
- `vercel-react-best-practices` is clearly a React/Next/Vercel appendix
- `ui-ux-pro-max` is clearly a broad heuristic/reference source with mobile bias
- `web-design-guidelines` is clearly an external validator wrapper rather than internal authority

**Step 3: Preserve value while removing ambiguity**

Do not flatten specialized skills into generic guidance; instead, make their assumptions explicit.

**Step 4: Verify stack-specific assumptions are now scoped**

Run: re-read the top sections and changed rule tables.
Expected: the files remain useful, but no longer read as universal baseline owners.

---

### Task 5: Run the structural verification sweep

**Files:**
- Verify all modified files from Tasks 1–4

**Step 1: Search for known leftover markers**

Run searches for:
- `transition: all`
- `../../creative-media/image-generation/SKILL.md`
- `../../backend/backend-testing/SKILL.md`
- `<!-- Add example content here -->`
- `this project's only tech stack`

Expected: none of those markers remain in the normalized files.

**Step 2: Re-read changed sections**

Confirm that the updated files now communicate:
- clear ownership
- scoped stack assumptions
- rule/example consistency

**Step 3: Run diagnostics where supported**

Run language-server diagnostics on modified files if available.
Expected: zero diagnostics, or explicit note that markdown diagnostics are unavailable in this workspace.

**Step 4: Record verification outcome**

Report exactly what was checked and whether any known issues remain for Phase 2.
