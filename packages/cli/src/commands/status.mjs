/**
 * status.mjs — status command handler
 *
 * Reads the install record from <target>/.spec-corpus/install.json and reports
 * the installation status. When installed, also performs a quick dirty check
 * using the snapshot verifier. Does NOT mutate the filesystem.
 *
 * Output contract:
 *   stdout: JSON line with StatusResult
 *   stderr: human-readable summary
 *
 * StatusResult shape:
 *   { event: "status", command: "status", target, status: "installed" | "not-installed" | "corrupt",
 *     clean: boolean|null, activeVersion: string|null, installRecord, error }
 */

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { verifySnapshot } from '../verify-snapshot.mjs';

/**
 * @typedef {"installed" | "not-installed" | "corrupt"} InstallStatus
 */

/**
 * @typedef {Object} StatusResult
 * @property {"status"} event
 * @property {"status"} command
 * @property {string} target
 * @property {InstallStatus} status
 * @property {boolean|null} clean - true/false when installed, null otherwise
 * @property {string|null} activeVersion - version when installed, null otherwise
 * @property {Object|null} installRecord - The parsed install.json contents, or null
 * @property {string|null} error - Error message if status is "corrupt" or read failed unexpectedly
 */

/**
 * Run the status command.
 * @param {{ target: string }} options
 * @returns {Promise<{ exitCode: number }>}
 */
export async function runStatus(options) {
  const { target } = options;
  const absTarget = resolve(target);
  const installJsonPath = join(absTarget, '.spec-corpus', 'install.json');

  let statusResult;

  try {
    const raw = await readFile(installJsonPath, 'utf-8');
    let record;
    try {
      record = JSON.parse(raw);
    } catch {
      statusResult = {
        event: 'status',
        command: 'status',
        target,
        status: 'corrupt',
        clean: null,
        activeVersion: null,
        installRecord: null,
        error: `install.json is not valid JSON at: ${installJsonPath}`,
      };
      emitStatus(statusResult);
      return { exitCode: 1 };
    }

    // Installed — run quick dirty check
    let clean = null;
    try {
      const report = verifySnapshot({ target: absTarget });
      clean = report.clean;
    } catch {
      // If verify fails (e.g., missing manifest), report clean as null
      clean = null;
    }

    statusResult = {
      event: 'status',
      command: 'status',
      target,
      status: 'installed',
      clean,
      activeVersion: record.activeSnapshotVersion || null,
      installRecord: record,
      error: null,
    };
    emitStatus(statusResult);
    return { exitCode: 0 };

  } catch (err) {
    if (err.code === 'ENOENT') {
      statusResult = {
        event: 'status',
        command: 'status',
        target,
        status: 'not-installed',
        clean: null,
        activeVersion: null,
        installRecord: null,
        error: null,
      };
      emitStatus(statusResult);
      return { exitCode: 0 };
    }

    // Unexpected read error
    statusResult = {
      event: 'status',
      command: 'status',
      target,
      status: 'corrupt',
      clean: null,
      activeVersion: null,
      installRecord: null,
      error: `Failed to read ${installJsonPath}: ${err.message}`,
    };
    emitStatus(statusResult);
    return { exitCode: 1 };
  }
}

/**
 * Emit structured JSON to stdout and human-readable summary to stderr.
 * @param {StatusResult} result
 */
function emitStatus(result) {
  process.stdout.write(JSON.stringify(result) + '\n');

  const { target, status, installRecord, clean } = result;
  process.stderr.write(`[status] ${target}\n`);
  process.stderr.write(`  status: ${status}\n`);

  if (status === 'installed' && installRecord) {
    process.stderr.write(`  version:  ${installRecord.activeSnapshotVersion ?? 'unknown'}\n`);
    process.stderr.write(`  snapshot: ${installRecord.activeSnapshotPath ?? 'unknown'}\n`);
    process.stderr.write(`  installed at: ${installRecord.installedAt ?? 'unknown'}\n`);
    if (installRecord.updatedAt) {
      process.stderr.write(`  updated at:   ${installRecord.updatedAt}\n`);
    }
    if (clean === true) {
      process.stderr.write(`  integrity: clean\n`);
    } else if (clean === false) {
      process.stderr.write(`  integrity: dirty (run 'verify' for details)\n`);
    } else {
      process.stderr.write(`  integrity: unknown (manifest not available)\n`);
    }
  }

  if (result.error) {
    process.stderr.write(`  error: ${result.error}\n`);
  }
}
