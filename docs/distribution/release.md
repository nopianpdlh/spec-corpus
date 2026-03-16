# Release Guide

This guide details the release process for `spec-corpus` maintainers.

## How to Release a New Version

### Best-practice branch flow

Do day-to-day implementation on `dev`, but do the actual release preparation on `main`.

1. Land and verify the feature work on `dev`.
2. Merge `dev` into `main`.
3. On `main`, create the release commit that bumps the package version(s) you are actually releasing.
4. Create and push the release tag from that `main` commit.

This keeps release metadata attached to the branch that represents production history. Avoid bumping versions or creating release tags on `dev`, because tags on non-production commits make npm/GitHub releases harder to reason about.

### Release steps (run after merge to `main`)

1.  **Bump versions**: Increment the version number only in the package(s) you are releasing.
    - `packages/corpus/package.json` when the corpus payload changes
    - `packages/cli/package.json` when the CLI/runtime changes

    Keep them aligned for coordinated releases, but patch releases may target only one package.

2.  **Pack artifacts**: Run the pack commands needed for the release you are preparing.

    ```bash
    npm run pack:corpus
    npm run pack:cli
    ```

3.  **Verify release**: Run the verification script to ensure the release passes smoke tests and the public CLI path still works.

    ```bash
    npm run verify:release
    ```

4.  **Verify public UX locally**: Confirm the intended entry point is still `init`.

    ```bash
    node packages/cli/bin/spec-corpus.js --help
    node packages/cli/bin/spec-corpus.js init --dry-run
    ```

## CI Publication

The `.github/workflows/release.yml` GitHub Action handles publication automatically when a new release tag is pushed.

When a tag matching `v*` is pushed to GitHub, the workflow will:

1.  Run the pack commands.
2.  Run the release verification scripts.
3.  Publish the `packages/corpus` package to npm.
4.  Publish the `packages/cli` package to npm.

> Important: the current workflow publishes both packages together. If you need a CLI-only patch release (for example a runtime bugfix that does not change corpus contents), use a manual npm publish flow for `packages/cli` instead of the shared tag workflow.

## dist-tags

The release workflow uses npm `dist-tags`:

*   `latest`: The default tag for stable releases.
*   `beta`: Used for pre-releases.

For coordinated two-package releases, prefer the CI pipeline after all verifications pass. For a CLI-only emergency or patch release, a manual `npm publish` of `packages/cli` is acceptable after running the same verification steps locally.

## First public install expectation

After the packages are published, the intended public install flow is:

```bash
npx spec-corpus init
```

The `bootstrap` command remains supported as a compatibility/advanced command, and `--from <tarball>` remains supported for offline testing and recovery workflows.
