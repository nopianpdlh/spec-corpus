/**
 * install.mjs — install engine for spec-corpus CLI
 *
 * Handles tarball extraction, snapshot writing, and install.json creation.
 * Uses only Node.js built-ins (no external dependencies).
 *
 * Tarball layout (npm pack output):
 *   package/dist/release-manifest.json
 *   package/dist/root/...
 *   package/dist/corpora/...
 */

import { createHash } from 'node:crypto';
import {
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { extractTarball } from './tar-extract.mjs';
import {
  SPEC_DIR,
  INSTALL_JSON,
  LAYOUT_VERSION_V2,
  clearManagedFlatRoot,
  stageExtractedPayloadToFlatRoot,
} from './layout-v2.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MANIFEST_REL = 'package/dist/release-manifest.json';

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

// ---------------------------------------------------------------------------
// Install engine
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} InstallResult
 * @property {boolean} alreadyInstalled - true if same version already present
 * @property {string} version           - installed snapshot version
 * @property {string|null} snapshotPath - null for layout v2 installs
 * @property {string} installJsonPath   - relative path to install.json
 * @property {Object} installRecord     - the full install.json object
 */

/**
 * Install a corpus tarball into a target project directory.
 *
 * Steps:
 *  1. Extract tarball to temp staging area
 *  2. Read release-manifest.json from extracted package
 *  3. Check if same version already active (idempotent)
 *  4. Copy root/, corpora/, and release-manifest.json into .spec-corpus/
 *  5. Write .spec-corpus/install.json (layoutVersion=2)
 *  6. Clean up staging area
 *
 * @param {Object} opts
 * @param {string} opts.tarballPath  - absolute path to the .tgz file
 * @param {string} opts.target       - absolute path to the target project directory
 * @param {"tarball"|"registry"} opts.installSource - how the tarball was obtained
 * @returns {InstallResult}
 */
export function installFromTarball({ tarballPath, target, installSource }) {
  const absTarget = resolve(target);
  const specDir = join(absTarget, SPEC_DIR);
  const ts = Date.now();
  const extractDir = join(specDir, `.tmp-extract-${ts}`);

  try {
    // 1. Extract tarball to extract dir
    extractTarball(tarballPath, extractDir);

    // 2. Read release manifest from extract dir
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

    // 3. Check idempotency — same version already active?
    const existingInstallJsonPath = join(specDir, INSTALL_JSON);
    if (existsSync(existingInstallJsonPath)) {
      let existingRecord = null;
      try {
        existingRecord = JSON.parse(readFileSync(existingInstallJsonPath, 'utf-8'));
      } catch {
        // Corrupt record; continue with fresh install.
      }

      if (existingRecord?.activeSnapshotVersion === version) {
        return {
          alreadyInstalled: true,
          version,
          snapshotPath: null,
          installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
          installRecord: existingRecord,
        };
      }
    }

    // 4. Replace managed flat root and stage payload from extracted tarball.
    clearManagedFlatRoot(specDir);
    stageExtractedPayloadToFlatRoot(extractDir, specDir);

    // 5. Compute integrity of the tarball
    const integrity = computeIntegrity(tarballPath);

    // 7. Write install.json LAST — only after rename succeeds.
    //    Key invariant: if process exits before this point, install.json
    //    does NOT reflect a successful install of this version.
    const now = new Date().toISOString();
    const installRecord = {
      schemaVersion: 1,
      layoutVersion: LAYOUT_VERSION_V2,
      corpusPackageName: manifest.packageName || '@spec-corpus/corpus',
      corpusPackageVersion: version,
      corpusPackageIntegrity: integrity,
      cliPackageName: 'spec-corpus',
      cliPackageVersion: getCliVersion(),
      activeSnapshotVersion: version,
      installedAt: now,
      installSource: installSource || 'tarball',
    };

    const installJsonPath = join(specDir, INSTALL_JSON);
    writeFileSync(installJsonPath, JSON.stringify(installRecord, null, 2) + '\n', 'utf-8');

    return {
      alreadyInstalled: false,
      version,
      snapshotPath: null,
      installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
      installRecord,
    };
  } finally {
    // 9. Clean up BOTH temp dirs (always, even on failure)
    for (const dir of [extractDir]) {
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

/**
 * Read CLI package version from the nearest package.json.
 * Falls back to "0.0.0" if not found.
 * @returns {string}
 */
function getCliVersion() {
  try {
    // Navigate from this file's location to package.json
    const pkgPath = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}
