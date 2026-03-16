/**
 * init-registry.test.mjs — e2e tests for the init command and registry-first flow
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, readFile, access } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runInit } from '../../src/commands/init.mjs';

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

const corpusVersion = JSON.parse(readFileSync(resolve('packages/corpus/package.json'), 'utf-8')).version;
const TARBALL_PATH = resolve(`tmp/dist/spec-corpus-corpus-${corpusVersion}.tgz`);
let tmpBase;

before(async () => {
  await access(TARBALL_PATH);
  tmpBase = join(tmpdir(), `spec-corpus-init-registry-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

describe('init — registry-first install', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'registry-init');
    await mkdir(target, { recursive: true });

    captured = await withRegistryFixture(() =>
      captureOutput(() =>
        runInit({
          target,
          version: null,
          from: null,
          dryRun: false,
        })
      )
    );
  });

  it('exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('emits command="init" and event="complete"', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.command, 'init');
    assert.strictEqual(json.event, 'complete');
  });

  it('installs the registry version into .spec-corpus', async () => {
    const installJsonPath = join(target, '.spec-corpus', 'install.json');
    assert.ok(existsSync(installJsonPath));
    const record = JSON.parse(await readFile(installJsonPath, 'utf-8'));
    assert.strictEqual(record.activeSnapshotVersion, corpusVersion);
    assert.strictEqual(record.installSource, 'registry');
  });
});

describe('init — dry-run defaults to registry source', () => {
  let target;
  let captured;

  before(async () => {
    target = join(tmpBase, 'registry-dry-run');
    await mkdir(target, { recursive: true });

    captured = await captureOutput(() =>
      runInit({
        target,
        version: null,
        from: null,
        dryRun: true,
      })
    );
  });

  it('exits with code 0', () => {
    assert.strictEqual(captured.result.exitCode, 0);
  });

  it('emits registry installSource in stdout JSON', () => {
    const json = parseJsonLine(captured.stdout);
    assert.strictEqual(json.command, 'init');
    assert.strictEqual(json.event, 'dry-run');
    assert.strictEqual(json.installSource, 'registry');
  });
});
