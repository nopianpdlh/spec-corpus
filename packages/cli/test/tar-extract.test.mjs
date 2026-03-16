import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTarAttempts,
  extractTarball,
  isUnsupportedForceLocalError,
} from '../src/tar-extract.mjs';

describe('tar-extract helper', () => {
  it('buildTarAttempts uses retry strategy on Windows', () => {
    const attempts = buildTarAttempts('C:\\tmp\\archive.tgz', 'C:\\tmp\\dest', 'win32');
    assert.strictEqual(attempts.length, 2);
    assert.deepStrictEqual(attempts[0], [
      'xf',
      'C:/tmp/archive.tgz',
      '--force-local',
      '-C',
      'C:/tmp/dest',
    ]);
    assert.deepStrictEqual(attempts[1], ['xf', 'C:\\tmp\\archive.tgz', '-C', 'C:\\tmp\\dest']);
  });

  it('detects unsupported --force-local errors', () => {
    assert.ok(isUnsupportedForceLocalError('tar: Option --force-local is not supported'));
    assert.ok(isUnsupportedForceLocalError('tar: unrecognized option --force-local'));
    assert.equal(isUnsupportedForceLocalError('tar: archive not found'), false);
  });

  it('extractTarball retries on Windows when --force-local unsupported', () => {
    const calls = [];
    const fakeSpawn = (_cmd, args) => {
      calls.push(args);
      if (calls.length === 1) {
        return {
          status: 2,
          stderr: 'tar: Option --force-local is not supported',
          error: null,
        };
      }
      return { status: 0, stderr: '', error: null };
    };

    extractTarball('C:\\tmp\\archive.tgz', 'C:\\tmp\\dest', {
      platform: 'win32',
      spawn: fakeSpawn,
    });

    assert.strictEqual(calls.length, 2);
    assert.ok(calls[0].includes('--force-local'));
    assert.equal(calls[1].includes('--force-local'), false);
  });
});
