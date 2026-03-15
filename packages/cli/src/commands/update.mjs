/**
 * update.mjs — update command handler
 *
 * Resolves a new corpus tarball, stages a new snapshot, verifies current
 * clean state, and only then switches the active snapshot in install.json.
 * --force bypasses dirty-state blocking.
 *
 * Output contract:
 *   stdout: JSON line with UpdateCommandResult
 *   stderr: human-readable summary with [update] prefix
 *
 * Exit codes:
 *   0 — complete, already-active
 *   1 — conflict (blocked), error
 *
 * Dry-run output:
 *   stdout: JSON line with { event: "dry-run", command: "update", ... }
 *   stderr: human-readable planned actions
 */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { updateFromTarball } from '../update.mjs';

/**
 * @typedef {Object} UpdateOptions
 * @property {string} target - Target directory path
 * @property {string|null} version - Semver version to update to (null = latest)
 * @property {string|null} from - Path to local tarball (null = registry)
 * @property {boolean} force - Overwrite even if dirty state
 * @property {boolean} dryRun - If true, do NOT mutate filesystem
 */

/**
 * Run the update command.
 * @param {UpdateOptions} options
 * @returns {Promise<{ exitCode: number }>}
 */
export async function runUpdate(options) {
  const { target, version, from, force, dryRun } = options;

  // --- Dry-run mode: plan only, no mutations ---
  if (dryRun) {
    const plannedActions = buildPlannedActions({ target, version, from, force });

    const result = {
      event: 'dry-run',
      command: 'update',
      target,
      version: version ?? 'latest',
      installSource: from ? 'tarball' : 'registry',
      force,
      plannedActions,
    };

    process.stdout.write(JSON.stringify(result) + '\n');

    process.stderr.write('[dry-run] update — no files will be written\n');
    process.stderr.write(`  target:  ${target}\n`);
    process.stderr.write(`  version: ${version ?? 'latest'}\n`);
    process.stderr.write(`  source:  ${from ? `tarball (${from})` : 'npm registry'}\n`);
    process.stderr.write(`  force:   ${force}\n`);
    process.stderr.write(`  planned actions (${plannedActions.length}):\n`);
    for (const action of plannedActions) {
      process.stderr.write(`    - ${action}\n`);
    }

    return { exitCode: 0 };
  }

  // --- Live update ---
  try {
    // Resolve the tarball path
    const tarballPath = resolveTarball({ from, version });

    const updateResult = updateFromTarball({
      tarballPath,
      target,
      force: !!force,
      installSource: from ? 'tarball' : 'registry',
    });

    // Already active — same version
    if (updateResult.alreadyActive) {
      const result = {
        event: 'already-active',
        command: 'update',
        target,
        version: updateResult.version,
      };
      process.stdout.write(JSON.stringify(result) + '\n');
      process.stderr.write(`[update] already active — version ${updateResult.version}\n`);
      return { exitCode: 0 };
    }

    // Blocked by dirty state
    if (updateResult.blocked) {
      const result = {
        event: 'conflict',
        command: 'update',
        target,
        activeVersion: updateResult.previousVersion,
        conflicts: updateResult.conflicts,
      };
      process.stdout.write(JSON.stringify(result) + '\n');

      process.stderr.write(`[update] BLOCKED — active snapshot v${updateResult.previousVersion} has local changes\n`);
      process.stderr.write(`  ${updateResult.conflicts.length} conflict(s):\n`);
      for (const c of updateResult.conflicts) {
        process.stderr.write(`    ${c.status}: ${c.file}\n`);
      }
      process.stderr.write(`  Use --force to discard local changes and proceed.\n`);

      return { exitCode: 1 };
    }

    // Successful update
    const result = {
      event: 'complete',
      command: 'update',
      target,
      version: updateResult.version,
      previousVersion: updateResult.previousVersion,
      snapshotPath: updateResult.snapshotPath,
      installJsonPath: updateResult.installJsonPath,
    };

    // Add force warning and conflicts if --force was used with dirty state
    if (updateResult.forceWarning) {
      result.forceWarning = updateResult.forceWarning;
      result.conflicts = updateResult.conflicts;
    }

    process.stdout.write(JSON.stringify(result) + '\n');

    process.stderr.write(`[update] updated corpus v${updateResult.previousVersion} → v${updateResult.version}\n`);
    process.stderr.write(`  target:   ${target}\n`);
    process.stderr.write(`  snapshot: ${updateResult.snapshotPath}\n`);
    process.stderr.write(`  record:   ${updateResult.installJsonPath}\n`);
    if (updateResult.forceWarning) {
      process.stderr.write(`  WARNING: ${updateResult.forceWarning}\n`);
    }

    return { exitCode: 0 };
  } catch (err) {
    const result = {
      event: 'error',
      command: 'update',
      target,
      error: err.message,
    };
    process.stdout.write(JSON.stringify(result) + '\n');
    process.stderr.write(`[update] ERROR: ${err.message}\n`);
    return { exitCode: 1 };
  }
}

/**
 * Resolve the tarball path from options.
 * If --from is provided, use that local file.
 * Otherwise, registry resolution is not yet implemented (v1 requires --from).
 *
 * @param {{ from: string|null, version: string|null }} opts
 * @returns {string} absolute path to tarball
 */
function resolveTarball({ from, version }) {
  if (from) {
    const absPath = resolve(from);
    if (!existsSync(absPath)) {
      throw new Error(`Tarball not found: ${absPath}`);
    }
    return absPath;
  }

  // Registry resolution: not implemented in v1
  throw new Error(
    'Registry install is not yet supported. Use --from <path.tgz> to provide a local tarball.'
  );
}

/**
 * Build the list of planned filesystem actions for an update.
 * @param {{ target: string, version: string|null, from: string|null, force: boolean }} opts
 * @returns {string[]}
 */
function buildPlannedActions({ target, version, from, force }) {
  const ver = version ?? '<latest>';
  const source = from ? `tarball: ${from}` : 'npm registry';
  const actions = [
    `Read current install record: ${target}/.spec-corpus/install.json`,
    `Resolve corpus package version ${ver} from ${source}`,
    `Download corpus package tarball`,
    `Verify tarball integrity (sha512)`,
  ];
  if (force) {
    actions.push(`(--force) Skip dirty-state check`);
  } else {
    actions.push(`Verify active snapshot is clean (block if dirty)`);
  }
  actions.push(
    `Create directory: ${target}/.spec-corpus/snapshots/${ver}/`,
    `Extract corpus files into ${target}/.spec-corpus/snapshots/${ver}/`,
    `Update install record: ${target}/.spec-corpus/install.json (set activeSnapshotVersion, updatedAt)`
  );
  return actions;
}
