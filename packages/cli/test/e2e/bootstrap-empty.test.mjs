/**
 * bootstrap-empty.test.mjs — e2e tests for the bootstrap command
 *
 * Tests the full bootstrap flow: tarball extraction into flat canonical root,
 * install.json writing, and idempotent re-run behavior.
 *
 * Requires a corpus tarball at tmp/dist/spec-corpus-corpus-0.1.0.tgz
 * (run `npm run pack:corpus` from repo root first).
 *
 * Run with: node --test packages/cli/test/e2e/bootstrap-empty.test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, readFile, access, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, readFileSync } from 'node:fs';
import { runBootstrap } from '../../src/commands/bootstrap.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Capture stdout writes from an async function.
 * @param {() => Promise<any>} fn
 * @returns {Promise<{ stdout: string, result: any }>}
 */
async function captureOutput(fn) {
  const stdoutChunks = [];
  const stderrChunks = [];
  const origStdout = process.stdout.write.bind(process.stdout);
  const origStderr = process.stderr.write.bind(process.stderr);

  process.stdout.write = (chunk, ...args) => {
    stdoutChunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
    return true;
  };
  process.stderr.write = (chunk, ...args) => {
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
  const line = output.split('\n').find(l => l.trim().startsWith('{'));
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

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const corpusVersion = JSON.parse(readFileSync(resolve('packages/corpus/package.json'), 'utf-8')).version;
const TARBALL_PATH = resolve(`tmp/dist/spec-corpus-corpus-${corpusVersion}.tgz`);
let tmpBase;

before(async () => {
  // Verify tarball exists
  try {
    await access(TARBALL_PATH);
  } catch {
    throw new Error(
      `Corpus tarball not found at ${TARBALL_PATH}. Run: npm run pack:corpus`
    );
  }

  tmpBase = join(tmpdir(), `spec-corpus-bootstrap-e2e-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Bootstrap into empty directory
// ---------------------------------------------------------------------------

describe('bootstrap — fresh install into empty directory', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'fresh-project');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(async () => {
      return runBootstrap({
        target,
        version: null,
        from: TARBALL_PATH,
        dryRun: false,
      });
    });
  });

  it('exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('emits event="complete" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'complete');
    assert.strictEqual(json.command, 'bootstrap');
  });

  it('reports correct version in stdout JSON', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.version, corpusVersion);
  });

  it('creates .spec-corpus/install.json', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    await access(installJsonPath);
    const raw = await readFile(installJsonPath, 'utf-8');
    const record = JSON.parse(raw);
    assert.strictEqual(record.schemaVersion, 1);
  });

  it('install.json has correct schema shape', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));

    assert.strictEqual(record.schemaVersion, 1);
    assert.strictEqual(record.corpusPackageName, '@spec-corpus/corpus');
    assert.strictEqual(record.corpusPackageVersion, corpusVersion);
    assert.ok(record.corpusPackageIntegrity.startsWith('sha512-'), 'integrity must start with sha512-');
    assert.strictEqual(record.cliPackageName, 'spec-corpus');
    assert.strictEqual(record.layoutVersion, 2);
    assert.strictEqual(record.activeSnapshotVersion, corpusVersion);
    assert.strictEqual(record.activeSnapshotPath, undefined);
    assert.ok(record.installedAt, 'installedAt must be present');
    assert.strictEqual(record.installSource, 'tarball');
  });

  it('flat canonical root contains expected files', async () => {
    const rootDir = join(target, '.spec-corpus');
    const entries = await readdir(rootDir);
    assert.ok(entries.includes('README.md'), 'root/ must contain README.md');
    assert.ok(entries.includes('ARCHITECTURE.md'), 'root/ must contain ARCHITECTURE.md');
  });

  it('flat canonical root contains expected corpus directories', async () => {
    const corporaDir = join(target, '.spec-corpus');
    const entries = await readdir(corporaDir);
    assert.ok(entries.includes('spec_frontend'), 'corpora/ must contain spec_frontend');
    assert.ok(entries.includes('spec_backend'), 'corpora/ must contain spec_backend');
    assert.ok(entries.includes('spec_code-quality'), 'corpora/ must contain spec_code-quality');
  });

  it('writes release-manifest.json in flat canonical root', async () => {
    await access(join(target, '.spec-corpus', 'release-manifest.json'));
  });

  it('does not create snapshots directory for fresh install', () => {
    const snapshotsDir = join(target, '.spec-corpus', 'snapshots');
    assert.ok(!existsSync(snapshotsDir), 'snapshots/ must NOT exist for layout v2 installs');
  });

  it('materializes browsable root docs under .spec-corpus/', async () => {
    const specDir = join(target, '.spec-corpus');
    const entries = await readdir(specDir);
    assert.ok(entries.includes('README.md'), '.spec-corpus must contain README.md');
    assert.ok(entries.includes('ARCHITECTURE.md'), '.spec-corpus must contain ARCHITECTURE.md');
  });

  it('materializes spec_backend with .agents/skills backend-testing at .spec-corpus root', async () => {
    const skillPath = join(
      target,
      '.spec-corpus',
      'spec_backend',
      '.agents',
      'skills',
      'backend-testing',
      'SKILL.md'
    );
    await access(skillPath);
  });

  it('does not leave temp staging directories', async () => {
    const specDir = join(target, '.spec-corpus');
    const entries = await readdir(specDir);
    const tmpDirs = entries.filter(e => e.startsWith('.tmp-'));
    assert.strictEqual(tmpDirs.length, 0, 'No .tmp-* staging dirs should remain');
  });

  it('emits human-readable output to stderr', () => {
    assert.ok(
      captured.stderr.includes('[bootstrap]'),
      'stderr must contain [bootstrap] prefix'
    );
    assert.ok(
      captured.stderr.includes(corpusVersion),
      'stderr must mention version'
    );
  });
});

// ---------------------------------------------------------------------------
// Idempotent re-run
// ---------------------------------------------------------------------------

describe('bootstrap — idempotent re-run', () => {
  let target;
  let firstCaptured;
  let secondCaptured;

  before(async () => {
    target = join(tmpBase, 'idempotent-project');
    await mkdir(target, { recursive: true });

    // First install
    firstCaptured = await captureOutput(async () => {
      return runBootstrap({
        target,
        version: null,
        from: TARBALL_PATH,
        dryRun: false,
      });
    });

    // Second install (same target, same tarball)
    secondCaptured = await captureOutput(async () => {
      return runBootstrap({
        target,
        version: null,
        from: TARBALL_PATH,
        dryRun: false,
      });
    });
  });

  it('first install exits 0 with event="complete"', () => {
    assert.strictEqual(firstCaptured.result.exitCode, 0);
    const json = parseJsonLine(firstCaptured.stdout);
    assert.strictEqual(json.event, 'complete');
  });

  it('second install exits 0 with event="already-installed"', () => {
    assert.strictEqual(secondCaptured.result.exitCode, 0);
    const json = parseJsonLine(secondCaptured.stdout);
    assert.strictEqual(json.event, 'already-installed');
  });

  it('second install reports correct version', () => {
    const json = parseJsonLine(secondCaptured.stdout);
    assert.strictEqual(json.version, corpusVersion);
  });

  it('second install stderr mentions already installed', () => {
    assert.ok(
      secondCaptured.stderr.includes('already installed'),
      'stderr must indicate already installed'
    );
  });
});

// ---------------------------------------------------------------------------
// Dry-run mode
// ---------------------------------------------------------------------------

describe('bootstrap — dry-run mode', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'dryrun-project');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(async () => {
      return runBootstrap({
        target,
        version: null,
        from: TARBALL_PATH,
        dryRun: true,
      });
    });
  });

  it('exits 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('emits event="dry-run" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'dry-run');
    assert.strictEqual(json.command, 'bootstrap');
  });

  it('does NOT create .spec-corpus/ directory', () => {
    const specDir = join(target, '.spec-corpus');
    assert.ok(!existsSync(specDir), '.spec-corpus/ must NOT exist after dry-run');
  });

  it('includes planned actions in stdout JSON', () => {
    const json = parseJsonLine(captured.stdout);
    assert.ok(Array.isArray(json.plannedActions), 'plannedActions must be an array');
    assert.ok(json.plannedActions.length > 0, 'plannedActions must not be empty');
  });
});

// ---------------------------------------------------------------------------
// Error handling — missing tarball
// ---------------------------------------------------------------------------

describe('bootstrap — error: missing tarball', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'error-project');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(async () => {
      return runBootstrap({
        target,
        version: null,
        from: '/nonexistent/path/to/tarball.tgz',
        dryRun: false,
      });
    });
  });

  it('exits with code 1', () => {
    assert.strictEqual(captured.result.exitCode, 1);
  });

  it('emits event="error" JSON to stdout', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'error');
    assert.strictEqual(json.command, 'bootstrap');
    assert.ok(json.error, 'error message must be present');
  });

  it('emits ERROR to stderr', () => {
    assert.ok(
      captured.stderr.includes('ERROR'),
      'stderr must contain ERROR'
    );
  });
});

// ---------------------------------------------------------------------------
// Registry-first bootstrap (no --from)
// ---------------------------------------------------------------------------

describe('bootstrap — registry-first install without --from', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'no-from-project');
    await mkdir(target, { recursive: true });

    captured = await withRegistryFixture(() =>
      captureOutput(async () => {
        return runBootstrap({
          target,
          version: null,
          from: null,
          dryRun: false,
        });
      })
    );
  });

  it('exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('uses the registry code path successfully', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.event, 'complete');
    assert.strictEqual(json.command, 'bootstrap');
    assert.strictEqual(json.version, corpusVersion);
  });

  it('records installSource="registry" in install.json', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.installSource, 'registry');
  });
});
