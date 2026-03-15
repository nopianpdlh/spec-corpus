/**
 * verify-clean.test.mjs — e2e tests for clean snapshot verification
 *
 * Tests the verify command on a freshly bootstrapped snapshot where all
 * files should match the release manifest (clean state).
 *
 * Also tests the status command's clean/dirty reporting.
 *
 * Run with: node --test packages/cli/test/e2e/verify-clean.test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, readFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runBootstrap } from '../../src/commands/bootstrap.mjs';
import { runVerify } from '../../src/commands/verify.mjs';
import { runStatus } from '../../src/commands/status.mjs';

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
  tmpBase = join(tmpdir(), `spec-corpus-verify-clean-e2e-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Verify on clean snapshot
// ---------------------------------------------------------------------------

describe('verify — clean snapshot', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'clean-project');
    await mkdir(target, { recursive: true });

    // Bootstrap first
    await captureOutput(() =>
      runBootstrap({ target, version: null, from: TARBALL_PATH, dryRun: false })
    );

    // Run verify
    captured = await captureOutput(() => runVerify({ target }));
  });

  it('exits with code 0 for clean snapshot', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('emits event="verify" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'verify');
    assert.strictEqual(json.command, 'verify');
  });

  it('reports clean=true', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.clean, true);
  });

  it('reports activeVersion', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.activeVersion, '0.1.0');
  });

  it('reports empty conflicts array', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(Array.isArray(json.conflicts));
    assert.strictEqual(json.conflicts.length, 0);
  });

  it('reports target in JSON output', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.target, target);
  });

  it('emits human-readable clean status to stderr', () => {
    assert.ok(captured.stderr.includes('[verify]'));
    assert.ok(captured.stderr.includes('clean'));
  });
});

// ---------------------------------------------------------------------------
// Verify creates release-manifest.json in snapshot
// ---------------------------------------------------------------------------

describe('verify — release-manifest.json in snapshot', () => {
  let target;

  before(async () => {
    target = join(tmpBase, 'manifest-check');
    await mkdir(target, { recursive: true });

    await captureOutput(() =>
      runBootstrap({ target, version: null, from: TARBALL_PATH, dryRun: false })
    );
  });

  it('release-manifest.json exists in snapshot directory', async () => {
    const manifestPath = join(
      target,
      '.spec-corpus',
      'snapshots',
      '0.1.0',
      'release-manifest.json'
    );
    await access(manifestPath);
    const raw = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);
    assert.strictEqual(manifest.schemaVersion, 1);
    assert.ok(Array.isArray(manifest.files), 'manifest must have files array');
  });
});

// ---------------------------------------------------------------------------
// Status reports clean when installed
// ---------------------------------------------------------------------------

describe('status — reports clean for fresh install', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'status-clean');
    await mkdir(target, { recursive: true });

    await captureOutput(() =>
      runBootstrap({ target, version: null, from: TARBALL_PATH, dryRun: false })
    );

    captured = await captureOutput(() => runStatus({ target }));
  });

  it('exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('reports status=installed', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.status, 'installed');
  });

  it('reports clean=true', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.clean, true);
  });

  it('reports activeVersion', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.activeVersion, '0.1.0');
  });

  it('stderr includes integrity: clean', () => {
    assert.ok(captured.stderr.includes('integrity: clean'));
  });
});

// ---------------------------------------------------------------------------
// Verify on not-installed target
// ---------------------------------------------------------------------------

describe('verify — not installed target', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'not-installed');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(() => runVerify({ target }));
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('emits error in JSON', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.clean, false);
    assert.ok(json.error);
    assert.ok(json.error.includes('not found'));
  });

  it('emits ERROR to stderr', () => {
    assert.ok(captured.stderr.includes('ERROR'));
  });
});
