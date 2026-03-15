/**
 * invalid-version.test.mjs — e2e tests for invalid/corrupt tarball handling
 *
 * Tests:
 *   - Tarball with no release-manifest.json: exit 1 with manifest error
 *   - Tarball with corrupt/non-JSON release-manifest.json: exit 1
 *   - Tarball with mismatched structure (no package/dist/ layout): exit 1
 *
 * Run with: node --test packages/cli/test/e2e/invalid-version.test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
} from 'node:fs';
import {
  mkdir,
  rm,
  access,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { runBootstrap } from '../../src/commands/bootstrap.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function captureOutput(fn) {
  const stdoutChunks = [];
  const stderrChunks = [];
  const origStdout = process.stdout.write.bind(process.stdout);
  const origStderr = process.stderr.write.bind(process.stderr);

  process.stdout.write = (chunk) => {
    stdoutChunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
    return true;
  };
  process.stderr.write = (chunk) => {
    stderrChunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
    return true;
  };

  let result;
  try {
    result = await fn();
  } finally {
    process.stdout.write = origStdout;
    process.stderr.write = origStderr;
  }

  return {
    stdout: stdoutChunks.join(''),
    stderr: stderrChunks.join(''),
    result,
  };
}

function parseJsonLine(output) {
  const line = output.split('\n').find((l) => l.trim().startsWith('{'));
  assert.ok(line, 'Expected at least one JSON line in stdout');
  return JSON.parse(line);
}

/**
 * Create a .tgz tarball from a directory structure.
 * Windows-safe: uses --force-local and forward slashes.
 * @param {string} sourceDir - dir containing "package/" structure to tar
 * @param {string} outputPath - output .tgz path
 */
function createTarball(sourceDir, outputPath) {
  const args = ['--force-local', '-czf'];
  const srcFwd = sourceDir.replace(/\\/g, '/');
  const outFwd = outputPath.replace(/\\/g, '/');
  args.push(outFwd, '-C', srcFwd, 'package');

  const result = execFileSync('tar', args, {
    encoding: 'utf-8',
    timeout: 30_000,
    stdio: 'pipe',
  });
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let tmpBase;
let tarballNoManifest;
let tarballCorruptManifest;
let tarballBadStructure;

before(async () => {
  tmpBase = join(tmpdir(), `spec-corpus-invalid-e2e-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });

  // --- Tarball 1: No release-manifest.json ---
  const noManifestDir = join(tmpBase, 'build-no-manifest');
  mkdirSync(join(noManifestDir, 'package', 'dist', 'root'), { recursive: true });
  writeFileSync(
    join(noManifestDir, 'package', 'dist', 'root', 'README.md'),
    '# No manifest tarball\n',
    'utf-8'
  );
  tarballNoManifest = join(tmpBase, 'no-manifest.tgz');
  createTarball(noManifestDir, tarballNoManifest);

  // --- Tarball 2: Corrupt (non-JSON) release-manifest.json ---
  const corruptManifestDir = join(tmpBase, 'build-corrupt-manifest');
  mkdirSync(join(corruptManifestDir, 'package', 'dist', 'root'), { recursive: true });
  writeFileSync(
    join(corruptManifestDir, 'package', 'dist', 'root', 'README.md'),
    '# Corrupt manifest tarball\n',
    'utf-8'
  );
  writeFileSync(
    join(corruptManifestDir, 'package', 'dist', 'release-manifest.json'),
    'THIS IS NOT JSON {{{{',
    'utf-8'
  );
  tarballCorruptManifest = join(tmpBase, 'corrupt-manifest.tgz');
  createTarball(corruptManifestDir, tarballCorruptManifest);

  // --- Tarball 3: Mismatched structure (no package/dist/) ---
  const badStructureDir = join(tmpBase, 'build-bad-structure');
  mkdirSync(join(badStructureDir, 'package', 'src'), { recursive: true });
  writeFileSync(
    join(badStructureDir, 'package', 'src', 'index.js'),
    'console.log("wrong structure");\n',
    'utf-8'
  );
  // Has package/ but no dist/ and no release-manifest.json
  tarballBadStructure = join(tmpBase, 'bad-structure.tgz');
  createTarball(badStructureDir, tarballBadStructure);
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Tarball with no release-manifest.json
// ---------------------------------------------------------------------------

describe('invalid — tarball missing release-manifest.json', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'test-no-manifest');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(() =>
      runBootstrap({
        target,
        version: null,
        from: tarballNoManifest,
        dryRun: false,
      })
    );
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('emits event="error" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'error');
    assert.strictEqual(json.command, 'bootstrap');
  });

  it('error message mentions manifest', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(
      json.error.toLowerCase().includes('manifest') ||
        json.error.toLowerCase().includes('release-manifest'),
      `Expected error about manifest, got: ${json.error}`
    );
  });

  it('does not leave .spec-corpus/install.json', () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    assert.ok(!existsSync(installJsonPath), 'install.json must NOT exist after invalid tarball');
  });
});

// ---------------------------------------------------------------------------
// Tarball with corrupt/non-JSON release-manifest.json
// ---------------------------------------------------------------------------

describe('invalid — tarball with corrupt release-manifest.json', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'test-corrupt-manifest');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(() =>
      runBootstrap({
        target,
        version: null,
        from: tarballCorruptManifest,
        dryRun: false,
      })
    );
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('emits event="error" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'error');
    assert.strictEqual(json.command, 'bootstrap');
  });

  it('error message mentions JSON parse error', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(
      json.error.toLowerCase().includes('json') ||
        json.error.toLowerCase().includes('parse') ||
        json.error.toLowerCase().includes('unexpected'),
      `Expected JSON parse error, got: ${json.error}`
    );
  });

  it('does not leave .spec-corpus/install.json', () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    assert.ok(!existsSync(installJsonPath), 'install.json must NOT exist after corrupt tarball');
  });
});

// ---------------------------------------------------------------------------
// Tarball with mismatched structure (no package/dist/)
// ---------------------------------------------------------------------------

describe('invalid — tarball with mismatched structure', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'test-bad-structure');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(() =>
      runBootstrap({
        target,
        version: null,
        from: tarballBadStructure,
        dryRun: false,
      })
    );
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('emits event="error" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'error');
    assert.strictEqual(json.command, 'bootstrap');
  });

  it('error message mentions manifest or structure issue', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(
      json.error.toLowerCase().includes('manifest') ||
        json.error.toLowerCase().includes('not found') ||
        json.error.toLowerCase().includes('structure'),
      `Expected error about missing manifest/structure, got: ${json.error}`
    );
  });

  it('does not leave .spec-corpus/install.json', () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    assert.ok(!existsSync(installJsonPath), 'install.json must NOT exist after bad structure');
  });
});
