# npm README Strategy

This project publishes two npm packages:

- `spec-corpus` (CLI)
- `@spec-corpus/corpus` (payload)

## Important behavior

npm package pages refresh README content **when a new version is published**.
Updating README files in git alone does not update npm package pages.

Reference: https://docs.npmjs.com/about-package-readme-files

## Repository policy

1. Keep package-specific README at each package root:
   - `packages/cli/README.md`
   - `packages/corpus/README.md`
2. Ensure each package includes README in `files` allowlist (or default packing behavior).
3. Any meaningful README update intended for npm package page must be paired with a version bump + publish.

## Release checklist snippet

- [ ] README updates finalized in `packages/*/README.md`
- [ ] Corresponding package version bumped
- [ ] `npm pack --workspace=packages/cli --dry-run` contains `README.md`
- [ ] `npm pack --workspace=packages/corpus --dry-run` contains `README.md`
- [ ] Publish/tag workflow executed
