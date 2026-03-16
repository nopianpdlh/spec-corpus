import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNpmPackInvocation } from '../src/resolve-corpus-tarball.mjs';

describe('resolveNpmPackInvocation', () => {
  it('prefers npm_execpath under npx/npm runtimes', () => {
    const invocation = resolveNpmPackInvocation({
      platform: 'win32',
      execPath: 'C:/Program Files/nodejs/node.exe',
      npmExecPath: 'C:/Users/test/AppData/Roaming/npm/node_modules/npm/bin/npm-cli.js',
      pathExists: () => true,
    });

    assert.deepStrictEqual(invocation, {
      command: 'C:/Program Files/nodejs/node.exe',
      baseArgs: ['C:/Users/test/AppData/Roaming/npm/node_modules/npm/bin/npm-cli.js'],
      shell: false,
    });
  });

  it('falls back to bundled npm-cli.js next to node when npm_execpath is unavailable', () => {
    const invocation = resolveNpmPackInvocation({
      platform: 'win32',
      execPath: 'C:/Program Files/nodejs/node.exe',
      npmExecPath: null,
      pathExists: (candidate) =>
        candidate.replaceAll('\\', '/') === 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js',
    });

    assert.strictEqual(invocation.command, 'C:/Program Files/nodejs/node.exe');
    assert.strictEqual(
      invocation.baseArgs[0].replaceAll('\\', '/'),
      'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js'
    );
    assert.strictEqual(invocation.shell, false);
  });

  it('falls back to shell npm invocation when no npm cli script path is discoverable', () => {
    const invocation = resolveNpmPackInvocation({
      platform: 'linux',
      execPath: '/usr/local/bin/node',
      npmExecPath: null,
      pathExists: () => false,
    });

    assert.deepStrictEqual(invocation, {
      command: 'npm',
      baseArgs: [],
      shell: true,
    });
  });
});
