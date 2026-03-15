# Release Guide

This guide details the release process for `spec-corpus` maintainers.

## How to Release a New Version

1.  **Bump Version**: Increment the version number in `packages/corpus/package.json` according to semantic versioning rules.
2.  **Pack Corpus**: Run the pack command to build the distribution tarball.

    ```bash
    npm run pack:corpus
    ```

3.  **Verify Release**: Run the verification script to ensure the new version passes all smoke tests and builds successfully.

    ```bash
    npm run verify:release
    ```

## CI Publication

The `.github/workflows/release.yml` GitHub Action handles the publication automatically when a new release tag is pushed.

When a tag matching `v*` is pushed to GitHub, the workflow will:

1.  Run the pack command.
2.  Run the release verification scripts.
3.  Publish the `packages/corpus` package to npm.
4.  Publish the `packages/cli` package to npm.

## dist-tags

The release workflow uses npm `dist-tags`:

*   `latest`: The default tag for stable releases.
*   `beta`: Used for pre-releases.

Do NOT publish from your local machine. All publications must happen via the CI pipeline after all verifications pass.
