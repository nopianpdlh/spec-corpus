# Distribution Layout v2 (Flat `.spec-corpus`)

This document defines the canonical runtime layout for `spec-corpus` CLI starting in layout version 2.

## Canonical install layout (v2)

Fresh installs and updates MUST produce this structure:

```text
.spec-corpus/
  install.json
  release-manifest.json
  README.md
  ARCHITECTURE.md
  ...other root docs...
  spec_backend/
  spec_frontend/
  spec_documentation/
  spec_code-quality/
  spec_infrastructure/
```

## Metadata contract

- `.spec-corpus/install.json` remains the install state file.
- `.spec-corpus/release-manifest.json` is the canonical integrity source.
- `install.json.layoutVersion` is required for new installs and set to `2`.
- `activeSnapshotPath` is deprecated and optional (legacy v1 compatibility only).

## Compatibility matrix

| Scenario | Input State | Expected Behavior |
|---|---|---|
| Fresh install v2 | No `.spec-corpus` | Install directly to flat v2 layout, no `snapshots/` dir |
| Update from v1 | Legacy `.spec-corpus/snapshots/*` + `activeSnapshotPath` | One-time migrate to flat v2, then update payload |
| Update from v2 | Flat v2 | Verify dirty state via flat manifest, update in-place |
| Force update | Dirty managed files | Proceed update, report conflicts, replace managed payload |

## Migration notes

- Legacy `snapshots/` directory is removed after successful v1 -> v2 migration.
- Any tooling that reads `.spec-corpus/snapshots/*` must migrate to `.spec-corpus/` flat paths.
