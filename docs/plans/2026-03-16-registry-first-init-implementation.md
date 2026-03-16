# Registry-First Init Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade `spec-corpus` into a production-grade public npm product with registry-first installation and `npx spec-corpus init` as the default user entry point.

**Architecture:** Keep the current snapshot/install-record safety model, but move tarball resolution into a shared runtime helper that can fetch a corpus tarball from the npm registry by shelling out to npm itself. Add `init` as the friendly front door, keep `bootstrap` as a compatibility alias, and harden package metadata/docs so the published experience matches real runtime behavior.

**Tech Stack:** Plain Node.js ESM, npm CLI, node:test, GitHub Actions, no external runtime dependencies.

---

### Task 1: Add failing parser and UX tests for `init`

**Files:**
- Modify: `packages/cli/test/cli-args.test.mjs`

**Step 1: Write the failing test**

Add tests that assert:
- `COMMANDS` contains `init`
- `parseArgs(['init'])` resolves `command === 'init'`
- `init` allows omitted `--target` and defaults to `.`
- usage text promotes `init` as the primary install command

**Step 2: Run test to verify it fails**

Run: `node --test packages/cli/test/cli-args.test.mjs`
Expected: FAIL because `init` is not yet recognized.

**Step 3: Write minimal implementation**

Modify `packages/cli/src/cli-args.mjs` to:
- add `init` to `COMMANDS`
- default `target` to `.` for `init` only when omitted
- update usage/help text to show `init` first

**Step 4: Run test to verify it passes**

Run: `node --test packages/cli/test/cli-args.test.mjs`
Expected: PASS.

### Task 2: Add failing command tests for registry-first install

**Files:**
- Modify: `packages/cli/test/e2e/bootstrap-empty.test.mjs`
- Modify: `packages/cli/test/e2e/offline-tarball.test.mjs`
- Create: `packages/cli/test/e2e/init-registry.test.mjs`

**Step 1: Write the failing tests**

Cover:
- `runBootstrap({ from: null })` no longer errors when registry resolution succeeds
- `runUpdate({ from: null })` no longer errors when registry resolution succeeds
- `runInit({ target: ... })` behaves like first-install UX and reports `command: "init"`
- dry-run for `init` reports registry as default source

Use subprocess or controlled environment variables to point registry resolution at a local tarball fixture, so tests remain deterministic and do not require network.

**Step 2: Run tests to verify they fail**

Run: `node --test packages/cli/test/e2e/bootstrap-empty.test.mjs packages/cli/test/e2e/offline-tarball.test.mjs packages/cli/test/e2e/init-registry.test.mjs`
Expected: FAIL because registry flow and `init` do not exist yet.

**Step 3: Write minimal implementation**

Implement shared tarball resolution that:
- accepts local tarball via `--from`
- otherwise acquires a tarball from npm registry via `npm pack @spec-corpus/corpus[@version]`
- supports a deterministic test override via environment variable for local fixture tarballs

**Step 4: Run tests to verify they pass**

Run the same test command.
Expected: PASS.

### Task 3: Implement shared registry resolution and `init` command

**Files:**
- Create: `packages/cli/src/resolve-corpus-tarball.mjs`
- Create: `packages/cli/src/commands/init.mjs`
- Modify: `packages/cli/bin/spec-corpus.js`
- Modify: `packages/cli/src/commands/bootstrap.mjs`
- Modify: `packages/cli/src/commands/update.mjs`

**Step 1: Write or extend tests first**

Add focused expectations for:
- registry resolution output path exists
- `init` forwards to bootstrap semantics but emits `command: "init"`
- bootstrap/update continue to preserve `installSource`

**Step 2: Run focused tests to verify failure**

Run the targeted e2e tests from Task 2.

**Step 3: Write minimal implementation**

Implement:
- shared resolver using npm CLI, temporary working dir, and cleanup
- `init` wrapper that defaults target to `.` and uses registry-first behavior
- dispatcher updates so `init` is a top-level command
- bootstrap/update to call shared resolver instead of local stub logic

**Step 4: Run focused tests to verify pass**

Run the targeted e2e tests again.

### Task 4: Harden publish metadata and documentation

**Files:**
- Modify: `packages/cli/package.json`
- Modify: `packages/corpus/package.json`
- Modify: `docs/distribution/bootstrap.md`
- Modify: `docs/distribution/migration.md`
- Modify: `docs/distribution/release.md`
- Modify: `.github/workflows/ci.yml`

**Step 1: Write failing coverage/tests where practical**

If necessary, extend existing smoke/help tests to assert:
- `--help` shows `init`
- docs examples match registry-first UX language

**Step 2: Run tests or dry-run pack checks to verify current mismatch**

Run:
- `node --test packages/cli/test/cli-args.test.mjs packages/cli/test/e2e/release-smoke.test.mjs`
- `npm pack --workspace=packages/cli --dry-run`
- `npm pack --workspace=packages/corpus --dry-run`

Expected: reveals current metadata/help mismatch.

**Step 3: Write minimal implementation**

Update package metadata to remove or correct broken `exports`, refresh docs to make `init` and registry-first flow the official path, and ensure CI matches the repository default branch.

**Step 4: Re-run checks**

Run the same pack/help commands and confirm clean output.

### Task 5: Full verification and release readiness

**Files:**
- Review only: modified files above

**Step 1: Run diagnostics**

Run LSP diagnostics on every modified file.

**Step 2: Run targeted and broad tests**

Run:
- `node --test packages/cli/test/cli-args.test.mjs`
- `node --test packages/cli/test/e2e/bootstrap-empty.test.mjs packages/cli/test/e2e/offline-tarball.test.mjs packages/cli/test/e2e/init-registry.test.mjs`
- `node --test packages/cli/test/e2e/verify-clean.test.mjs packages/cli/test/e2e/dirty-state.test.mjs packages/cli/test/e2e/update-clean.test.mjs packages/cli/test/e2e/update-force.test.mjs packages/cli/test/e2e/recovery.test.mjs packages/cli/test/e2e/invalid-version.test.mjs packages/cli/test/e2e/release-smoke.test.mjs`
- `node --test packages/corpus/test/release-manifest.schema.test.mjs packages/corpus/test/build-snapshot.test.mjs packages/corpus/test/pack-smoke.test.mjs packages/cli/test/install-record.schema.test.mjs packages/cli/test/status-contract.test.mjs`
- `npm run verify:release`

**Step 3: Review publish readiness**

Confirm:
- `npm view` still shows unpublished (expected before release)
- release workflow is ready for tag-based publication
- docs now match real product UX

**Step 4: Report**

Provide a final report covering product UX, registry behavior, remaining caveats, and exact publish steps.
