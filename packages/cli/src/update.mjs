/**
 * update.mjs — update engine for spec-corpus CLI
 *
 * Flat layout v2 semantics:
 *   - Canonical managed payload lives directly under `.spec-corpus/`
 *   - Active manifest is `.spec-corpus/release-manifest.json`
 *   - `install.json` records `layoutVersion: 2`
 *
 * Backward compatibility:
 *   - If a legacy v1 install is detected (`activeSnapshotPath` / snapshots layout),
 *     update performs an in-place one-time migration to v2 before normal update.
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { verifySnapshot } from './verify-snapshot.mjs';
import { extractTarball } from './tar-extract.mjs';
import {
  SPEC_DIR,
  INSTALL_JSON,
  LAYOUT_VERSION_V2,
  clearManagedFlatRoot,
  stageExtractedPayloadToFlatRoot,
  migrateLayoutV1ToV2,
} from './layout-v2.mjs';

const MANIFEST_REL = 'package/dist/release-manifest.json';

function computeIntegrity(filePath) {
  const buf = readFileSync(filePath);
  const hash = createHash('sha512').update(buf).digest('base64');
  return `sha512-${hash}`;
}

function getCliVersion() {
  try {
    const pkgPath = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * @typedef {Object} UpdateResult
 * @property {boolean} alreadyActive
 * @property {boolean} blocked
 * @property {Array} conflicts
 * @property {string} version
 * @property {string} previousVersion
 * @property {string|null} snapshotPath
 * @property {string} installJsonPath
 * @property {Object} installRecord
 * @property {string|null} forceWarning
 */

/**
 * @param {Object} opts
 * @param {string} opts.tarballPath
 * @param {string} opts.target
 * @param {boolean} opts.force
 * @param {"tarball"|"registry"} opts.installSource
 * @returns {UpdateResult}
 */
export function updateFromTarball({ tarballPath, target, force, installSource }) {
  const absTarget = resolve(target);
  const specDir = join(absTarget, SPEC_DIR);
  const ts = Date.now();
  const extractDir = join(specDir, `.tmp-extract-${ts}`);

  const installJsonAbsPath = join(specDir, INSTALL_JSON);
  if (!existsSync(installJsonAbsPath)) {
    throw new Error(
      `Not installed: ${installJsonAbsPath} not found. Run bootstrap first.`
    );
  }

  const currentRecord = JSON.parse(readFileSync(installJsonAbsPath, 'utf-8'));
  const previousVersion = currentRecord.activeSnapshotVersion || 'unknown';
  const currentLayoutVersion = currentRecord.layoutVersion || 1;

  try {
    extractTarball(tarballPath, extractDir);

    const manifestPath = join(extractDir, MANIFEST_REL);
    if (!existsSync(manifestPath)) {
      throw new Error(
        `release-manifest.json not found in tarball at expected path: ${MANIFEST_REL}`
      );
    }

    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    } catch (parseErr) {
      throw new Error(
        `release-manifest.json is not valid JSON: ${parseErr.message}`
      );
    }

    const version = manifest.packageVersion;
    if (!version) {
      throw new Error('release-manifest.json missing packageVersion field');
    }

    if (version === previousVersion && currentLayoutVersion === LAYOUT_VERSION_V2) {
      return {
        alreadyActive: true,
        blocked: false,
        conflicts: [],
        version,
        previousVersion,
        snapshotPath: null,
        installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
        installRecord: currentRecord,
        forceWarning: null,
      };
    }

    let conflicts = [];
    let forceWarning = null;

    try {
      const report = verifySnapshot({ target: absTarget, installRecord: currentRecord });
      if (!report.clean) {
        conflicts = report.conflicts;
        if (!force) {
          return {
            alreadyActive: false,
            blocked: true,
            conflicts,
            version,
            previousVersion,
            snapshotPath: null,
            installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
            installRecord: currentRecord,
            forceWarning: null,
          };
        }
        forceWarning = 'Local changes in managed corpus were discarded.';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const allowFallback =
        /release-manifest\.json not found/i.test(message) ||
        /missing files array/i.test(message);
      if (!allowFallback) {
        throw err;
      }
      // Legacy custom/malformed state without a usable manifest: continue with update.
    }

    // One-time v1 -> v2 migration after dirty-check/update authorization.
    if (currentLayoutVersion === 1 || currentRecord.activeSnapshotPath) {
      const migration = migrateLayoutV1ToV2({
        specDir,
        target: absTarget,
        installRecord: currentRecord,
      });

      if (migration.migrated) {
        const migratedRecord = {
          ...currentRecord,
          layoutVersion: LAYOUT_VERSION_V2,
        };
        delete migratedRecord.activeSnapshotPath;
        writeFileSync(
          installJsonAbsPath,
          JSON.stringify(migratedRecord, null, 2) + '\n',
          'utf-8'
        );
      }
    }

    clearManagedFlatRoot(specDir);
    stageExtractedPayloadToFlatRoot(extractDir, specDir);

    const integrity = computeIntegrity(tarballPath);
    const now = new Date().toISOString();
    const updatedRecord = {
      schemaVersion: currentRecord.schemaVersion || 1,
      layoutVersion: LAYOUT_VERSION_V2,
      corpusPackageName:
        manifest.packageName || currentRecord.corpusPackageName || '@spec-corpus/corpus',
      corpusPackageVersion: version,
      corpusPackageIntegrity: integrity,
      cliPackageName: currentRecord.cliPackageName || 'spec-corpus',
      cliPackageVersion: getCliVersion(),
      activeSnapshotVersion: version,
      installedAt: currentRecord.installedAt,
      installSource: installSource || currentRecord.installSource || 'tarball',
      updatedAt: now,
    };

    writeFileSync(installJsonAbsPath, JSON.stringify(updatedRecord, null, 2) + '\n', 'utf-8');

    return {
      alreadyActive: false,
      blocked: false,
      conflicts,
      version,
      previousVersion,
      snapshotPath: null,
      installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
      installRecord: updatedRecord,
      forceWarning,
    };
  } finally {
    if (existsSync(extractDir)) {
      try {
        rmSync(extractDir, { recursive: true, force: true });
      } catch {
        // best-effort
      }
    }
  }
}
