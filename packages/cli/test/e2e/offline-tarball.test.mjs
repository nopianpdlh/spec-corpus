/**
 * offline-tarball.test.mjs — e2e tests for offline tarball bootstrap/update
 *
 * Tests:
 *   - Bootstrap from local file path (--from) succeeds
 *   - Verify --from is required (no registry support)
 *   - Verify --from path must exist
 *   - Offline update from tarball
 *
 * Run with: node --test packages/cli/test/e2e/offline-tarball.test.mjs
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
  readdir,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { runBootstrap } from '../../src/commands/bootstrap.mjs';
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
 * Create a fake v0.0.1 snapshot with minimal content + a valid manifest.
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
  tmpBase = join(tmpdir(), `spec-corpus-offline-e2e-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Bootstrap from local tarball path
// ---------------------------------------------------------------------------

describe('offline — bootstrap from local file path', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'offline-bootstrap');
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

  it('emits event="complete" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'complete');
    assert.strictEqual(json.command, 'bootstrap');
  });

  it('reports correct version', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.version, '0.1.0');
  });

  it('creates snapshot directory with expected structure', async () => {
    const snapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    await access(snapshotDir);
    await access(join(snapshotDir, 'root'));
    await access(join(snapshotDir, 'corpora'));
    await access(join(snapshotDir, 'release-manifest.json'));
  });

  it('writes install.json with installSource="tarball"', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.installSource, 'tarball');
    assert.strictEqual(record.activeSnapshotVersion, '0.1.0');
  });

  it('does not leave temp staging directories', async () => {
    const specDir = join(target, '.spec-corpus');
    const entries = await readdir(specDir);
    const tmpDirs = entries.filter((e) => e.startsWith('.tmp-'));
    assert.strictEqual(tmpDirs.length, 0, 'No .tmp-* staging dirs should remain');
  });
});

// ---------------------------------------------------------------------------
// Error: --from is required (registry not supported)
// ---------------------------------------------------------------------------

describe('offline — error: no --from (registry not supported)', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'no-from');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(() =>
      runBootstrap({
        target,
        version: null,
        from: null,
        dryRun: false,
      })
    );
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('error message mentions registry not supported', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(json.error.includes('not yet supported'));
  });
});

// ---------------------------------------------------------------------------
// Error: --from path must exist
// ---------------------------------------------------------------------------

describe('offline — error: --from path does not exist', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'bad-from');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(() =>
      runBootstrap({
        target,
        version: null,
        from: './nonexistent-path/fake.tgz',
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

  it('error message mentions tarball not found', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(
      json.error.toLowerCase().includes('not found') || json.error.toLowerCase().includes('tarball'),
      `Expected error about missing tarball, got: ${json.error}`
    );
  });
});

// ---------------------------------------------------------------------------
// Offline update from tarball
// ---------------------------------------------------------------------------

describe('offline — update from tarball after bootstrap', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'offline-update');
    await mkdir(target, { recursive: true });

    // Bootstrap first with a fake v0.0.1 snapshot
    await createFakeSnapshot(target);

    // Now update to v0.1.0 from local tarball
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

  it('install.json updated to v0.1.0 with tarball source', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.activeSnapshotVersion, '0.1.0');
    assert.strictEqual(record.installSource, 'tarball');
    assert.ok(record.updatedAt, 'updatedAt must be present');
  });

  it('new snapshot v0.1.0 has correct structure', async () => {
    const snapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    await access(snapshotDir);
    await access(join(snapshotDir, 'root'));
    await access(join(snapshotDir, 'corpora'));
    await access(join(snapshotDir, 'release-manifest.json'));
  });

  it('does not leave temp staging directories', async () => {
    const specDir = join(target, '.spec-corpus');
    const entries = await readdir(specDir);
    const tmpDirs = entries.filter((e) => e.startsWith('.tmp-'));
    assert.strictEqual(tmpDirs.length, 0, 'No .tmp-* staging dirs should remain');
  });
});
