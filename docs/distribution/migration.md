# Migration Guide

If you currently clone or copy this repository manually into your projects, this guide will help you migrate to the new `spec-corpus` npm distribution system.

## Steps to Migrate

1.  **Remove Manually Copied Files**: Delete the `spec-corpus` directory you previously copied into your project manually.
2.  **Run Init**: Use the CLI to install the corpus directly into your project from the npm registry:

    ```bash
    npx spec-corpus init
    ```

    If you prefer an explicit target path:

    ```bash
    npx spec-corpus init --target "./"
    ```

3.  **Update Gitignore**: Add the snapshots directory to your `.gitignore` to prevent committing the large corpus files, while keeping the manifest (`install.json`) to track the version. Add this line:

    ```gitignore
    .spec-corpus/snapshots/
    ```

## Overriding Local Changes

If you have local modifications inside the managed snapshot and want to overwrite them with the official version, use the update flow with `--force`:

```bash
npx spec-corpus update --target "./" --force
```

## Manifest Safety

The `.spec-corpus/install.json` file is safe to commit to version control. It records the version provenance and ensures that anyone working on your project has the exact same version of the corpus when they run the init or update commands.
