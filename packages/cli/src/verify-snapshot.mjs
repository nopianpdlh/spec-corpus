/**
 * verify-snapshot.mjs — snapshot integrity verifier engine
 *
 * Reads the release manifest from a snapshot directory, computes sha256
 * hashes of every file on disk, and produces a ConflictReport indicating
 * whether the snapshot is clean or dirty.
 *
 * Dirty-state categories:
 *   - modified: file exists but hash doesn't match manifest
 *   - missing:  file listed in manifest but not on disk
 *   - unexpected: file exists in snapshot but NOT in manifest
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute sha256 hex hash of a file.
 * @param {string} filePath
 * @returns {string}
 */
function sha256Hex(filePath) {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Recursively enumerate all files under a directory.
 * Returns paths relative to `baseDir` using forward slashes.
 * @param {string} dir - absolute path to walk
 * @param {string} baseDir - absolute path used as relative root
 * @returns {string[]}
 */
function walkDir(dir, baseDir) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      // Normalize to forward slashes for cross-platform consistency
      const rel = relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push(rel);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Conflict
 * @property {string} file - relative path of the conflicting file
 * @property {"modified"|"missing"|"unexpected"} status
 */

/**
 * @typedef {Object} ConflictReport
 * @property {boolean} clean
 * @property {Conflict[]} conflicts
 * @property {string} activeVersion
 * @property {string} snapshotPath
 */

/**
 * Verify the integrity of the active managed snapshot.
 *
 * @param {Object} opts
 * @param {string} opts.target - absolute path to the consumer project root
 * @returns {ConflictReport}
 * @throws {Error} if install.json or release-manifest.json cannot be read
 */
export function verifySnapshot({ target }) {
  // 1. Read install.json
  const installJsonPath = join(target, '.spec-corpus', 'install.json');
  if (!existsSync(installJsonPath)) {
    throw new Error(`Not installed: ${installJsonPath} not found`);
  }

  const installRecord = JSON.parse(readFileSync(installJsonPath, 'utf-8'));
  const snapshotRelPath = installRecord.activeSnapshotPath;
  const version = installRecord.activeSnapshotVersion;

  if (!snapshotRelPath) {
    throw new Error('install.json missing activeSnapshotPath');
  }

  const snapshotAbsPath = join(target, snapshotRelPath);
  if (!existsSync(snapshotAbsPath)) {
    throw new Error(`Snapshot directory not found: ${snapshotAbsPath}`);
  }

  // 2. Read release-manifest.json from inside the snapshot
  const manifestPath = join(snapshotAbsPath, 'release-manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(
      `release-manifest.json not found in snapshot at: ${manifestPath}`
    );
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const manifestFiles = manifest.files;
  if (!Array.isArray(manifestFiles)) {
    throw new Error('release-manifest.json missing files array');
  }

  // 3. Build a map of expected files: path -> hash
  const expectedMap = new Map();
  for (const entry of manifestFiles) {
    expectedMap.set(entry.path, entry.hash);
  }

  // 4. Walk the snapshot to find actual files (excluding release-manifest.json itself)
  const actualFiles = walkDir(snapshotAbsPath, snapshotAbsPath).filter(
    (f) => f !== 'release-manifest.json'
  );
  const actualSet = new Set(actualFiles);

  // 5. Compare
  const conflicts = [];

  // Check each manifest entry against disk
  for (const [filePath, expectedHash] of expectedMap) {
    const absFilePath = join(snapshotAbsPath, filePath);
    if (!existsSync(absFilePath)) {
      conflicts.push({ file: filePath, status: 'missing' });
    } else {
      const actualHash = sha256Hex(absFilePath);
      if (actualHash !== expectedHash) {
        conflicts.push({ file: filePath, status: 'modified' });
      }
    }
  }

  // Check for unexpected files (on disk but not in manifest)
  for (const actualFile of actualFiles) {
    if (!expectedMap.has(actualFile)) {
      conflicts.push({ file: actualFile, status: 'unexpected' });
    }
  }

  // Sort conflicts by file path for deterministic output
  conflicts.sort((a, b) => a.file.localeCompare(b.file));

  return {
    clean: conflicts.length === 0,
    conflicts,
    activeVersion: version || 'unknown',
    snapshotPath: snapshotRelPath,
  };
}
