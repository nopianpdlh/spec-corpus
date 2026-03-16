/**
 * verify-snapshot.mjs — managed corpus integrity verifier
 *
 * Verifies the canonical flat layout under `.spec-corpus/` against
 * `.spec-corpus/release-manifest.json`.
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

function sha256Hex(filePath) {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

function walkDir(dir, baseDir) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      const rel = relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push(rel);
    }
  }
  return results;
}

/**
 * @param {{ target: string, installRecord?: any }} opts
 */
export function verifySnapshot({ target, installRecord: providedInstallRecord }) {
  const installJsonPath = join(target, '.spec-corpus', 'install.json');
  if (!providedInstallRecord && !existsSync(installJsonPath)) {
    throw new Error(`Not installed: ${installJsonPath} not found`);
  }

  const installRecord = providedInstallRecord || JSON.parse(readFileSync(installJsonPath, 'utf-8'));
  const version = installRecord.activeSnapshotVersion;
  const specDir = join(target, '.spec-corpus');

  const isLegacyV1 = !installRecord.layoutVersion || installRecord.layoutVersion === 1 || !!installRecord.activeSnapshotPath;
  const manifestPath = isLegacyV1 && installRecord.activeSnapshotPath
    ? resolve(target, installRecord.activeSnapshotPath, 'release-manifest.json')
    : join(specDir, 'release-manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`release-manifest.json not found at: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const manifestFiles = manifest.files;
  if (!Array.isArray(manifestFiles)) {
    throw new Error('release-manifest.json missing files array');
  }

  const expectedMap = new Map();
  for (const entry of manifestFiles) {
    const flatPath = entry.path
      .replace(/^root\//, '')
      .replace(/^corpora\//, '');
    expectedMap.set(flatPath, entry.hash);
  }

  const contentBaseDir = isLegacyV1 && installRecord.activeSnapshotPath
    ? resolve(target, installRecord.activeSnapshotPath)
    : specDir;

  const actualFiles = walkDir(contentBaseDir, contentBaseDir).filter((f) => {
    if (f === 'install.json') return false;
    if (f === 'release-manifest.json') return false;
    if (f.startsWith('.tmp-')) return false;
    return true;
  });
  const normalizedActualFiles = actualFiles.map((f) =>
    isLegacyV1 ? legacyPathToFlatPath(f) : f
  );

  const conflicts = [];

  for (const [filePath, expectedHash] of expectedMap) {
      const manifestRelativePath = isLegacyV1
        ? entryPathToLegacyPath(filePath)
        : filePath;
      const absFilePath = join(contentBaseDir, manifestRelativePath);
      if (!existsSync(absFilePath)) {
        conflicts.push({ file: filePath, status: 'missing' });
      } else {
      const actualHash = sha256Hex(absFilePath);
      if (actualHash !== expectedHash) {
        conflicts.push({ file: filePath, status: 'modified' });
      }
    }
  }

  for (let i = 0; i < actualFiles.length; i += 1) {
    const actualFile = actualFiles[i];
    const normalizedActualFile = normalizedActualFiles[i];
    if (!expectedMap.has(normalizedActualFile)) {
      conflicts.push({ file: normalizedActualFile, status: 'unexpected' });
    }
  }

  conflicts.sort((a, b) => a.file.localeCompare(b.file));

  return {
    clean: conflicts.length === 0,
    conflicts,
    activeVersion: version || 'unknown',
    snapshotPath: isLegacyV1 ? installRecord.activeSnapshotPath || null : null,
  };
}

function entryPathToLegacyPath(flatPath) {
  if (flatPath.startsWith('spec_')) return `corpora/${flatPath}`;
  return `root/${flatPath}`;
}

function legacyPathToFlatPath(legacyPath) {
  if (legacyPath.startsWith('root/')) return legacyPath.slice('root/'.length);
  if (legacyPath.startsWith('corpora/')) return legacyPath.slice('corpora/'.length);
  return legacyPath;
}
