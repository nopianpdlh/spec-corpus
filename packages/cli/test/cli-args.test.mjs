/**
 * cli-args.test.mjs — unit tests for the argument parser
 *
 * Uses node:test and node:assert (built-in). No external test frameworks.
 * Run with: node --test packages/cli/test/cli-args.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, buildUsage, COMMANDS } from '../src/cli-args.mjs';

// ---------------------------------------------------------------------------
// COMMANDS constant
// ---------------------------------------------------------------------------

describe('COMMANDS', () => {
  it('contains exactly the 4 v1 commands', () => {
    assert.deepStrictEqual(COMMANDS, ['bootstrap', 'update', 'status', 'verify']);
  });
});

// ---------------------------------------------------------------------------
// --help / top-level flags
// ---------------------------------------------------------------------------

describe('parseArgs — --help flag', () => {
  it('sets flags.help=true for --help', () => {
    const result = parseArgs(['--help']);
    assert.strictEqual(result.flags.help, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('sets flags.help=true for -h', () => {
    const result = parseArgs(['-h']);
    assert.strictEqual(result.flags.help, true);
  });

  it('empty argv produces no command and no errors (handled by caller)', () => {
    const result = parseArgs([]);
    assert.strictEqual(result.command, null);
    assert.strictEqual(result.errors.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Command parsing
// ---------------------------------------------------------------------------

describe('parseArgs — command extraction', () => {
  it('parses "bootstrap" as command', () => {
    const result = parseArgs(['bootstrap', '--target', '/tmp/x']);
    assert.strictEqual(result.command, 'bootstrap');
    assert.strictEqual(result.errors.length, 0);
  });

  it('parses "update" as command', () => {
    const result = parseArgs(['update', '--target', '/tmp/x']);
    assert.strictEqual(result.command, 'update');
    assert.strictEqual(result.errors.length, 0);
  });

  it('parses "status" as command', () => {
    const result = parseArgs(['status', '--target', '/tmp/x']);
    assert.strictEqual(result.command, 'status');
    assert.strictEqual(result.errors.length, 0);
  });

  it('parses "verify" as command', () => {
    const result = parseArgs(['verify', '--target', '/tmp/x']);
    assert.strictEqual(result.command, 'verify');
    assert.strictEqual(result.errors.length, 0);
  });

  it('reports error for unknown command', () => {
    const result = parseArgs(['deploy', '--target', '/tmp/x']);
    assert.ok(result.errors.some(e => e.includes('Unknown command')));
    assert.ok(result.errors.some(e => e.includes('"deploy"')));
  });
});

// ---------------------------------------------------------------------------
// --target flag
// ---------------------------------------------------------------------------

describe('parseArgs — --target flag', () => {
  it('captures --target value (space syntax)', () => {
    const result = parseArgs(['bootstrap', '--target', './my-project']);
    assert.strictEqual(result.flags.target, './my-project');
    assert.strictEqual(result.errors.length, 0);
  });

  it('captures --target value (equals syntax)', () => {
    const result = parseArgs(['bootstrap', '--target=./my-project']);
    assert.strictEqual(result.flags.target, './my-project');
    assert.strictEqual(result.errors.length, 0);
  });

  it('reports error when --target is missing', () => {
    const result = parseArgs(['bootstrap']);
    assert.ok(result.errors.some(e => e.includes('--target')));
    assert.ok(result.errors.some(e => e.includes('required')));
  });

  it('reports error when --target has no value', () => {
    const result = parseArgs(['bootstrap', '--target']);
    assert.ok(result.errors.some(e => e.includes('--target requires a value')));
  });
});

// ---------------------------------------------------------------------------
// --version flag
// ---------------------------------------------------------------------------

describe('parseArgs — --version flag', () => {
  it('captures --version value (space syntax)', () => {
    const result = parseArgs(['bootstrap', '--target', '/t', '--version', '1.2.3']);
    assert.strictEqual(result.flags.version, '1.2.3');
    assert.strictEqual(result.errors.length, 0);
  });

  it('captures --version value (equals syntax)', () => {
    const result = parseArgs(['bootstrap', '--target', '/t', '--version=0.1.0']);
    assert.strictEqual(result.flags.version, '0.1.0');
    assert.strictEqual(result.errors.length, 0);
  });

  it('defaults flags.version to null when not supplied', () => {
    const result = parseArgs(['bootstrap', '--target', '/t']);
    assert.strictEqual(result.flags.version, null);
  });
});

// ---------------------------------------------------------------------------
// --from flag
// ---------------------------------------------------------------------------

describe('parseArgs — --from flag', () => {
  it('captures --from value', () => {
    const result = parseArgs(['bootstrap', '--target', '/t', '--from', './corpus.tgz']);
    assert.strictEqual(result.flags.from, './corpus.tgz');
    assert.strictEqual(result.errors.length, 0);
  });

  it('captures --from value (equals syntax)', () => {
    const result = parseArgs(['bootstrap', '--target', '/t', '--from=./corpus.tgz']);
    assert.strictEqual(result.flags.from, './corpus.tgz');
    assert.strictEqual(result.errors.length, 0);
  });

  it('defaults flags.from to null when not supplied', () => {
    const result = parseArgs(['bootstrap', '--target', '/t']);
    assert.strictEqual(result.flags.from, null);
  });
});

// ---------------------------------------------------------------------------
// --dry-run flag
// ---------------------------------------------------------------------------

describe('parseArgs — --dry-run flag', () => {
  it('sets flags.dryRun=true for bootstrap', () => {
    const result = parseArgs(['bootstrap', '--target', '/t', '--dry-run']);
    assert.strictEqual(result.flags.dryRun, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('sets flags.dryRun=true for update', () => {
    const result = parseArgs(['update', '--target', '/t', '--dry-run']);
    assert.strictEqual(result.flags.dryRun, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('reports error when --dry-run is used with status', () => {
    const result = parseArgs(['status', '--target', '/t', '--dry-run']);
    assert.ok(result.errors.some(e => e.includes('--dry-run')));
  });

  it('reports error when --dry-run is used with verify', () => {
    const result = parseArgs(['verify', '--target', '/t', '--dry-run']);
    assert.ok(result.errors.some(e => e.includes('--dry-run')));
  });
});

// ---------------------------------------------------------------------------
// --force flag
// ---------------------------------------------------------------------------

describe('parseArgs — --force flag', () => {
  it('sets flags.force=true for update', () => {
    const result = parseArgs(['update', '--target', '/t', '--force']);
    assert.strictEqual(result.flags.force, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('reports error when --force is used with bootstrap', () => {
    const result = parseArgs(['bootstrap', '--target', '/t', '--force']);
    assert.ok(result.errors.some(e => e.includes('--force')));
  });

  it('reports error when --force is used with status', () => {
    const result = parseArgs(['status', '--target', '/t', '--force']);
    assert.ok(result.errors.some(e => e.includes('--force')));
  });
});

// ---------------------------------------------------------------------------
// Unknown flags
// ---------------------------------------------------------------------------

describe('parseArgs — unknown flags', () => {
  it('reports error for unknown flag', () => {
    const result = parseArgs(['bootstrap', '--target', '/t', '--no-such-flag']);
    assert.ok(result.errors.some(e => e.includes('Unknown flag')));
    assert.ok(result.errors.some(e => e.includes('--no-such-flag')));
  });
});

// ---------------------------------------------------------------------------
// Flag defaults
// ---------------------------------------------------------------------------

describe('parseArgs — defaults', () => {
  it('all flags default to null/false when not supplied', () => {
    const result = parseArgs(['status', '--target', '/t']);
    assert.strictEqual(result.flags.target, '/t');
    assert.strictEqual(result.flags.version, null);
    assert.strictEqual(result.flags.from, null);
    assert.strictEqual(result.flags.dryRun, false);
    assert.strictEqual(result.flags.force, false);
    assert.strictEqual(result.flags.help, false);
  });
});

// ---------------------------------------------------------------------------
// buildUsage
// ---------------------------------------------------------------------------

describe('buildUsage', () => {
  it('returns a non-empty string', () => {
    const usage = buildUsage();
    assert.ok(typeof usage === 'string');
    assert.ok(usage.length > 0);
  });

  it('mentions all 4 commands', () => {
    const usage = buildUsage();
    assert.ok(usage.includes('bootstrap'));
    assert.ok(usage.includes('update'));
    assert.ok(usage.includes('status'));
    assert.ok(usage.includes('verify'));
  });

  it('mentions all v1 flags', () => {
    const usage = buildUsage();
    assert.ok(usage.includes('--target'));
    assert.ok(usage.includes('--version'));
    assert.ok(usage.includes('--from'));
    assert.ok(usage.includes('--dry-run'));
    assert.ok(usage.includes('--force'));
  });

  it('mentions --help', () => {
    const usage = buildUsage();
    assert.ok(usage.includes('--help'));
  });
});
