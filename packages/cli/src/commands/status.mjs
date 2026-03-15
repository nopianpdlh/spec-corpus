/**
 * status.mjs — status command handler (stub)
 *
 * Reads the install record from <target>/.spec-corpus/install.json and reports
 * the installation status. Does NOT mutate the filesystem.
 *
 * Output contract:
 *   stdout: JSON line with StatusResult
 *   stderr: human-readable summary
 *
 * StatusResult shape:
 *   { event: "status", command: "status", target, status: "installed" | "not-installed" | "corrupt", ... }
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * @typedef {"installed" | "not-installed" | "corrupt"} InstallStatus
 */

/**
 * @typedef {Object} StatusResult
 * @property {"status"} event
 * @property {"status"} command
 * @property {string} target
 * @property {InstallStatus} status
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
  const installJsonPath = join(target, '.spec-corpus', 'install.json');

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
        installRecord: null,
        error: `install.json is not valid JSON at: ${installJsonPath}`,
      };
      emitStatus(statusResult);
      return { exitCode: 1 };
    }

    statusResult = {
      event: 'status',
      command: 'status',
      target,
      status: 'installed',
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

  const { target, status, installRecord } = result;
  process.stderr.write(`[status] ${target}\n`);
  process.stderr.write(`  status: ${status}\n`);

  if (status === 'installed' && installRecord) {
    process.stderr.write(`  version:  ${installRecord.activeSnapshotVersion ?? 'unknown'}\n`);
    process.stderr.write(`  snapshot: ${installRecord.activeSnapshotPath ?? 'unknown'}\n`);
    process.stderr.write(`  installed at: ${installRecord.installedAt ?? 'unknown'}\n`);
    if (installRecord.updatedAt) {
      process.stderr.write(`  updated at:   ${installRecord.updatedAt}\n`);
    }
  }

  if (result.error) {
    process.stderr.write(`  error: ${result.error}\n`);
  }
}
