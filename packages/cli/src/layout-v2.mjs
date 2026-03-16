import { existsSync, rmSync, cpSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const SPEC_DIR = '.spec-corpus';
export const SNAPSHOTS_DIR = 'snapshots';
export const INSTALL_JSON = 'install.json';
export const MANIFEST_FILENAME = 'release-manifest.json';
export const LAYOUT_VERSION_V2 = 2;

/**
 * Remove managed flat payload from .spec-corpus root while preserving metadata.
 *
 * @param {string} specDir
 */
export function clearManagedFlatRoot(specDir) {
  if (!existsSync(specDir)) return;

  const keepTopLevel = new Set([INSTALL_JSON]);
  for (const entry of readdirSync(specDir, { withFileTypes: true })) {
    if (keepTopLevel.has(entry.name)) continue;
    if (entry.name.startsWith('.tmp-')) continue;
    rmSync(join(specDir, entry.name), { recursive: true, force: true });
  }
}

/**
 * Copy extracted dist payload into .spec-corpus flat canonical layout.
 *
 * @param {string} extractDir
 * @param {string} specDir
 */
export function stageExtractedPayloadToFlatRoot(extractDir, specDir) {
  const extractRoot = join(extractDir, 'package', 'dist', 'root');
  const extractCorpora = join(extractDir, 'package', 'dist', 'corpora');
  const extractManifest = join(extractDir, 'package', 'dist', MANIFEST_FILENAME);

  mkdirSync(specDir, { recursive: true });

  if (existsSync(extractRoot)) {
    for (const entry of readdirSync(extractRoot, { withFileTypes: true })) {
      cpSync(join(extractRoot, entry.name), join(specDir, entry.name), {
        recursive: entry.isDirectory(),
      });
    }
  }

  if (existsSync(extractCorpora)) {
    for (const entry of readdirSync(extractCorpora, { withFileTypes: true })) {
      cpSync(join(extractCorpora, entry.name), join(specDir, entry.name), {
        recursive: entry.isDirectory(),
      });
    }
  }

  if (existsSync(extractManifest)) {
    cpSync(extractManifest, join(specDir, MANIFEST_FILENAME));
  }
}

/**
 * Migrate legacy snapshot layout v1 into flat layout v2.
 *
 * @param {Object} opts
 * @param {string} opts.specDir
 * @param {string} opts.target
 * @param {Object} opts.installRecord
 * @returns {Object} migration metadata
 */
export function migrateLayoutV1ToV2({ specDir, target, installRecord }) {
  const relSnapshotPath = installRecord.activeSnapshotPath;
  if (!relSnapshotPath) {
    return { migrated: false, reason: 'missing-activeSnapshotPath' };
  }

  const snapshotAbsPath = join(target, relSnapshotPath);
  if (!existsSync(snapshotAbsPath)) {
    return { migrated: false, reason: 'snapshot-path-not-found' };
  }

  const snapshotRoot = join(snapshotAbsPath, 'root');
  const snapshotCorpora = join(snapshotAbsPath, 'corpora');
  const snapshotManifest = join(snapshotAbsPath, MANIFEST_FILENAME);

  clearManagedFlatRoot(specDir);

  if (existsSync(snapshotRoot)) {
    for (const entry of readdirSync(snapshotRoot, { withFileTypes: true })) {
      cpSync(join(snapshotRoot, entry.name), join(specDir, entry.name), {
        recursive: entry.isDirectory(),
      });
    }
  }

  if (existsSync(snapshotCorpora)) {
    for (const entry of readdirSync(snapshotCorpora, { withFileTypes: true })) {
      cpSync(join(snapshotCorpora, entry.name), join(specDir, entry.name), {
        recursive: entry.isDirectory(),
      });
    }
  }

  if (existsSync(snapshotManifest)) {
    cpSync(snapshotManifest, join(specDir, MANIFEST_FILENAME));
  }

  if (existsSync(join(specDir, SNAPSHOTS_DIR))) {
    rmSync(join(specDir, SNAPSHOTS_DIR), { recursive: true, force: true });
  }

  return {
    migrated: true,
    fromLayoutVersion: 1,
    fromSnapshotPath: relSnapshotPath,
  };
}
