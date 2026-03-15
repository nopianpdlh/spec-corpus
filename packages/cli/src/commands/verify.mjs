/**
 * verify.mjs — verify command handler
 *
 * Checks whether the active managed snapshot still matches its manifest
 * byte-for-byte and produces a machine-readable and human-readable
 * conflict report when it doesn't.
 *
 * Output contract:
 *   stdout: JSON line with VerifyResult
 *   stderr: human-readable summary
 *
 * Exit codes:
 *   0 — snapshot is clean (all files match manifest)
 *   1 — snapshot is dirty or an error occurred
 */

import { resolve } from 'node:path';
import { verifySnapshot } from '../verify-snapshot.mjs';

/**
 * Run the verify command.
 * @param {{ target: string }} options
 * @returns {Promise<{ exitCode: number }>}
 */
export async function runVerify(options) {
  const { target } = options;
  const absTarget = resolve(target);

  try {
    const report = verifySnapshot({ target: absTarget });

    const result = {
      event: 'verify',
      command: 'verify',
      target,
      clean: report.clean,
      activeVersion: report.activeVersion,
      conflicts: report.conflicts,
    };

    process.stdout.write(JSON.stringify(result) + '\n');

    // Human-readable output to stderr
    process.stderr.write(`[verify] ${target}\n`);
    if (report.clean) {
      process.stderr.write(`  status: clean\n`);
      process.stderr.write(`  version: ${report.activeVersion}\n`);
      process.stderr.write(`  All files match the release manifest.\n`);
    } else {
      process.stderr.write(`  status: dirty\n`);
      process.stderr.write(`  version: ${report.activeVersion}\n`);
      process.stderr.write(`  ${report.conflicts.length} conflict(s) found:\n`);
      for (const c of report.conflicts) {
        process.stderr.write(`    ${c.status}: ${c.file}\n`);
      }
    }

    return { exitCode: report.clean ? 0 : 1 };
  } catch (err) {
    const errorResult = {
      event: 'verify',
      command: 'verify',
      target,
      clean: false,
      activeVersion: null,
      conflicts: [],
      error: err.message,
    };

    process.stdout.write(JSON.stringify(errorResult) + '\n');
    process.stderr.write(`[verify] ${target}\n`);
    process.stderr.write(`  ERROR: ${err.message}\n`);

    return { exitCode: 1 };
  }
}
