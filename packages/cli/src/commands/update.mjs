/**
 * update.mjs — update command handler (stub)
 *
 * Full update logic is implemented in a later task.
 * This stub satisfies the v1 command contract and dry-run output shape.
 *
 * Output contract (dry-run):
 *   stdout: JSON line with { event: "dry-run", command: "update", plannedActions: [...] }
 *   stderr: human-readable summary
 */

/**
 * @typedef {Object} UpdateOptions
 * @property {string} target - Target directory path
 * @property {string|null} version - Semver version to update to (null = latest)
 * @property {string|null} from - Path to local tarball (null = registry)
 * @property {boolean} force - Overwrite even if version matches
 * @property {boolean} dryRun - If true, do NOT mutate filesystem
 */

/**
 * Run the update command.
 * @param {UpdateOptions} options
 * @returns {Promise<{ exitCode: number }>}
 */
export async function runUpdate(options) {
  const { target, version, from, force, dryRun } = options;

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

  // Live update — not yet implemented
  const result = {
    event: 'not-implemented',
    command: 'update',
    message: 'Full update logic will be added in a later task.',
  };
  process.stdout.write(JSON.stringify(result) + '\n');
  process.stderr.write('[update] Full update not yet implemented.\n');

  return { exitCode: 0 };
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
    actions.push(`(--force) Skip version-equality check`);
  } else {
    actions.push(`Check version differs from installed (skip if equal)`);
  }
  actions.push(
    `Create directory: ${target}/.spec-corpus/snapshots/${ver}/`,
    `Extract corpus files into ${target}/.spec-corpus/snapshots/${ver}/`,
    `Update install record: ${target}/.spec-corpus/install.json (set activeSnapshotVersion, updatedAt)`
  );
  return actions;
}
