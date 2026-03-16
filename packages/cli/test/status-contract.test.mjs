/**
 * status-contract.test.mjs — output contract tests for the status command
 *
 * Tests the StatusResult JSON shape produced by runStatus() by mocking
 * the filesystem interaction. Uses node:test and node:assert (built-in).
 *
 * Run with: node --test packages/cli/test/status-contract.test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

// We test runStatus by:
// 1. Creating real temp directories to simulate target project state
// 2. Capturing stdout/stderr output
// 3. Asserting on the parsed JSON shape

import { runStatus } from '../src/commands/status.mjs';

const cliVersion = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
).version;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Capture stdout writes from an async function.
 * @param {() => Promise<void>} fn
 * @returns {Promise<string>} captured stdout text
 */
async function captureStdout(fn) {
  const chunks = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...args) => {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
    return true;
  };
  try {
    await fn();
  } finally {
    process.stdout.write = originalWrite;
  }
  return chunks.join('');
}

/**
 * Capture stderr writes from an async function.
 * @param {() => Promise<void>} fn
 * @returns {Promise<string>} captured stderr text
 */
async function captureStderr(fn) {
  const chunks = [];
  const originalWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, ...args) => {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
    return true;
  };
  try {
    await fn();
  } finally {
    process.stderr.write = originalWrite;
  }
  return chunks.join('');
}

/**
 * Capture stdout + stderr from an async function.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<{result: T, stdout: string, stderr: string}>}
 */
async function captureOutput(fn) {
  let result;
  let stderr = '';
  const stdout = await captureStdout(async () => {
    stderr = await captureStderr(async () => {
      result = await fn();
    });
  });
  return { result, stdout, stderr };
}

/**
 * Parse first JSON line from captured output.
 * @param {string} output
 * @returns {Object}
 */
function parseFirstJsonLine(output) {
  const line = output.split('\n').find(l => l.trim().startsWith('{'));
  assert.ok(line, 'Expected at least one JSON line in stdout output');
  return JSON.parse(line);
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

let tmpBase;

before(async () => {
  tmpBase = join(tmpdir(), `spec-corpus-status-test-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  await rm(tmpBase, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Status: not-installed
// ---------------------------------------------------------------------------

describe('status contract — not-installed', () => {
  it('returns status="not-installed" when target has no .spec-corpus/', async () => {
    const target = join(tmpBase, 'empty-project');
    await mkdir(target, { recursive: true });

    let result;
    const out = await captureStdout(async () => {
      result = await runStatus({ target });
    });

    assert.strictEqual(result.exitCode, 0);

    const json = parseFirstJsonLine(out);
    assert.strictEqual(json.event, 'status');
    assert.strictEqual(json.command, 'status');
    assert.strictEqual(json.status, 'not-installed');
    assert.strictEqual(json.target, target);
    assert.strictEqual(json.installRecord, null);
    assert.strictEqual(json.error, null);
  });

  it('exits 0 when not-installed', async () => {
    const target = join(tmpBase, 'empty-project-2');
    await mkdir(target, { recursive: true });

    const result = await runStatus({ target });
    assert.strictEqual(result.exitCode, 0);
  });
});

// ---------------------------------------------------------------------------
// Status: installed
// ---------------------------------------------------------------------------

describe('status contract — installed', () => {
  const validRecord = {
    schemaVersion: 1,
    layoutVersion: 2,
    corpusPackageName: '@spec-corpus/corpus',
    corpusPackageVersion: '0.1.0',
    corpusPackageIntegrity: 'sha512-abc123',
    cliPackageName: 'spec-corpus',
    cliPackageVersion: cliVersion,
    activeSnapshotVersion: '0.1.0',
    installedAt: '2026-03-16T00:00:00.000Z',
    installSource: 'registry',
  };

  it('returns status="installed" when install.json exists and is valid JSON', async () => {
    const target = join(tmpBase, 'installed-project');
    await mkdir(join(target, '.spec-corpus'), { recursive: true });
    await writeFile(
      join(target, '.spec-corpus', 'install.json'),
      JSON.stringify(validRecord, null, 2),
      'utf-8'
    );

    let result;
    const out = await captureStdout(async () => {
      result = await runStatus({ target });
    });

    assert.strictEqual(result.exitCode, 0);

    const json = parseFirstJsonLine(out);
    assert.strictEqual(json.event, 'status');
    assert.strictEqual(json.command, 'status');
    assert.strictEqual(json.status, 'installed');
    assert.strictEqual(json.target, target);
    assert.ok(json.installRecord !== null, 'installRecord must be present');
    assert.strictEqual(json.error, null);
  });

  it('includes the install record in output', async () => {
    const target = join(tmpBase, 'installed-project-2');
    await mkdir(join(target, '.spec-corpus'), { recursive: true });
    await writeFile(
      join(target, '.spec-corpus', 'install.json'),
      JSON.stringify(validRecord, null, 2),
      'utf-8'
    );

    const out = await captureStdout(async () => {
      await runStatus({ target });
    });

    const json = parseFirstJsonLine(out);
    assert.strictEqual(json.installRecord.activeSnapshotVersion, '0.1.0');
    assert.strictEqual(json.installRecord.corpusPackageName, '@spec-corpus/corpus');
    assert.strictEqual(json.installRecord.installSource, 'registry');
  });

  it('exits 0 when installed', async () => {
    const target = join(tmpBase, 'installed-project-3');
    await mkdir(join(target, '.spec-corpus'), { recursive: true });
    await writeFile(
      join(target, '.spec-corpus', 'install.json'),
      JSON.stringify(validRecord, null, 2),
      'utf-8'
    );

    const result = await runStatus({ target });
    assert.strictEqual(result.exitCode, 0);
  });
});

describe('status contract — legacy v1 installed path display', () => {
  it('stderr shows legacy snapshot path for layout v1 records', async () => {
    const target = join(tmpBase, 'legacy-installed');
    await mkdir(join(target, '.spec-corpus'), { recursive: true });
    await writeFile(
      join(target, '.spec-corpus', 'install.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          corpusPackageName: '@spec-corpus/corpus',
          corpusPackageVersion: '0.0.1',
          corpusPackageIntegrity: 'sha512-legacy',
          cliPackageName: 'spec-corpus',
          cliPackageVersion: '0.1.4',
          activeSnapshotVersion: '0.0.1',
          activeSnapshotPath: '.spec-corpus/snapshots/0.0.1',
          installedAt: '2026-03-16T00:00:00.000Z',
          installSource: 'tarball',
        },
        null,
        2
      ) + '\n',
      'utf-8'
    );

    const captured = await captureOutput(() => runStatus({ target }));
    assert.equal(captured.result.exitCode, 0);
    assert.ok(captured.stderr.includes('layout:   v1'));
    assert.ok(captured.stderr.includes('path:     .spec-corpus/snapshots/0.0.1'));
  });
});

// ---------------------------------------------------------------------------
// Status: corrupt (invalid JSON in install.json)
// ---------------------------------------------------------------------------

describe('status contract — corrupt', () => {
  it('returns status="corrupt" when install.json is invalid JSON', async () => {
    const target = join(tmpBase, 'corrupt-project');
    await mkdir(join(target, '.spec-corpus'), { recursive: true });
    await writeFile(
      join(target, '.spec-corpus', 'install.json'),
      'THIS IS NOT JSON { broken',
      'utf-8'
    );

    let result;
    const out = await captureStdout(async () => {
      result = await runStatus({ target });
    });

    assert.strictEqual(result.exitCode, 1);

    const json = parseFirstJsonLine(out);
    assert.strictEqual(json.event, 'status');
    assert.strictEqual(json.command, 'status');
    assert.strictEqual(json.status, 'corrupt');
    assert.ok(json.error !== null && typeof json.error === 'string', 'error must be a non-null string');
    assert.strictEqual(json.installRecord, null);
  });

  it('exits 1 when corrupt', async () => {
    const target = join(tmpBase, 'corrupt-project-2');
    await mkdir(join(target, '.spec-corpus'), { recursive: true });
    await writeFile(
      join(target, '.spec-corpus', 'install.json'),
      '<<<INVALID>>>',
      'utf-8'
    );

    const result = await runStatus({ target });
    assert.strictEqual(result.exitCode, 1);
  });
});

// ---------------------------------------------------------------------------
// Output shape invariants
// ---------------------------------------------------------------------------

describe('status contract — output shape invariants', () => {
  it('always emits a JSON line to stdout', async () => {
    const target = join(tmpBase, 'shape-check');
    await mkdir(target, { recursive: true });

    const out = await captureStdout(async () => {
      await runStatus({ target });
    });

    // Must have at least one parseable JSON line
    const line = out.split('\n').find(l => l.trim().startsWith('{'));
    assert.ok(line, 'stdout must contain a JSON line');
    const json = JSON.parse(line);

    // Required fields always present
    assert.ok('event' in json, 'event must be present');
    assert.ok('command' in json, 'command must be present');
    assert.ok('status' in json, 'status must be present');
    assert.ok('target' in json, 'target must be present');
  });

  it('event field is always "status"', async () => {
    const target = join(tmpBase, 'shape-check-2');
    await mkdir(target, { recursive: true });

    const out = await captureStdout(async () => {
      await runStatus({ target });
    });

    const json = parseFirstJsonLine(out);
    assert.strictEqual(json.event, 'status');
  });

  it('command field is always "status"', async () => {
    const target = join(tmpBase, 'shape-check-3');
    await mkdir(target, { recursive: true });

    const out = await captureStdout(async () => {
      await runStatus({ target });
    });

    const json = parseFirstJsonLine(out);
    assert.strictEqual(json.command, 'status');
  });

  it('status field is one of: installed, not-installed, corrupt', async () => {
    const target = join(tmpBase, 'shape-check-4');
    await mkdir(target, { recursive: true });

    const out = await captureStdout(async () => {
      await runStatus({ target });
    });

    const json = parseFirstJsonLine(out);
    const validStatuses = ['installed', 'not-installed', 'corrupt'];
    assert.ok(validStatuses.includes(json.status), `status must be one of ${validStatuses.join(', ')}, got: ${json.status}`);
  });
});
