/**
 * dirty-state.test.mjs — e2e tests for dirty managed payload detection
 *
 * Tests the verify and status commands when managed payload files have been
 * modified, deleted, or unexpected files have been added.
 *
 * Run with: node --test packages/cli/test/e2e/dirty-state.test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile, unlink, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
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

/**
 * Bootstrap a fresh target for dirty-state tests.
 */
async function bootstrapFresh(target) {
  await mkdir(target, { recursive: true });
  await captureOutput(() =>
    runBootstrap({
      target,
      version: null,
      from: TARBALL_PATH,
      dryRun: false,
    })
  );
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const corpusVersion = JSON.parse(readFileSync(resolve('packages/corpus/package.json'), 'utf-8')).version;
const TARBALL_PATH = resolve(`tmp/dist/spec-corpus-corpus-${corpusVersion}.tgz`);
let tmpBase;

before(async () => {
  try {
    const { access } = await import('node:fs/promises');
    await access(TARBALL_PATH);
  } catch {
    throw new Error(
      `Corpus tarball not found at ${TARBALL_PATH}. Run: npm run pack:corpus`
    );
  }
  tmpBase = join(tmpdir(), `spec-corpus-dirty-e2e-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Modified file detection
// ---------------------------------------------------------------------------

describe('verify — detects modified file', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'modified-file');
    await bootstrapFresh(target);

    // Modify a file in the flat managed payload
    const readmePath = join(target, '.spec-corpus', 'README.md');
    await writeFile(readmePath, 'MODIFIED CONTENT\n', 'utf-8');

    captured = await captureOutput(() => runVerify({ target }));
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('reports clean=false', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.clean, false);
  });

  it('reports the modified file in conflicts', () => {
    const json = parseJsonLine(captured.stdout);
    const modified = json.conflicts.find((c) => c.file === 'README.md');
    assert.ok(modified, 'Must report README.md as conflict');
    assert.strictEqual(modified.status, 'modified');
  });

  it('only reports the one modified file', () => {
    const json = parseJsonLine(captured.stdout);
    const modConflicts = json.conflicts.filter((c) => c.status === 'modified');
    assert.strictEqual(modConflicts.length, 1);
  });

  it('stderr mentions dirty', () => {
    assert.ok(captured.stderr.includes('dirty'));
  });
});

// ---------------------------------------------------------------------------
// Missing file detection
// ---------------------------------------------------------------------------

describe('verify — detects missing file', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'missing-file');
    await bootstrapFresh(target);

    // Delete a file from the flat managed payload
    const readmePath = join(target, '.spec-corpus', 'README.md');
    await unlink(readmePath);

    captured = await captureOutput(() => runVerify({ target }));
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('reports clean=false', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.clean, false);
  });

  it('reports the missing file in conflicts', () => {
    const json = parseJsonLine(captured.stdout);
    const missing = json.conflicts.find((c) => c.file === 'README.md');
    assert.ok(missing, 'Must report README.md as conflict');
    assert.strictEqual(missing.status, 'missing');
  });
});

// ---------------------------------------------------------------------------
// Unexpected file detection
// ---------------------------------------------------------------------------

describe('verify — detects unexpected file', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'unexpected-file');
    await bootstrapFresh(target);

    // Add an unexpected file to the flat managed payload
    const extraPath = join(target, '.spec-corpus', 'HACKED.md');
    await writeFile(extraPath, 'Unexpected file\n', 'utf-8');

    captured = await captureOutput(() => runVerify({ target }));
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('reports clean=false', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.clean, false);
  });

  it('reports the unexpected file in conflicts', () => {
    const json = parseJsonLine(captured.stdout);
    const unexpected = json.conflicts.find(
      (c) => c.file === 'HACKED.md'
    );
    assert.ok(unexpected, 'Must report HACKED.md as conflict');
    assert.strictEqual(unexpected.status, 'unexpected');
  });
});

// ---------------------------------------------------------------------------
// Multiple dirty categories at once
// ---------------------------------------------------------------------------

describe('verify — multiple dirty categories', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'multi-dirty');
    await bootstrapFresh(target);

    const specRoot = join(target, '.spec-corpus');

    // Modify a file
    await writeFile(
      join(specRoot, 'README.md'),
      'MODIFIED\n',
      'utf-8'
    );

    // Delete a file
    await unlink(join(specRoot, 'CONTRIBUTING.md'));

    // Add an unexpected file
    await writeFile(
      join(specRoot, 'EXTRA.md'),
      'Extra\n',
      'utf-8'
    );

    captured = await captureOutput(() => runVerify({ target }));
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('reports all three conflict types', () => {
    const json = parseJsonLine(captured.stdout);
    const statuses = new Set(json.conflicts.map((c) => c.status));
    assert.ok(statuses.has('modified'), 'must have modified conflict');
    assert.ok(statuses.has('missing'), 'must have missing conflict');
    assert.ok(statuses.has('unexpected'), 'must have unexpected conflict');
  });

  it('reports at least 3 conflicts', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(json.conflicts.length >= 3);
  });

  it('conflicts are sorted by file path', () => {
    const json = parseJsonLine(captured.stdout);
    const files = json.conflicts.map((c) => c.file);
    const sorted = [...files].sort();
    assert.deepStrictEqual(files, sorted);
  });
});

// ---------------------------------------------------------------------------
// Status reports dirty state
// ---------------------------------------------------------------------------

describe('status — reports dirty for modified snapshot', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'status-dirty');
    await bootstrapFresh(target);

    // Modify a file in flat managed payload
    const readmePath = join(target, '.spec-corpus', 'README.md');
    await writeFile(readmePath, 'TAMPERED\n', 'utf-8');

    captured = await captureOutput(() => runStatus({ target }));
  });

  it('exits with code 0 (status always succeeds for installed)', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('reports status=installed', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.status, 'installed');
  });

  it('reports clean=false', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.clean, false);
  });

  it('reports activeVersion', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.activeVersion, corpusVersion);
  });

  it('stderr includes integrity: dirty', () => {
    assert.ok(captured.stderr.includes('integrity: dirty'));
  });
});
