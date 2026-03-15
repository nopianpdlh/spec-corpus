/**
 * update-force.test.mjs — e2e tests for --force update flows
 *
 * Tests:
 *   - Update blocked by dirty state (no --force)
 *   - Update forced through dirty state (--force)
 *   - After forced update: install.json points to new version
 *   - After forced update: old snapshot preserved
 *
 * Run with: node --test packages/cli/test/e2e/update-force.test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdir,
  rm,
  readFile,
  writeFile,
  access,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { runUpdate } from '../../src/commands/update.mjs';

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

function sha256Hex(content) {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Create a fake v0.0.1 snapshot with a single README.md file.
 */
async function createFakeSnapshot(target) {
  const specDir = join(target, '.spec-corpus');
  const snapshotDir = join(specDir, 'snapshots', '0.0.1');
  const rootDir = join(snapshotDir, 'root');

  await mkdir(rootDir, { recursive: true });

  const readmeContent = '# Old Corpus v0.0.1\nThis is the old version.\n';
  await writeFile(join(rootDir, 'README.md'), readmeContent, 'utf-8');

  const manifest = {
    schemaVersion: 1,
    packageName: '@spec-corpus/corpus',
    packageVersion: '0.0.1',
    sourceCommit: 'fake-commit-hash',
    sourceTag: '',
    generatedAt: '2025-01-01T00:00:00.000Z',
    rootDocs: [],
    corpora: [],
    files: [
      {
        path: 'root/README.md',
        hash: sha256Hex(readmeContent),
        size: Buffer.byteLength(readmeContent),
      },
    ],
    manifestHash: 'fake-manifest-hash',
  };

  await writeFile(
    join(snapshotDir, 'release-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  );

  const installRecord = {
    schemaVersion: 1,
    corpusPackageName: '@spec-corpus/corpus',
    corpusPackageVersion: '0.0.1',
    corpusPackageIntegrity: 'sha512-fakeintegrity',
    cliPackageName: 'spec-corpus',
    cliPackageVersion: '0.1.0',
    activeSnapshotVersion: '0.0.1',
    activeSnapshotPath: '.spec-corpus/snapshots/0.0.1',
    installedAt: '2025-01-01T00:00:00.000Z',
    installSource: 'tarball',
  };

  await writeFile(
    join(specDir, 'install.json'),
    JSON.stringify(installRecord, null, 2) + '\n',
    'utf-8'
  );

  return { snapshotDir, installRecord };
}

/**
 * Make the fake v0.0.1 snapshot dirty by modifying README.md.
 */
async function makeDirty(target) {
  const readmePath = join(
    target,
    '.spec-corpus',
    'snapshots',
    '0.0.1',
    'root',
    'README.md'
  );
  await writeFile(readmePath, 'MODIFIED BY USER\n', 'utf-8');
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
  tmpBase = join(tmpdir(), `spec-corpus-update-force-e2e-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Blocked by dirty state (no --force)
// ---------------------------------------------------------------------------

describe('update — blocked by dirty state', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'blocked-dirty');
    await mkdir(target, { recursive: true });
    await createFakeSnapshot(target);
    await makeDirty(target);

    captured = await captureOutput(() =>
      runUpdate({
        target,
        version: null,
        from: TARBALL_PATH,
        force: false,
        dryRun: false,
      })
    );
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('emits event="conflict" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'conflict');
    assert.strictEqual(json.command, 'update');
  });

  it('reports activeVersion in conflict response', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.activeVersion, '0.0.1');
  });

  it('reports conflicts array with at least one entry', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(Array.isArray(json.conflicts));
    assert.ok(json.conflicts.length > 0);
  });

  it('conflicts include the modified file', () => {
    const json = parseJsonLine(captured.stdout);
    const modified = json.conflicts.find((c) => c.file === 'root/README.md');
    assert.ok(modified, 'Must report root/README.md as conflict');
    assert.strictEqual(modified.status, 'modified');
  });

  it('install.json still points to v0.0.1', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.activeSnapshotVersion, '0.0.1');
  });

  it('new snapshot was NOT created', () => {
    const newSnapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    assert.ok(!existsSync(newSnapshotDir), 'v0.1.0 snapshot must NOT exist when blocked');
  });

  it('stderr mentions BLOCKED', () => {
    assert.ok(captured.stderr.includes('BLOCKED'));
  });

  it('stderr suggests --force', () => {
    assert.ok(captured.stderr.includes('--force'));
  });
});

// ---------------------------------------------------------------------------
// Forced update through dirty state (--force)
// ---------------------------------------------------------------------------

describe('update — forced through dirty state', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'forced-dirty');
    await mkdir(target, { recursive: true });
    await createFakeSnapshot(target);
    await makeDirty(target);

    captured = await captureOutput(() =>
      runUpdate({
        target,
        version: null,
        from: TARBALL_PATH,
        force: true,
        dryRun: false,
      })
    );
  });

  it('exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('emits event="complete" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'complete');
    assert.strictEqual(json.command, 'update');
  });

  it('reports correct version and previousVersion', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.version, '0.1.0');
    assert.strictEqual(json.previousVersion, '0.0.1');
  });

  it('includes forceWarning in response', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(json.forceWarning, 'forceWarning must be present');
    assert.ok(
      json.forceWarning.includes('discarded'),
      'forceWarning must mention discarded changes'
    );
  });

  it('includes conflicts in force response', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(Array.isArray(json.conflicts));
    assert.ok(json.conflicts.length > 0);
  });

  it('install.json now points to v0.1.0', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.activeSnapshotVersion, '0.1.0');
    assert.strictEqual(record.activeSnapshotPath, '.spec-corpus/snapshots/0.1.0');
  });

  it('install.json preserves original installedAt', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.installedAt, '2025-01-01T00:00:00.000Z');
  });

  it('install.json has updatedAt field', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.ok(record.updatedAt, 'updatedAt must be present');
  });

  it('creates new v0.1.0 snapshot', async () => {
    const newSnapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    assert.ok(existsSync(newSnapshotDir), 'v0.1.0 snapshot must exist');
    await access(join(newSnapshotDir, 'root'));
    await access(join(newSnapshotDir, 'corpora'));
  });

  it('old v0.0.1 snapshot is preserved', () => {
    const oldSnapshotDir = join(target, '.spec-corpus', 'snapshots', '0.0.1');
    assert.ok(existsSync(oldSnapshotDir), 'Old snapshot 0.0.1 must still exist');
  });

  it('stderr includes WARNING about force', () => {
    assert.ok(captured.stderr.includes('WARNING'));
  });
});
