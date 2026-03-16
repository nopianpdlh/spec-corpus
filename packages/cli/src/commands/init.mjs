import { runBootstrapLike } from './bootstrap.mjs';

/**
 * init.mjs — friendly front door for first-time installs
 *
 * Behaves like bootstrap, but defaults to current directory at the CLI layer
 * and emits command="init" in structured output.
 *
 * @param {{ target: string, version: string|null, from: string|null, dryRun: boolean }} options
 * @returns {Promise<{ exitCode: number }>}
 */
export async function runInit(options) {
  return runBootstrapLike('init', options);
}
