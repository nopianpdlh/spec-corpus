# Release Guide

This guide details the release process for `spec-corpus` maintainers.

## How to Release a New Version

1.  **Bump versions**: Increment the version number in:
    - `packages/corpus/package.json`
    - `packages/cli/package.json`

    Keep them aligned unless you intentionally want different release cadences.

2.  **Pack artifacts**: Run the pack commands to build both publishable tarballs.

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

The `.github/workflows/release.yml` GitHub Action handles the publication automatically when a new release tag is pushed.

When a tag matching `v*` is pushed to GitHub, the workflow will:

1.  Run the pack commands.
2.  Run the release verification scripts.
3.  Publish the `packages/corpus` package to npm.
4.  Publish the `packages/cli` package to npm.

## dist-tags

The release workflow uses npm `dist-tags`:

*   `latest`: The default tag for stable releases.
*   `beta`: Used for pre-releases.

Do NOT publish from your local machine. All publications should happen via the CI pipeline after all verifications pass.

## First public install expectation

After the packages are published, the intended public install flow is:

```bash
npx spec-corpus init
```

The `bootstrap` command remains supported as a compatibility/advanced command, and `--from <tarball>` remains supported for offline testing and recovery workflows.
