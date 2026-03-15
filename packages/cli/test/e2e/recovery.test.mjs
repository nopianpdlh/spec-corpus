/**
 * recovery.test.mjs — e2e tests for interrupted-install recovery
 *
 * Tests:
 *   - After simulated partial failure, install.json does NOT point to new version
 *   - Re-run after failure succeeds cleanly
 *   - No orphaned .tmp-* dirs after success or failure
 *   - Subprocess-based failure injection for atomic rename testing
 *
 * Strategy: ESM module namespace objects are frozen, so we cannot monkey-patch
 * fs.renameSync directly. Instead we use two approaches:
 * 1. Subprocess with --eval that uses require() to get a mutable fs object
 * 2. Simulated partial state (orphaned temp dirs, no snapshot) to test recovery
 *
 * Run with: node --test packages/cli/test/e2e/recovery.test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import {
  mkdir,
  rm,
  readFile,
  access,
  readdir,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
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

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const TARBALL_PATH = resolve('tmp/dist/spec-corpus-corpus-0.1.0.tgz');
let tmpBase;

before(async () => {
  try {
    await access(TARBALL_PATH);
  } catch {
    throw new Error(
      `Corpus tarball not found at ${TARBALL_PATH}. Run: npm run pack:corpus`
    );
  }
  tmpBase = join(tmpdir(), `spec-corpus-recovery-e2e-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Subprocess-based failure injection: renameSync throws mid-operation
// ---------------------------------------------------------------------------

describe('recovery — subprocess: renameSync failure prevents install.json', () => {
  let target;
  let subResult;

  before(async () => {
    target = join(tmpBase, 'subprocess-fail');
    await mkdir(target, { recursive: true });

    // Run a subprocess that patches fs.renameSync via require() (CJS gives mutable fs)
    // then dynamically imports install.mjs. The patch throws on snapshot renames.
    const script = `
      const fs = require('node:fs');
      const origRename = fs.renameSync;
      fs.renameSync = function(src, dest) {
        if (dest.includes('snapshots')) {
          fs.renameSync = origRename;
          throw new Error('SIMULATED_FAILURE');
        }
        return origRename(src, dest);
      };

      async function main() {
        const { installFromTarball } = await import('./packages/cli/src/install.mjs');
        try {
          installFromTarball({
            tarballPath: ${JSON.stringify(TARBALL_PATH)},
            target: ${JSON.stringify(target)},
            installSource: 'tarball',
          });
          process.stdout.write('SUCCESS');
        } catch (err) {
          process.stdout.write('ERROR:' + err.message);
          process.exit(1);
        }
      }
      main();
    `;

    subResult = spawnSync(process.execPath, ['-e', script], {
      encoding: 'utf-8',
      timeout: 30_000,
      cwd: resolve('.'),
    });
  });

  it('subprocess exits with non-zero (failure)', () => {
    assert.notStrictEqual(subResult.status, 0, 'Should exit non-zero');
  });

  it('subprocess output mentions SIMULATED_FAILURE', () => {
    assert.ok(
      subResult.stdout.includes('SIMULATED_FAILURE'),
      `Expected SIMULATED_FAILURE in output, got: ${subResult.stdout}`
    );
  });

  it('install.json does NOT exist after failed install', () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    assert.ok(
      !existsSync(installJsonPath),
      'install.json must NOT exist after mid-rename failure'
    );
  });

  it('snapshot directory does NOT exist after failed install', () => {
    const snapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    assert.ok(
      !existsSync(snapshotDir),
      'Snapshot dir must NOT exist after mid-rename failure'
    );
  });

  it('no orphaned .tmp-* directories after failure', () => {
    const specDir = join(target, '.spec-corpus');
    if (!existsSync(specDir)) return;
    const entries = readdirSync(specDir);
    const tmpDirs = entries.filter((e) => e.startsWith('.tmp-'));
    assert.strictEqual(tmpDirs.length, 0, 'No .tmp-* dirs should remain after failure');
  });
});

// ---------------------------------------------------------------------------
// Re-run after subprocess failure succeeds cleanly
// ---------------------------------------------------------------------------

describe('recovery — re-run after subprocess failure succeeds', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'subprocess-retry');
    await mkdir(target, { recursive: true });

    // First: run with injected failure via subprocess
    const script = `
      const fs = require('node:fs');
      const origRename = fs.renameSync;
      fs.renameSync = function(src, dest) {
        if (dest.includes('snapshots')) {
          fs.renameSync = origRename;
          throw new Error('SIMULATED_FAILURE');
        }
        return origRename(src, dest);
      };
      async function main() {
        const { installFromTarball } = await import('./packages/cli/src/install.mjs');
        try {
          installFromTarball({
            tarballPath: ${JSON.stringify(TARBALL_PATH)},
            target: ${JSON.stringify(target)},
            installSource: 'tarball',
          });
        } catch (err) {
          process.exit(1);
        }
      }
      main();
    `;

    spawnSync(process.execPath, ['-e', script], {
      encoding: 'utf-8',
      timeout: 30_000,
      cwd: resolve('.'),
    });

    // Second: run normally — should succeed
    captured = await captureOutput(() =>
      runBootstrap({
        target,
        version: null,
        from: TARBALL_PATH,
        dryRun: false,
      })
    );
  });

  it('re-run exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('emits event="complete"', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'complete');
    assert.strictEqual(json.command, 'bootstrap');
  });

  it('install.json exists and points to v0.1.0', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    await access(installJsonPath);
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.activeSnapshotVersion, '0.1.0');
  });

  it('snapshot directory exists with expected content', async () => {
    const snapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    await access(snapshotDir);
    await access(join(snapshotDir, 'root'));
    await access(join(snapshotDir, 'corpora'));
  });

  it('no orphaned .tmp-* directories after success', async () => {
    const specDir = join(target, '.spec-corpus');
    const entries = await readdir(specDir);
    const tmpDirs = entries.filter((e) => e.startsWith('.tmp-'));
    assert.strictEqual(tmpDirs.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Simulated partial failure state: orphaned temp dirs, no snapshot
// ---------------------------------------------------------------------------

describe('recovery — simulated interrupted install (orphaned temp dirs)', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'orphaned-state');
    await mkdir(target, { recursive: true });

    // Simulate interrupted state: .spec-corpus/ has temp dirs but no snapshots
    const specDir = join(target, '.spec-corpus');
    mkdirSync(specDir, { recursive: true });
    mkdirSync(join(specDir, '.tmp-extract-99999'), { recursive: true });
    mkdirSync(join(specDir, '.tmp-snap-99999'), { recursive: true });
    writeFileSync(
      join(specDir, '.tmp-snap-99999', 'dummy.txt'),
      'leftover from interrupted install',
      'utf-8'
    );

    captured = await captureOutput(() =>
      runBootstrap({
        target,
        version: null,
        from: TARBALL_PATH,
        dryRun: false,
      })
    );
  });

  it('bootstrap succeeds despite orphaned temp dirs', () => {
    assert.strictEqual(captured.result.exitCode, 0);
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'complete');
    assert.strictEqual(json.version, '0.1.0');
  });

  it('install.json exists and points to v0.1.0', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.activeSnapshotVersion, '0.1.0');
  });

  it('snapshot directory exists', async () => {
    const snapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    await access(snapshotDir);
    await access(join(snapshotDir, 'root'));
    await access(join(snapshotDir, 'corpora'));
  });
});

// ---------------------------------------------------------------------------
// No orphaned temp dirs after normal success
// ---------------------------------------------------------------------------

describe('recovery — no orphaned temp dirs after normal success', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'clean-success');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(() =>
      runBootstrap({
        target,
        version: null,
        from: TARBALL_PATH,
        dryRun: false,
      })
    );
  });

  it('exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('no .tmp-* directories under .spec-corpus/', async () => {
    const specDir = join(target, '.spec-corpus');
    const entries = await readdir(specDir);
    const tmpDirs = entries.filter((e) => e.startsWith('.tmp-'));
    assert.strictEqual(tmpDirs.length, 0, 'No .tmp-* dirs should remain after clean install');
  });
});
