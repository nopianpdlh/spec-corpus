/**
 * update-clean.test.mjs — e2e tests for clean update flows
 *
 * Tests:
 *   - Update from v0.0.1 to v0.1.0 (clean state)
 *   - Idempotent update (already at v0.1.0)
 *   - Old snapshot preserved after update
 *   - install.json fields updated correctly (updatedAt added, installedAt preserved)
 *   - Error: no --from (registry not supported)
 *   - Error: not installed (no install.json)
 *
 * Run with: node --test packages/cli/test/e2e/update-clean.test.mjs
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
import { existsSync, readFileSync } from 'node:fs';
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

async function withRegistryFixture(fn) {
  const prev = process.env.SPEC_CORPUS_REGISTRY_TARBALL;
  process.env.SPEC_CORPUS_REGISTRY_TARBALL = TARBALL_PATH;
  try {
    return await fn();
  } finally {
    if (prev === undefined) {
      delete process.env.SPEC_CORPUS_REGISTRY_TARBALL;
    } else {
      process.env.SPEC_CORPUS_REGISTRY_TARBALL = prev;
    }
  }
}

/**
 * Compute sha256 hex hash of a string (for building fake manifests).
 */
function sha256Hex(content) {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Create a fake v0.0.1 snapshot with minimal content + a valid manifest.
 * This simulates a previously installed version that the update will replace.
 */
async function createFakeSnapshot(target) {
  const specDir = join(target, '.spec-corpus');
  const snapshotDir = join(specDir, 'snapshots', '0.0.1');
  const rootDir = join(snapshotDir, 'root');

  await mkdir(rootDir, { recursive: true });

  // Create a single file in the snapshot
  const readmeContent = '# Old Corpus v0.0.1\nThis is the old version.\n';
  await writeFile(join(rootDir, 'README.md'), readmeContent, 'utf-8');

  // Create a release-manifest.json for this fake snapshot
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

  // Create install.json pointing to v0.0.1
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

const corpusVersion = JSON.parse(readFileSync(resolve('packages/corpus/package.json'), 'utf-8')).version;
const TARBALL_PATH = resolve(`tmp/dist/spec-corpus-corpus-${corpusVersion}.tgz`);
let tmpBase;

before(async () => {
  try {
    await access(TARBALL_PATH);
  } catch {
    throw new Error(
      `Corpus tarball not found at ${TARBALL_PATH}. Run: npm run pack:corpus`
    );
  }
  tmpBase = join(tmpdir(), `spec-corpus-update-clean-e2e-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Clean update from v0.0.1 → v0.1.0
// ---------------------------------------------------------------------------

describe('update — clean update from v0.0.1 to v0.1.0', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'clean-update');
    await mkdir(target, { recursive: true });
    await createFakeSnapshot(target);

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

  it('reports snapshotPath and installJsonPath', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.snapshotPath, '.spec-corpus/snapshots/0.1.0');
    assert.strictEqual(json.installJsonPath, '.spec-corpus/install.json');
  });

  it('does not include forceWarning for clean update', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.forceWarning, undefined);
  });

  it('install.json points to v0.1.0', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.activeSnapshotVersion, '0.1.0');
    assert.strictEqual(record.activeSnapshotPath, '.spec-corpus/snapshots/0.1.0');
  });

  it('install.json preserves installedAt from original install', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.installedAt, '2025-01-01T00:00:00.000Z');
  });

  it('install.json has updatedAt field', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.ok(record.updatedAt, 'updatedAt must be present');
    // updatedAt should be a valid ISO date string
    assert.ok(!isNaN(Date.parse(record.updatedAt)), 'updatedAt must be valid ISO date');
  });

  it('install.json has correct schema shape', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.schemaVersion, 1);
    assert.strictEqual(record.corpusPackageName, '@spec-corpus/corpus');
    assert.strictEqual(record.corpusPackageVersion, '0.1.0');
    assert.ok(record.corpusPackageIntegrity.startsWith('sha512-'));
    assert.strictEqual(record.installSource, 'tarball');
  });

  it('creates new snapshot v0.1.0 with root/ and corpora/', async () => {
    const snapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    await access(snapshotDir);
    await access(join(snapshotDir, 'root'));
    await access(join(snapshotDir, 'corpora'));
  });

  it('new snapshot contains release-manifest.json', async () => {
    const manifestPath = join(
      target, '.spec-corpus', 'snapshots', '0.1.0', 'release-manifest.json'
    );
    await access(manifestPath);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    assert.strictEqual(manifest.packageVersion, '0.1.0');
  });

  it('old v0.0.1 snapshot is preserved', async () => {
    const oldSnapshotDir = join(target, '.spec-corpus', 'snapshots', '0.0.1');
    assert.ok(existsSync(oldSnapshotDir), 'Old snapshot 0.0.1 must still exist');
    assert.ok(
      existsSync(join(oldSnapshotDir, 'root', 'README.md')),
      'Old snapshot files must still exist'
    );
  });

  it('does not leave temp staging directories', async () => {
    const specDir = join(target, '.spec-corpus');
    const entries = await readdir(specDir);
    const tmpDirs = entries.filter((e) => e.startsWith('.tmp-'));
    assert.strictEqual(tmpDirs.length, 0, 'No .tmp-* staging dirs should remain');
  });

  it('emits human-readable output to stderr', () => {
    assert.ok(captured.stderr.includes('[update]'), 'stderr must contain [update] prefix');
    assert.ok(captured.stderr.includes('0.1.0'), 'stderr must mention new version');
    assert.ok(captured.stderr.includes('0.0.1'), 'stderr must mention previous version');
  });
});

// ---------------------------------------------------------------------------
// Idempotent update — already at target version
// ---------------------------------------------------------------------------

describe('update — already active (same version)', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'already-active');
    await mkdir(target, { recursive: true });
    await createFakeSnapshot(target);

    // First update: 0.0.1 → 0.1.0
    await captureOutput(() =>
      runUpdate({
        target,
        version: null,
        from: TARBALL_PATH,
        force: false,
        dryRun: false,
      })
    );

    // Second update: 0.1.0 → 0.1.0 (same tarball)
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

  it('emits event="already-active" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'already-active');
    assert.strictEqual(json.command, 'update');
  });

  it('reports correct version', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.version, '0.1.0');
  });

  it('stderr mentions already active', () => {
    assert.ok(captured.stderr.includes('already active'));
  });
});

// ---------------------------------------------------------------------------
// Registry-first update (no --from)
// ---------------------------------------------------------------------------

describe('update — registry-first update without --from', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'no-from');
    await mkdir(target, { recursive: true });
    await createFakeSnapshot(target);

    captured = await withRegistryFixture(() =>
      captureOutput(() =>
        runUpdate({
          target,
          version: null,
          from: null,
          force: false,
          dryRun: false,
        })
      )
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

  it('records the resolved registry version', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.version, corpusVersion);
  });

  it('writes installSource="registry" after update', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.installSource, 'registry');
  });
});

// ---------------------------------------------------------------------------
// Error: not installed (no install.json)
// ---------------------------------------------------------------------------

describe('update — error: not installed', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'not-installed');
    await mkdir(target, { recursive: true });

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

  it('emits event="error" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'error');
    assert.strictEqual(json.command, 'update');
  });

  it('error message mentions not installed', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(json.error.includes('Not installed'));
  });
});

// ---------------------------------------------------------------------------
// Dry-run mode
// ---------------------------------------------------------------------------

describe('update — dry-run mode', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'dryrun');
    await mkdir(target, { recursive: true });
    await createFakeSnapshot(target);

    captured = await captureOutput(() =>
      runUpdate({
        target,
        version: null,
        from: TARBALL_PATH,
        force: false,
        dryRun: true,
      })
    );
  });

  it('exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('emits event="dry-run" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'dry-run');
    assert.strictEqual(json.command, 'update');
  });

  it('does NOT create new snapshot directory', () => {
    const newSnapshotDir = join(target, '.spec-corpus', 'snapshots', '0.1.0');
    assert.ok(!existsSync(newSnapshotDir), 'v0.1.0 snapshot must NOT exist after dry-run');
  });

  it('install.json still points to v0.0.1', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.activeSnapshotVersion, '0.0.1');
  });

  it('includes planned actions in stdout JSON', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(Array.isArray(json.plannedActions));
    assert.ok(json.plannedActions.length > 0);
  });
});
