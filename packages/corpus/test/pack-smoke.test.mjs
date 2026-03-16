/**
 * pack-smoke.test.mjs
 *
 * Smoke tests for the @spec-corpus/corpus npm pack output.
 *
 * Prerequisites: `npm run pack:corpus` must have been run, which places a
 * tarball in ./tmp/dist/ relative to the repo root.
 *
 * Run:
 *   node --test packages/corpus/test/pack-smoke.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readdirSync,
  statSync,
  existsSync,
  createReadStream,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createGunzip } from 'node:zlib';

// ---------------------------------------------------------------------------
// Locate repo root and tarball
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// packages/corpus/test/ → ../../../ = repo root
const repoRoot = join(__dirname, '..', '..', '..');
const distDir = join(repoRoot, 'tmp', 'dist');

function getTarballs() {
  if (!existsSync(distDir)) return [];
  return readdirSync(distDir).filter((f) => f.startsWith('spec-corpus-corpus-') && f.endsWith('.tgz'));
}

// ---------------------------------------------------------------------------
// Run pack:corpus if tarball does not exist yet
// (allows running the test standalone without pre-packing)
// ---------------------------------------------------------------------------

let tarballs = getTarballs();
if (tarballs.length === 0) {
  console.log('No tarball found — running npm run pack:corpus ...');
  execSync('npm run pack:corpus', { cwd: repoRoot, stdio: 'inherit' });
  tarballs = getTarballs();
}

// ---------------------------------------------------------------------------
// Pure-Node tar entry listing (no system tar required, cross-platform)
// Reads .tar.gz and returns array of entry paths (files only)
// ---------------------------------------------------------------------------

/**
 * List all file entry paths inside a .tgz archive using Node.js built-ins.
 * @param {string} tgzPath
 * @returns {Promise<string[]>}
 */
function listTarEntries(tgzPath) {
  return new Promise((resolve, reject) => {
    const entries = [];
    const gz = createGunzip();
    const rs = createReadStream(tgzPath);

    let buffer = Buffer.alloc(0);

    gz.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    gz.on('end', () => {
      let offset = 0;
      while (offset + 512 <= buffer.length) {
        const header = buffer.slice(offset, offset + 512);
        if (header.every((b) => b === 0)) break;

        let nameEnd = header.indexOf(0, 0);
        if (nameEnd === -1) nameEnd = 100;
        let name = header.slice(0, nameEnd).toString('utf8');

        // ustar prefix (bytes 345-500)
        const prefix = header.slice(345, 500).toString('utf8').replace(/\0.*$/, '');
        if (prefix) name = prefix + '/' + name;

        const sizeStr = header.slice(124, 136).toString('utf8').replace(/\0.*$/, '').trim();
        const fileSize = parseInt(sizeStr, 8) || 0;
        const typeFlag = String.fromCharCode(header[156]);
        const dataBlocks = Math.ceil(fileSize / 512);

        if (typeFlag === '0' || typeFlag === '\0') {
          entries.push(name.replace(/\\/g, '/'));
        }

        offset += 512 + dataBlocks * 512;
      }

      resolve(entries);
    });

    gz.on('error', reject);
    rs.on('error', reject);
    rs.pipe(gz);
  });
}

/**
 * Extract the content of a single file entry from a .tgz by its path.
 * @param {string} tgzPath
 * @param {string} entryPath
 * @returns {Promise<Buffer|null>}
 */
function extractTarEntry(tgzPath, entryPath) {
  return new Promise((resolve, reject) => {
    const gz = createGunzip();
    const rs = createReadStream(tgzPath);

    let buffer = Buffer.alloc(0);

    gz.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    gz.on('end', () => {
      let offset = 0;
      while (offset + 512 <= buffer.length) {
        const header = buffer.slice(offset, offset + 512);
        if (header.every((b) => b === 0)) break;

        let nameEnd = header.indexOf(0, 0);
        if (nameEnd === -1) nameEnd = 100;
        let name = header.slice(0, nameEnd).toString('utf8');

        const prefix = header.slice(345, 500).toString('utf8').replace(/\0.*$/, '');
        if (prefix) name = prefix + '/' + name;

        const sizeStr = header.slice(124, 136).toString('utf8').replace(/\0.*$/, '').trim();
        const fileSize = parseInt(sizeStr, 8) || 0;
        const typeFlag = String.fromCharCode(header[156]);
        const dataBlocks = Math.ceil(fileSize / 512);

        const normalizedName = name.replace(/\\/g, '/');
        if ((typeFlag === '0' || typeFlag === '\0') && normalizedName === entryPath) {
          resolve(buffer.slice(offset + 512, offset + 512 + fileSize));
          return;
        }

        offset += 512 + dataBlocks * 512;
      }

      resolve(null);
    });

    gz.on('error', reject);
    rs.on('error', reject);
    rs.pipe(gz);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('exactly 1 .tgz file exists in tmp/dist/', () => {
  assert.equal(
    tarballs.length,
    1,
    `Expected exactly 1 tarball in ${distDir}, found: ${tarballs.join(', ')}`,
  );
});

const tgzName = tarballs[0] ?? '';
const tgzPath = join(distDir, tgzName);

test('tarball name starts with spec-corpus-corpus-', () => {
  assert.ok(
    tgzName.startsWith('spec-corpus-corpus-'),
    `Tarball name "${tgzName}" should start with "spec-corpus-corpus-"`,
  );
});

test('tarball name ends with .tgz', () => {
  assert.ok(tgzName.endsWith('.tgz'), `Tarball "${tgzName}" should end with ".tgz"`);
});

test('tarball size > 0 bytes', () => {
  const stat = statSync(tgzPath);
  assert.ok(stat.size > 0, `Tarball at ${tgzPath} has zero size`);
});

// Pre-compute tar entries once for the content tests
const tarEntries = tgzName ? await listTarEntries(tgzPath) : [];

test('tarball contains package/dist/release-manifest.json', () => {
  assert.ok(
    tarEntries.includes('package/dist/release-manifest.json'),
    `Expected "package/dist/release-manifest.json" in tarball.\nActual entries: ${tarEntries
      .filter((e) => e.includes('release-manifest'))
      .join(', ')}`,
  );
});

test('tarball contains package/dist/root/README.md', () => {
  assert.ok(
    tarEntries.includes('package/dist/root/README.md'),
    `Expected "package/dist/root/README.md" in tarball.\nRoot entries: ${tarEntries
      .filter((e) => e.startsWith('package/dist/root/'))
      .join(', ')}`,
  );
});

test('tarball contains package/dist/corpora/spec_backend/skills-lock.json', () => {
  assert.ok(
    tarEntries.includes('package/dist/corpora/spec_backend/skills-lock.json'),
    `Expected "package/dist/corpora/spec_backend/skills-lock.json" in tarball.\nSpec_backend entries: ${tarEntries
      .filter((e) => e.includes('spec_backend'))
      .slice(0, 5)
      .join(', ')}`,
  );
});

test('tarball contains backend skill payload under .agents/skills', () => {
  assert.ok(
    tarEntries.includes('package/dist/corpora/spec_backend/.agents/skills/backend-testing/SKILL.md'),
    'Expected backend-testing skill to be included in packed corpus payload',
  );
});

test('release-manifest.json inside tarball has schemaVersion: 1', async () => {
  const content = await extractTarEntry(tgzPath, 'package/dist/release-manifest.json');
  assert.ok(content !== null, 'release-manifest.json not found in tarball');
  const manifest = JSON.parse(content.toString('utf8'));
  assert.equal(
    manifest.schemaVersion,
    1,
    `Expected schemaVersion 1, got: ${manifest.schemaVersion}`,
  );
});
