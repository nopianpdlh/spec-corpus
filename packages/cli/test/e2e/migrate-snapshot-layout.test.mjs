import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile, readFile, access } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runUpdate } from '../../src/commands/update.mjs';

const corpusVersion = JSON.parse(readFileSync(resolve('packages/corpus/package.json'), 'utf-8')).version;
const cliVersion = JSON.parse(readFileSync(resolve('packages/cli/package.json'), 'utf-8')).version;
const TARBALL_PATH = resolve(`tmp/dist/spec-corpus-corpus-${corpusVersion}.tgz`);

function sha256Hex(content) {
  return createHash('sha256').update(content).digest('hex');
}

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

  return { stdout: stdoutChunks.join(''), stderr: stderrChunks.join(''), result };
}

let tmpBase;
before(async () => {
  await access(TARBALL_PATH);
  tmpBase = join(tmpdir(), `spec-corpus-layout-migrate-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
});

after(async () => {
  if (tmpBase) {
    await rm(tmpBase, { recursive: true, force: true });
  }
});

describe('update migrates legacy snapshot layout v1 to flat layout v2', () => {
  it('migrates .spec-corpus/snapshots to flat root and upgrades install record', async () => {
    const target = join(tmpBase, 'legacy-v1');
    const legacySnapshotRoot = join(target, '.spec-corpus', 'snapshots', '0.0.1', 'root');
    const legacySnapshotCorpora = join(target, '.spec-corpus', 'snapshots', '0.0.1', 'corpora', 'spec_backend');
    await mkdir(legacySnapshotRoot, { recursive: true });
    await mkdir(legacySnapshotCorpora, { recursive: true });

    const readmeContent = '# legacy';
    const legacyCorpusContent = 'legacy';
    await writeFile(join(legacySnapshotRoot, 'README.md'), readmeContent, 'utf-8');
    await writeFile(join(legacySnapshotCorpora, 'LEGACY.txt'), legacyCorpusContent, 'utf-8');
    await writeFile(
      join(target, '.spec-corpus', 'snapshots', '0.0.1', 'release-manifest.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          packageVersion: '0.0.1',
          files: [
            {
              path: 'root/README.md',
              hash: sha256Hex(readmeContent),
              size: Buffer.byteLength(readmeContent),
            },
            {
              path: 'corpora/spec_backend/LEGACY.txt',
              hash: sha256Hex(legacyCorpusContent),
              size: Buffer.byteLength(legacyCorpusContent),
            },
          ],
        },
        null,
        2
      ),
      'utf-8'
    );

    await writeFile(
      join(target, '.spec-corpus', 'install.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          corpusPackageName: '@spec-corpus/corpus',
          corpusPackageVersion: '0.0.1',
          corpusPackageIntegrity: 'sha512-legacy',
          cliPackageName: 'spec-corpus',
          cliPackageVersion: cliVersion,
          activeSnapshotVersion: '0.0.1',
          activeSnapshotPath: '.spec-corpus/snapshots/0.0.1',
          installedAt: '2025-01-01T00:00:00.000Z',
          installSource: 'tarball',
        },
        null,
        2
      ),
      'utf-8'
    );

    const captured = await captureOutput(() =>
      runUpdate({
        target,
        version: null,
        from: TARBALL_PATH,
        force: false,
        dryRun: false,
      })
    );

    assert.strictEqual(captured.result.exitCode, 0);

    const record = JSON.parse(await readFile(join(target, '.spec-corpus', 'install.json'), 'utf-8'));
    assert.strictEqual(record.layoutVersion, 2);
    assert.strictEqual(record.activeSnapshotVersion, corpusVersion);
    assert.strictEqual(record.activeSnapshotPath, undefined);

    assert.ok(!existsSync(join(target, '.spec-corpus', 'snapshots')));
    assert.ok(existsSync(join(target, '.spec-corpus', 'README.md')));
    assert.ok(existsSync(join(target, '.spec-corpus', 'release-manifest.json')));
    assert.ok(existsSync(join(target, '.spec-corpus', 'spec_backend', '.agents', 'skills')));
  });

  it('falls back and updates malformed legacy installs with missing manifest files array', async () => {
    const target = join(tmpBase, 'legacy-v1-malformed-manifest');
    const legacySnapshotRoot = join(target, '.spec-corpus', 'snapshots', '0.0.1', 'root');
    await mkdir(legacySnapshotRoot, { recursive: true });
    await writeFile(join(legacySnapshotRoot, 'README.md'), '# legacy malformed', 'utf-8');
    await writeFile(
      join(target, '.spec-corpus', 'snapshots', '0.0.1', 'release-manifest.json'),
      JSON.stringify({ schemaVersion: 1, packageVersion: '0.0.1' }, null, 2),
      'utf-8'
    );
    await writeFile(
      join(target, '.spec-corpus', 'install.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          corpusPackageName: '@spec-corpus/corpus',
          corpusPackageVersion: '0.0.1',
          corpusPackageIntegrity: 'sha512-legacy',
          cliPackageName: 'spec-corpus',
          cliPackageVersion: cliVersion,
          activeSnapshotVersion: '0.0.1',
          activeSnapshotPath: '.spec-corpus/snapshots/0.0.1',
          installedAt: '2025-01-01T00:00:00.000Z',
          installSource: 'tarball',
        },
        null,
        2
      ),
      'utf-8'
    );

    const captured = await captureOutput(() =>
      runUpdate({
        target,
        version: null,
        from: TARBALL_PATH,
        force: false,
        dryRun: false,
      })
    );

    assert.strictEqual(captured.result.exitCode, 0);
    const record = JSON.parse(await readFile(join(target, '.spec-corpus', 'install.json'), 'utf-8'));
    assert.strictEqual(record.layoutVersion, 2);
    assert.strictEqual(record.activeSnapshotVersion, corpusVersion);
    assert.ok(!existsSync(join(target, '.spec-corpus', 'snapshots')));
  });
});
