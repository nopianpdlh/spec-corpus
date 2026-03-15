/**
 * update.mjs — update engine for spec-corpus CLI
 *
 * Handles tarball extraction, dirty-state verification, snapshot creation,
 * and install.json update. Reuses extraction patterns from install.mjs.
 * Uses only Node.js built-ins (no external dependencies).
 *
 * Update flow:
 *   1. Extract tarball to temp staging dir
 *   2. Read release-manifest.json from extracted package
 *   3. If new version == active version → already-active
 *   4. If !force → verify current snapshot integrity → block if dirty
 *   5. Copy dist/root/, dist/corpora/, release-manifest.json into new snapshot
 *   6. Update install.json (activeSnapshotVersion, activeSnapshotPath, updatedAt)
 *   7. Clean up temp staging dir
 */

import { createHash } from 'node:crypto';
import {
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
  cpSync,
  renameSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { verifySnapshot } from './verify-snapshot.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPEC_DIR = '.spec-corpus';
const SNAPSHOTS_DIR = 'snapshots';
const INSTALL_JSON = 'install.json';
const MANIFEST_REL = 'package/dist/release-manifest.json';
const MANIFEST_FILENAME = 'release-manifest.json';
const ROOT_REL = 'package/dist/root';
const CORPORA_REL = 'package/dist/corpora';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute sha512 integrity hash of a file (npm-style: "sha512-<base64>").
 * @param {string} filePath
 * @returns {string}
 */
function computeIntegrity(filePath) {
  const buf = readFileSync(filePath);
  const hash = createHash('sha512').update(buf).digest('base64');
  return `sha512-${hash}`;
}

/**
 * Extract a .tgz tarball into destDir using the system `tar` command.
 * @param {string} tgzPath  - absolute path to .tgz file
 * @param {string} destDir  - absolute path to extraction target
 */
function extractTarball(tgzPath, destDir) {
  mkdirSync(destDir, { recursive: true });

  // On Windows, GNU tar interprets "C:" as a remote host and backslashes
  // confuse it. Convert to forward slashes and use --force-local.
  let tarPath = tgzPath;
  let tarDest = destDir;
  const args = ['xf'];
  if (process.platform === 'win32') {
    tarPath = tgzPath.replace(/\\/g, '/');
    tarDest = destDir.replace(/\\/g, '/');
    args.push(tarPath, '--force-local', '-C', tarDest);
  } else {
    args.push(tarPath, '-C', tarDest);
  }

  const result = spawnSync('tar', args, {
    encoding: 'utf-8',
    timeout: 30_000,
  });
  if (result.status !== 0) {
    const msg = (result.stderr || result.error?.message || 'unknown error').trim();
    throw new Error(`Failed to extract tarball: ${msg}`);
  }
}

/**
 * Read CLI package version from the nearest package.json.
 * Falls back to "0.0.0" if not found.
 * @returns {string}
 */
function getCliVersion() {
  try {
    const pkgPath = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// ---------------------------------------------------------------------------
// Update engine
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} UpdateResult
 * @property {boolean} alreadyActive     - new version == current active version
 * @property {boolean} blocked           - dirty state blocked update (only when !force)
 * @property {Array}   conflicts         - dirty state conflicts (if blocked or forced)
 * @property {string}  version           - new version from tarball
 * @property {string}  previousVersion   - previous active version
 * @property {string}  snapshotPath      - relative path to new snapshot dir
 * @property {string}  installJsonPath   - relative path to install.json
 * @property {Object}  installRecord     - the full install.json object after update
 * @property {string|null} forceWarning  - warning message if --force was used with dirty state
 */

/**
 * Update an existing spec-corpus installation from a tarball.
 *
 * @param {Object} opts
 * @param {string} opts.tarballPath   - absolute path to the .tgz file
 * @param {string} opts.target        - absolute path to the target project directory
 * @param {boolean} opts.force        - bypass dirty-state blocking
 * @param {"tarball"|"registry"} opts.installSource - how the tarball was obtained
 * @returns {UpdateResult}
 */
export function updateFromTarball({ tarballPath, target, force, installSource }) {
  const absTarget = resolve(target);
  const specDir = join(absTarget, SPEC_DIR);
  const ts = Date.now();
  const extractDir = join(specDir, `.tmp-extract-${ts}`);
  const stagingDir = join(specDir, `.tmp-snap-${ts}`);

  // Read current install record
  const installJsonAbsPath = join(specDir, INSTALL_JSON);
  if (!existsSync(installJsonAbsPath)) {
    throw new Error(
      `Not installed: ${installJsonAbsPath} not found. Run bootstrap first.`
    );
  }

  const currentRecord = JSON.parse(readFileSync(installJsonAbsPath, 'utf-8'));
  const previousVersion = currentRecord.activeSnapshotVersion || 'unknown';

  try {
    // 1. Extract tarball to extract dir
    extractTarball(tarballPath, extractDir);

    // 2. Read release manifest from extracted package
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

    // 3. If new version == active version → already-active
    if (version === previousVersion) {
      return {
        alreadyActive: true,
        blocked: false,
        conflicts: [],
        version,
        previousVersion,
        snapshotPath: currentRecord.activeSnapshotPath,
        installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
        installRecord: currentRecord,
        forceWarning: null,
      };
    }

    // 4. Dirty-state check on current active snapshot
    let conflicts = [];
    let forceWarning = null;

    try {
      const report = verifySnapshot({ target: absTarget });
      if (!report.clean) {
        conflicts = report.conflicts;

        if (!force) {
          // Block the update
          return {
            alreadyActive: false,
            blocked: true,
            conflicts,
            version,
            previousVersion,
            snapshotPath: currentRecord.activeSnapshotPath,
            installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
            installRecord: currentRecord,
            forceWarning: null,
          };
        }

        // --force: proceed but warn
        forceWarning = 'Local changes in active snapshot were discarded.';
      }
    } catch {
      // If verify fails (e.g., missing manifest in old snapshot), skip dirty check
      // This can happen when the old snapshot was set up without a manifest
    }

    // 5. Copy files into staging dir (skip if snapshot already exists)
    const snapshotRelPath = `${SPEC_DIR}/${SNAPSHOTS_DIR}/${version}`;
    const snapshotAbsPath = join(absTarget, snapshotRelPath);

    if (!existsSync(snapshotAbsPath)) {
      mkdirSync(stagingDir, { recursive: true });

      const extractRoot = join(extractDir, ROOT_REL);
      const extractCorpora = join(extractDir, CORPORA_REL);

      if (existsSync(extractRoot)) {
        cpSync(extractRoot, join(stagingDir, 'root'), { recursive: true });
      }
      if (existsSync(extractCorpora)) {
        cpSync(extractCorpora, join(stagingDir, 'corpora'), { recursive: true });
      }

      // Copy release-manifest.json into staging dir for later verification
      cpSync(manifestPath, join(stagingDir, MANIFEST_FILENAME));

      // Atomic move: rename staging dir to final snapshot dir
      mkdirSync(join(absTarget, SPEC_DIR, SNAPSHOTS_DIR), { recursive: true });
      renameSync(stagingDir, snapshotAbsPath);
    }

    // 6. Compute integrity of the tarball
    const integrity = computeIntegrity(tarballPath);

    // 7. Update install.json LAST — only after atomic rename succeeds
    const now = new Date().toISOString();
    const updatedRecord = {
      schemaVersion: currentRecord.schemaVersion || 1,
      corpusPackageName: manifest.packageName || currentRecord.corpusPackageName || '@spec-corpus/corpus',
      corpusPackageVersion: version,
      corpusPackageIntegrity: integrity,
      cliPackageName: currentRecord.cliPackageName || 'spec-corpus',
      cliPackageVersion: getCliVersion(),
      activeSnapshotVersion: version,
      activeSnapshotPath: snapshotRelPath,
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
      snapshotPath: snapshotRelPath,
      installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
      installRecord: updatedRecord,
      forceWarning,
    };
  } finally {
    // 8. Clean up BOTH temp dirs (always, even on failure)
    for (const dir of [extractDir, stagingDir]) {
      try {
        if (existsSync(dir)) {
          rmSync(dir, { recursive: true, force: true });
        }
      } catch {
        // Best-effort cleanup — don't mask original error
      }
    }
  }
}
