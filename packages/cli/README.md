# spec-corpus

`spec-corpus` is the CLI entrypoint for installing and maintaining the engineering corpus in your project.

## Quick start

```bash
npx spec-corpus init
```

This installs `.spec-corpus/` into your current directory using flat layout v2.

## Common commands

```bash
# Install into current directory
npx spec-corpus init

# Update to latest published corpus
npx spec-corpus update

# Check install status and integrity hint
npx spec-corpus status

# Full integrity verification
npx spec-corpus verify
```

## Expected installed layout

```text
.spec-corpus/
  install.json
  release-manifest.json
  README.md
  spec_backend/
  spec_frontend/
  ...
```

## Troubleshooting

- If `init`/`update` fails to resolve registry tarball, ensure npm can access `@spec-corpus/corpus`.
- If `update` is blocked by local changes, run `npx spec-corpus verify` and resolve conflicts, or use `--force` intentionally.
