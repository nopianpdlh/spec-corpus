/**
 * release-smoke.test.mjs — e2e smoke test for the CLI as a subprocess
 *
 * Tests:
 *   - Can bootstrap from the built tarball via subprocess
 *   - Can run status command and get expected output
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const corpusVersion = JSON.parse(readFileSync(resolve('packages/corpus/package.json'), 'utf-8')).version;
const TARBALL_PATH = resolve(`tmp/dist/spec-corpus-corpus-${corpusVersion}.tgz`);
const CLI_BIN = resolve('packages/cli/bin/spec-corpus.js');

let tmpBase;

before(async () => {
  if (!existsSync(TARBALL_PATH)) {
    console.log(`Tarball not found at ${TARBALL_PATH}, packing now...`);
    const packResult = spawnSync('npm', ['run', 'pack:corpus'], {
      encoding: 'utf-8',
      cwd: resolve('.'),
    });
    assert.strictEqual(packResult.status, 0, `Failed to pack corpus: ${packResult.stderr}`);
  }

  tmpBase = join(tmpdir(), `spec-corpus-release-smoke-${Date.now()}`);
  mkdirSync(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

describe('release smoke test', () => {
  it('bootstraps successfully via subprocess', () => {
    const result = spawnSync(
      process.execPath,
      [CLI_BIN, 'bootstrap', '--target', tmpBase, '--from', TARBALL_PATH],
      {
        encoding: 'utf-8',
        cwd: resolve('.'),
      }
    );

    assert.strictEqual(result.status, 0, `Bootstrap failed: ${result.stderr || result.stdout}`);
    
    const installJsonPath = join(tmpBase, '.spec-corpus', 'install.json');
    assert.ok(existsSync(installJsonPath), 'install.json should exist after bootstrap');
  });

  it('runs status successfully via subprocess', () => {
    const result = spawnSync(
      process.execPath,
      [CLI_BIN, 'status', '--target', tmpBase],
      {
        encoding: 'utf-8',
        cwd: resolve('.'),
      }
    );

    assert.strictEqual(result.status, 0, `Status failed: ${result.stderr || result.stdout}`);
    
    // Status output should contain JSON
    const jsonLine = result.stdout.split('\n').find((l) => l.trim().startsWith('{'));
    assert.ok(jsonLine, 'Expected JSON output from status command');
    
    const statusData = JSON.parse(jsonLine);
    assert.strictEqual(statusData.status, 'installed', 'Expected status to be "installed"');
    assert.strictEqual(statusData.activeVersion, corpusVersion, `Expected activeVersion to be "${corpusVersion}"`);
  });
});
