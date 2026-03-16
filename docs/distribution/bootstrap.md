# Initializing the Corpus

This guide explains how to initialize the `spec-corpus` into your project using the public CLI UX.

## Recommended install path

The primary user-facing command is:

```bash
npx spec-corpus init
```

This installs into the current directory and resolves the corpus package from the npm registry by default.

If you want to install into another directory:

```bash
npx spec-corpus init --target "./my-project"
```

## Advanced install paths

The legacy `bootstrap` command still works and is kept for compatibility:

```bash
npx spec-corpus bootstrap --target "./"
```

If you are using a local tarball (for testing, offline install, or release QA), you can specify it with `--from`:

```bash
npx spec-corpus init --target "./" --from path/to/tarball.tgz
```

## What Gets Created

The init/bootstrap command initializes the following layout in your target directory:

*   `.spec-corpus/`: The main directory containing all corpus data.
*   `.spec-corpus/install.json`: A manifest file recording the installed version, provenance, and configuration.
*   `.spec-corpus/release-manifest.json`: Integrity manifest used by `status`/`verify`/`update` checks.
*   `.spec-corpus/spec_*`: Domain corpus directories (backend/frontend/docs/code-quality/infrastructure).

Fresh installs now use **flat layout v2** and do **not** create `.spec-corpus/snapshots/`.

## Idempotency guarantee

The install command is idempotent. Running it multiple times will not duplicate files or break your installation. If the corpus is already installed and up to date, it will exit cleanly without making changes.

## Verification

To verify that your installation is intact and matches the expected manifest, run:

```bash
npx spec-corpus verify --target "./"
```

## Checking Status

To check the current status of your installation, including the installed version and any detected issues, run:

```bash
npx spec-corpus status --target "./"
```

## Update flow

To move an existing project to a newer published corpus version:

```bash
npx spec-corpus update --target "./"
```

If the managed snapshot has local changes, update will stop and print a conflict report. Use `--force` only when you intentionally want to discard those local changes.
