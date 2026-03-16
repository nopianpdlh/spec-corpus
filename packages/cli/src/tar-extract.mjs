import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

/**
 * @param {string} tgzPath
 * @param {string} destDir
 * @param {NodeJS.Platform} platform
 */
export function buildTarAttempts(tgzPath, destDir, platform) {
  if (platform !== 'win32') {
    return [['xf', tgzPath, '-C', destDir]];
  }

  const fwdTarPath = tgzPath.replace(/\\/g, '/');
  const fwdDestDir = destDir.replace(/\\/g, '/');

  return [
    ['xf', fwdTarPath, '--force-local', '-C', fwdDestDir],
    ['xf', tgzPath, '-C', destDir],
  ];
}

/**
 * @param {string} message
 */
export function isUnsupportedForceLocalError(message) {
  const normalized = (message || '').toLowerCase();
  return (
    normalized.includes('force-local') &&
    (normalized.includes('not supported') ||
      normalized.includes('unknown option') ||
      normalized.includes('unrecognized option'))
  );
}

/**
 * Extract a .tgz tarball into destDir using system tar.
 * On Windows, retries without --force-local if tar implementation does not support it.
 *
 * @param {string} tgzPath
 * @param {string} destDir
 * @param {{ platform?: NodeJS.Platform, spawn?: typeof spawnSync }} [opts]
 */
export function extractTarball(tgzPath, destDir, opts = {}) {
  const platform = opts.platform ?? process.platform;
  const spawn = opts.spawn ?? spawnSync;

  mkdirSync(destDir, { recursive: true });
  const attempts = buildTarAttempts(tgzPath, destDir, platform);

  /** @type {Error | null} */
  let lastError = null;

  for (let i = 0; i < attempts.length; i += 1) {
    const args = attempts[i];
    const result = spawn('tar', args, {
      encoding: 'utf-8',
      timeout: 30_000,
    });

    if (result.status === 0) {
      return;
    }

    const msg = (result.stderr || result.error?.message || 'unknown error').trim();
    lastError = new Error(`Failed to extract tarball: ${msg}`);

    const shouldRetryUnsupportedForceLocal =
      platform === 'win32' &&
      i === 0 &&
      attempts.length > 1 &&
      isUnsupportedForceLocalError(msg);

    if (!shouldRetryUnsupportedForceLocal) {
      throw lastError;
    }
  }

  throw lastError ?? new Error('Failed to extract tarball: unknown error');
}
