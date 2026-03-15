# Bootstrapping the Corpus

This guide explains how to bootstrap the `spec-corpus` into your project.

## Installation

To install the corpus into your project, run:

```bash
npx spec-corpus bootstrap --target "./"
```

If you are using a local tarball (for testing), you can specify it with `--from`:

```bash
npx spec-corpus bootstrap --target "./" --from path/to/tarball.tgz
```

## What Gets Created

The bootstrap command initializes the following layout in your target directory:

*   `.spec-corpus/`: The main directory containing all corpus data.
*   `.spec-corpus/install.json`: A manifest file recording the installed version, provenance, and configuration.
*   `.spec-corpus/snapshots/`: A directory containing the actual corpus snapshots.

## Idempotency Guarantee

The bootstrap command is idempotent. Running it multiple times will not duplicate files or break your installation. If the corpus is already installed and up to date, it will exit cleanly without making changes.

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
