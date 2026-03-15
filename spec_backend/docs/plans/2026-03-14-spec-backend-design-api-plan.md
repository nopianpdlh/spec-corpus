# spec_backend design-api and governance normalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Normalize `spec_backend` into a coherent reusable backend baseline by preserving `design-api` as the canonical contract owner, adding repo-level governance docs, and tightening the adjacent backend skills around explicit ownership boundaries.

**Architecture:** The repository already has a meaningful backend corpus, so this implementation adds a thin governance shell rather than a large rewrite. The work updates the original bootstrap documents, adds root navigation/ownership/checklist docs, and rewrites the template-shaped skills so each domain has a clear role without overriding `design-api`.

**Tech Stack:** Markdown documents under `docs/plans/`, root governance docs, `.agents/skills/`, and `skills-lock.json`.

---

### Task 1: Add the backend governance shell

**Files:**
- Create: `BACKEND-SPEC-INDEX.md`
- Create: `DOMAIN-OWNERSHIP.md`
- Create: `NEW-PROJECT-CHECKLIST.md`

**Steps:**

1. Write the root index so readers know which backend skills are canonical owners and how to enter the corpus.
2. Write the ownership doc so precedence between `design-api`, auth, database, testing, and documentation is explicit.
3. Write the adoption checklist so new projects make contract, auth, storage, verification, and publication decisions deliberately.
4. Verify by re-reading all three docs and confirming they consistently route readers to `design-api` first for contract questions.

---

### Task 2: Update the bootstrap planning docs to reflect the current corpus

**Files:**
- Modify: `docs/plans/2026-03-14-spec-backend-design-api-design.md`
- Modify: `docs/plans/2026-03-14-spec-backend-design-api-plan.md`

**Steps:**

1. Remove wording that says `spec_backend` is empty or only has a single bootstrap owner.
2. Reframe the docs as a design-api bootstrap plus governance-normalization phase.
3. Keep the original rationale for `design-api`, but update the expected repository state to match the current multi-skill corpus.
4. Verify with grep that stale bootstrap wording no longer survives in these planning docs.

---

### Task 3: Normalize the API publication skill

**Files:**
- Modify: `.agents/skills/api-documentation/SKILL.md`

**Steps:**

1. Rewrite the skill around publication/reference ownership rather than generic Swagger tutorial steps.
2. Make it explicit that `design-api` owns semantics while `api-documentation` owns publication quality and packaging.
3. Replace placeholder residue and ad-hoc payload examples with examples aligned to the canonical contract pattern.
4. Verify by re-reading the file and confirming there are no placeholders and no ownership blur.

---

### Task 4: Normalize the auth implementation skill

**Files:**
- Modify: `.agents/skills/authentication-setup/SKILL.md`

**Steps:**

1. Add explicit ownership boundaries between auth implementation and API-visible contract semantics.
2. Align examples to the `design-api` treatment of `401` versus `403` and minimal token payload rules.
3. Add service-to-service patterns, revocation/rotation, and secret-handling constraints without claiming security-policy ownership.
4. Verify by re-reading the file and confirming status semantics, token payload guidance, and related-skill references are coherent.

---

### Task 5: Normalize the backend testing skill

**Files:**
- Modify: `.agents/skills/backend-testing/SKILL.md`

**Steps:**

1. Reframe the skill around backend verification strategy rather than generic test-framework tutorial content.
2. Make contract testing explicit so implementation can be checked against `design-api`.
3. Remove scope blur that reads like frontend/UI testing governance.
4. Verify by re-reading the file and confirming contract testing, isolation rules, and backend-only boundaries are explicit.

---

### Task 6: Normalize the database schema skill

**Files:**
- Modify: `.agents/skills/database-schema-design/SKILL.md`

**Steps:**

1. Make the internal storage versus external API boundary explicit.
2. Add API-resource mapping guidance and migration-safety rules.
3. Preserve practical schema/indexing advice while removing any implication that the database schema defines the public contract.
4. Verify by re-reading the file and confirming boundary language, naming guidance, and migration rules are explicit.

---

### Task 7: Align repository metadata with the live corpus

**Files:**
- Modify: `skills-lock.json`

**Steps:**

1. Add `design-api` to the lockfile so the live corpus is represented.
2. Distinguish the local corpus-authored skill from the imported template-derived skills without redesigning the lockfile format beyond what this repo needs now.
3. Verify by re-reading the JSON and confirming the file no longer implies that only the four template-derived skills belong to `spec_backend`.

---

### Task 8: Run the structural verification sweep

**Files:**
- Verify all files touched in Tasks 1–7

**Steps:**

1. Read the three new governance docs.
   - Expected: they exist and consistently describe the same owner model.
2. Grep `docs/plans/*.md` for stale phrases such as `currently empty`, `repository is empty`, `single canonical owner`, and `bootstrap` where they no longer fit.
   - Expected: no misleading bootstrap-only wording remains.
3. Read the four normalized skill files.
   - Expected: each contains explicit ownership boundaries, and `design-api` remains the contract owner.
4. Grep the backend skill corpus for placeholder residue and broken local references.
   - Expected: no `Add example content here` comments or broken `../api-design/...` style links remain.
5. Read `skills-lock.json`.
   - Expected: `design-api` appears and the lockfile reflects the real corpus.
6. Check whether the repo contains build/test/typecheck tooling.
   - Expected: if not present, report structural verification as the correct evidence model.
