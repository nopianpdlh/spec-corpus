/**
 * bootstrap.mjs — bootstrap command handler (stub)
 *
 * Full install logic is implemented in Task 6.
 * This stub satisfies the v1 command contract and dry-run output shape.
 *
 * Output contract (dry-run):
 *   stdout: JSON line with { event: "dry-run", command: "bootstrap", plannedActions: [...] }
 *   stderr: human-readable summary
 *
 * Output contract (live — future Task 6):
 *   stdout: JSON line with { event: "complete", command: "bootstrap", ... }
 */

/**
 * @typedef {Object} BootstrapOptions
 * @property {string} target - Target directory path
 * @property {string|null} version - Semver version to install (null = latest)
 * @property {string|null} from - Path to local tarball (null = registry)
 * @property {boolean} dryRun - If true, do NOT mutate filesystem
 */

/**
 * Run the bootstrap command.
 * @param {BootstrapOptions} options
 * @returns {Promise<{ exitCode: number }>}
 */
export async function runBootstrap(options) {
  const { target, version, from, dryRun } = options;

  if (dryRun) {
    const plannedActions = buildPlannedActions({ target, version, from });

    const result = {
      event: 'dry-run',
      command: 'bootstrap',
      target,
      version: version ?? 'latest',
      installSource: from ? 'tarball' : 'registry',
      plannedActions,
    };

    // Machine-readable: JSON to stdout
    process.stdout.write(JSON.stringify(result) + '\n');

    // Human-readable summary to stderr
    process.stderr.write('[dry-run] bootstrap — no files will be written\n');
    process.stderr.write(`  target:  ${target}\n`);
    process.stderr.write(`  version: ${version ?? 'latest'}\n`);
    process.stderr.write(`  source:  ${from ? `tarball (${from})` : 'npm registry'}\n`);
    process.stderr.write(`  planned actions (${plannedActions.length}):\n`);
    for (const action of plannedActions) {
      process.stderr.write(`    - ${action}\n`);
    }

    return { exitCode: 0 };
  }

  // Live install — not yet implemented (Task 6)
  const result = {
    event: 'not-implemented',
    command: 'bootstrap',
    message: 'Full install logic will be added in Task 6.',
  };
  process.stdout.write(JSON.stringify(result) + '\n');
  process.stderr.write('[bootstrap] Full install not yet implemented. Coming in Task 6.\n');

  return { exitCode: 0 };
}

/**
 * Build the list of planned filesystem actions for a bootstrap.
 * @param {{ target: string, version: string|null, from: string|null }} opts
 * @returns {string[]}
 */
function buildPlannedActions({ target, version, from }) {
  const ver = version ?? '<latest>';
  const source = from ? `tarball: ${from}` : 'npm registry';
  return [
    `Resolve corpus package version ${ver} from ${source}`,
    `Download corpus package tarball`,
    `Verify tarball integrity (sha512)`,
    `Create directory: ${target}/.spec-corpus/`,
    `Create directory: ${target}/.spec-corpus/snapshots/${ver}/`,
    `Extract corpus files into ${target}/.spec-corpus/snapshots/${ver}/`,
    `Write install record: ${target}/.spec-corpus/install.json`,
  ];
}
