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
  cpSync,
  statSync,
  renameSync,
  readdirSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

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

// ---------------------------------------------------------------------------
// Install engine
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} InstallResult
 * @property {boolean} alreadyInstalled - true if snapshot was already present
 * @property {string} version           - installed snapshot version
 * @property {string} snapshotPath      - relative path to snapshot dir
 * @property {string} installJsonPath   - relative path to install.json
 * @property {Object} installRecord     - the full install.json object
 */

/**
 * Install a corpus tarball into a target project directory.
 *
 * Steps:
 *  1. Extract tarball to temp staging area
 *  2. Read release-manifest.json from extracted package
 *  3. Check if snapshot version already exists (idempotent)
 *  4. Copy root/ and corpora/ into .spec-corpus/snapshots/<version>/
 *  5. Write .spec-corpus/install.json
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
  const stagingDir = join(specDir, `.tmp-snap-${ts}`);

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

    // 3. Check idempotency — snapshot already exists?
    const snapshotRelPath = `${SPEC_DIR}/${SNAPSHOTS_DIR}/${version}`;
    const snapshotAbsPath = join(absTarget, snapshotRelPath);

    if (existsSync(snapshotAbsPath)) {
      // Already installed — return early
      const existingInstallJsonPath = join(specDir, INSTALL_JSON);
      let existingRecord = null;
      if (existsSync(existingInstallJsonPath)) {
        try {
          existingRecord = JSON.parse(readFileSync(existingInstallJsonPath, 'utf-8'));
        } catch {
          // corrupt install.json — will be overwritten below... but we skip since already installed
        }
      }
      return {
        alreadyInstalled: true,
        version,
        snapshotPath: snapshotRelPath,
        installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
        installRecord: existingRecord,
      };
    }

    // 4. Copy files into staging dir (separate from extract dir)
    mkdirSync(stagingDir, { recursive: true });

    const extractRoot = join(extractDir, ROOT_REL);
    const extractCorpora = join(extractDir, CORPORA_REL);

    if (existsSync(extractRoot)) {
      cpSync(extractRoot, join(stagingDir, 'root'), { recursive: true });
    }
    if (existsSync(extractCorpora)) {
      cpSync(extractCorpora, join(stagingDir, 'corpora'), { recursive: true });
    }

    // 4b. Copy release-manifest.json into staging dir for later verification
    cpSync(manifestPath, join(stagingDir, MANIFEST_FILENAME));

    // 5. Compute integrity of the tarball
    const integrity = computeIntegrity(tarballPath);

    // 6. Atomic move: rename staging dir to final snapshot dir
    //    Both dirs are under .spec-corpus/ so this is always same-device (no EXDEV).
    mkdirSync(join(absTarget, SPEC_DIR, SNAPSHOTS_DIR), { recursive: true });
    renameSync(stagingDir, snapshotAbsPath);

    // 7. Write install.json LAST — only after rename succeeds.
    //    Key invariant: if process exits before this point, install.json
    //    does NOT reflect a successful install of this version.
    const now = new Date().toISOString();
    const installRecord = {
      schemaVersion: 1,
      corpusPackageName: manifest.packageName || '@spec-corpus/corpus',
      corpusPackageVersion: version,
      corpusPackageIntegrity: integrity,
      cliPackageName: 'spec-corpus',
      cliPackageVersion: getCliVersion(),
      activeSnapshotVersion: version,
      activeSnapshotPath: snapshotRelPath,
      installedAt: now,
      installSource: installSource || 'tarball',
    };

    const installJsonPath = join(specDir, INSTALL_JSON);
    writeFileSync(installJsonPath, JSON.stringify(installRecord, null, 2) + '\n', 'utf-8');

    return {
      alreadyInstalled: false,
      version,
      snapshotPath: snapshotRelPath,
      installJsonPath: `${SPEC_DIR}/${INSTALL_JSON}`,
      installRecord,
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
