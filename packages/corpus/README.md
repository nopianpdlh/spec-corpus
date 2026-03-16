# @spec-corpus/corpus

`@spec-corpus/corpus` is the content payload package consumed by the `spec-corpus` CLI.

## Purpose

- Contains curated corpus content under `dist/`
- Ships `release-manifest.json` for deterministic integrity checks
- Not intended as a direct end-user command package

## Typical usage

Most users should use the CLI package:

```bash
npx spec-corpus init
```

The CLI resolves and installs this package automatically.
