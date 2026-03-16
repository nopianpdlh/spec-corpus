/**
 * build-snapshot.test.mjs
 *
 * Tests for the corpus snapshot builder.
 * Uses node:test + node:assert/strict.
 * Each test creates its own temp staging dir.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const builderScript = join(__dirname, '..', 'scripts', 'build-snapshot.mjs');

/**
 * Run the snapshot builder into a fresh temp dir, return stagingDir.
 */
function runBuilder() {
  const stagingDir = mkdtempSync(join(tmpdir(), 'corpus-stage-test-'));
  execFileSync(process.execPath, [builderScript, '--out', stagingDir], {
    stdio: 'pipe',
  });
  return stagingDir;
}

// Run once and share across all tests for speed
let stagingDir;

before(() => {
  stagingDir = runBuilder();
});

describe('build-snapshot', () => {
  it('top-level entries are exactly ["corpora", "root"]', () => {
    const entries = readdirSync(stagingDir).sort();
    assert.deepStrictEqual(entries, ['corpora', 'root']);
  });

  it('all 5 root docs are present under root/', () => {
    const rootDir = join(stagingDir, 'root');
    const expected = [
      'README.md',
      'OPERATING-MODEL.md',
      'ARCHITECTURE.md',
      'CENTRAL-CHECKLIST.md',
      'CONTRIBUTING.md',
    ];
    for (const doc of expected) {
      assert.ok(existsSync(join(rootDir, doc)), `root/${doc} must exist`);
    }
  });

  it('all 5 corpora are present under corpora/', () => {
    const corporaDir = join(stagingDir, 'corpora');
    const expected = [
      'spec_frontend',
      'spec_backend',
      'spec_code-quality',
      'spec_documentation',
      'spec_infrastructure',
    ];
    for (const corpusId of expected) {
      assert.ok(
        existsSync(join(corporaDir, corpusId)),
        `corpora/${corpusId} must exist`
      );
    }
  });

  it('corpora/spec_backend/skills-lock.json exists', () => {
    const p = join(stagingDir, 'corpora', 'spec_backend', 'skills-lock.json');
    assert.ok(existsSync(p), 'corpora/spec_backend/skills-lock.json must exist');
  });

  it('.agents/ directory is staged for every corpus', () => {
    const corporaDir = join(stagingDir, 'corpora');
    const corpora = readdirSync(corporaDir);
    for (const corpusId of corpora) {
      const agentsDir = join(corporaDir, corpusId, '.agents');
      assert.ok(
        existsSync(agentsDir),
        `.agents/ must be staged under corpora/${corpusId}`
      );
    }
  });

  it('stages backend-testing skill under spec_backend/.agents/skills', () => {
    const skillPath = join(
      stagingDir,
      'corpora',
      'spec_backend',
      '.agents',
      'skills',
      'backend-testing',
      'SKILL.md'
    );
    assert.ok(existsSync(skillPath), 'spec_backend/.agents/skills/backend-testing/SKILL.md must exist');
  });

  it('release-manifest-input.json exists one level above staging dir', () => {
    const manifestPath = join(stagingDir, '..', 'release-manifest-input.json');
    assert.ok(existsSync(manifestPath), 'release-manifest-input.json must exist one level above staging dir');
  });

  it('manifest files array has path, hash (64 hex chars), size (non-negative integer)', () => {
    const manifestPath = join(stagingDir, '..', 'release-manifest-input.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assert.ok(Array.isArray(manifest.files), 'files must be an array');
    assert.ok(manifest.files.length > 0, 'files must not be empty');

    const hexPattern = /^[0-9a-f]{64}$/;
    for (const entry of manifest.files) {
      assert.ok(typeof entry.path === 'string' && entry.path.length > 0, 'path must be a non-empty string');
      assert.ok(hexPattern.test(entry.hash), `hash must be 64 hex chars, got: ${entry.hash}`);
      assert.ok(Number.isInteger(entry.size) && entry.size >= 0, `size must be non-negative integer, got: ${entry.size}`);
    }
  });
});
