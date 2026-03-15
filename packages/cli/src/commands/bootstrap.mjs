/**
 * bootstrap.mjs — bootstrap command handler
 *
 * Installs a corpus tarball into .spec-corpus/snapshots/<version>/
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

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { installFromTarball } from '../install.mjs';

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

  // --- Dry-run mode: plan only, no mutations ---
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

    process.stdout.write(JSON.stringify(result) + '\n');

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

  // --- Live install ---
  try {
    // Resolve the tarball path
    const tarballPath = resolveTarball({ from, version });

    const installResult = installFromTarball({
      tarballPath,
      target,
      installSource: from ? 'tarball' : 'registry',
    });

    if (installResult.alreadyInstalled) {
      const result = {
        event: 'already-installed',
        command: 'bootstrap',
        target,
        version: installResult.version,
        snapshotPath: installResult.snapshotPath,
        installJsonPath: installResult.installJsonPath,
      };
      process.stdout.write(JSON.stringify(result) + '\n');
      process.stderr.write(`[bootstrap] already installed — version ${installResult.version}\n`);
      process.stderr.write(`  snapshot: ${installResult.snapshotPath}\n`);
      return { exitCode: 0 };
    }

    // Fresh install
    const result = {
      event: 'complete',
      command: 'bootstrap',
      target,
      version: installResult.version,
      snapshotPath: installResult.snapshotPath,
      installJsonPath: installResult.installJsonPath,
      installRecord: installResult.installRecord,
    };
    process.stdout.write(JSON.stringify(result) + '\n');

    process.stderr.write(`[bootstrap] installed corpus v${installResult.version}\n`);
    process.stderr.write(`  target:   ${target}\n`);
    process.stderr.write(`  snapshot: ${installResult.snapshotPath}\n`);
    process.stderr.write(`  record:   ${installResult.installJsonPath}\n`);

    return { exitCode: 0 };
  } catch (err) {
    const result = {
      event: 'error',
      command: 'bootstrap',
      target,
      error: err.message,
    };
    process.stdout.write(JSON.stringify(result) + '\n');
    process.stderr.write(`[bootstrap] ERROR: ${err.message}\n`);
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
  // Future: npm pack @spec-corpus/corpus@<version> to a temp dir
  throw new Error(
    'Registry install is not yet supported. Use --from <path.tgz> to provide a local tarball.'
  );
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
