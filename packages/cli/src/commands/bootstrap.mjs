/**
 * bootstrap.mjs — bootstrap command handler
 *
 * Installs a corpus tarball into flat canonical .spec-corpus/
 * and writes .spec-corpus/install.json.
 *
 * Output contract:
 *   stdout: JSON line with BootstrapResult
 *   stderr: human-readable summary with [bootstrap] prefix
 *
 * Dry-run output:
 *   stdout: JSON line with { event: "dry-run", command: "bootstrap", ... }
 *   stderr: human-readable planned actions
 */

import { installFromTarball } from '../install.mjs';
import { resolveCorpusTarball } from '../resolve-corpus-tarball.mjs';

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
  return runBootstrapLike('bootstrap', options);
}

export async function runBootstrapLike(commandName, options) {
  const { target, version, from, dryRun } = options;

  // --- Dry-run mode: plan only, no mutations ---
  if (dryRun) {
    const plannedActions = buildPlannedActions({ target, version, from });

      const result = {
        event: 'dry-run',
        command: commandName,
        target,
        version: version ?? 'latest',
        installSource: from ? 'tarball' : 'registry',
      plannedActions,
    };

    process.stdout.write(JSON.stringify(result) + '\n');

    process.stderr.write(`[dry-run] ${commandName} — no files will be written\n`);
    process.stderr.write(`  target:  ${target}\n`);
    process.stderr.write(`  version: ${version ?? 'latest'}\n`);
    process.stderr.write(`  source:  ${from ? `tarball (${from})` : 'npm registry'}\n`);
    process.stderr.write(`  planned actions (${plannedActions.length}):\n`);
    for (const action of plannedActions) {
      process.stderr.write(`    - ${action}\n`);
    }

    return { exitCode: 0 };
  }

  // --- Live install ---
  try {
    const resolvedTarball = resolveCorpusTarball({ from, version });

    try {
      const installResult = installFromTarball({
        tarballPath: resolvedTarball.tarballPath,
        target,
        installSource: resolvedTarball.installSource,
      });

      if (installResult.alreadyInstalled) {
        const result = {
          event: 'already-installed',
          command: commandName,
          target,
          version: installResult.version,
          snapshotPath: installResult.snapshotPath,
          installJsonPath: installResult.installJsonPath,
        };
        process.stdout.write(JSON.stringify(result) + '\n');
        process.stderr.write(`[${commandName}] already installed — version ${installResult.version}\n`);
        process.stderr.write(`  layout: flat (.spec-corpus root canonical)\n`);
        return { exitCode: 0 };
      }

      const result = {
        event: 'complete',
        command: commandName,
        target,
        version: installResult.version,
        snapshotPath: installResult.snapshotPath,
        installJsonPath: installResult.installJsonPath,
        installRecord: installResult.installRecord,
      };
      process.stdout.write(JSON.stringify(result) + '\n');

      process.stderr.write(`[${commandName}] installed corpus v${installResult.version}\n`);
      process.stderr.write(`  target:   ${target}\n`);
      process.stderr.write(`  layout:   flat (.spec-corpus root canonical)\n`);
      process.stderr.write(`  record:   ${installResult.installJsonPath}\n`);

      return { exitCode: 0 };
    } finally {
      resolvedTarball.cleanup();
    }
  } catch (err) {
    const result = {
      event: 'error',
      command: commandName,
      target,
      error: err.message,
    };
    process.stdout.write(JSON.stringify(result) + '\n');
    process.stderr.write(`[${commandName}] ERROR: ${err.message}\n`);
    return { exitCode: 1 };
  }
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
    `Create directory: ${target}/.spec-corpus/`,
    `Extract corpus files into ${target}/.spec-corpus/ (flat canonical layout)`,
    `Write manifest: ${target}/.spec-corpus/release-manifest.json`,
    `Write install record: ${target}/.spec-corpus/install.json`,
  ];
}
