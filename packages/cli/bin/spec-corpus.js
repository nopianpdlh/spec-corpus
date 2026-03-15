#!/usr/bin/env node
/**
 * spec-corpus — CLI entry point
 *
 * Plain Node.js ESM, no external dependencies.
 * Dispatches to command handlers in src/commands/.
 */

import { parseArgs, buildUsage, COMMANDS } from '../src/cli-args.mjs';
import { runBootstrap } from '../src/commands/bootstrap.mjs';
import { runUpdate } from '../src/commands/update.mjs';
import { runStatus } from '../src/commands/status.mjs';
import { runVerify } from '../src/commands/verify.mjs';

const argv = process.argv.slice(2);
const parsed = parseArgs(argv);

// Handle --help at top level (no command) or with a command
if (parsed.flags.help || argv.length === 0) {
  process.stdout.write(buildUsage());
  process.exit(0);
}

// If no command given but we also didn't catch --help above
if (!parsed.command) {
  process.stderr.write('Error: No command given. Use --help for usage.\n');
  process.exit(1);
}

// Validation errors
if (parsed.errors.length > 0) {
  for (const err of parsed.errors) {
    process.stderr.write(`Error: ${err}\n`);
  }
  process.stderr.write('\nRun with --help for usage.\n');
  process.exit(1);
}

// Dispatch
const { command, flags } = parsed;

let result;

switch (command) {
  case 'bootstrap':
    result = await runBootstrap({
      target: flags.target,
      version: flags.version,
      from: flags.from,
      dryRun: flags.dryRun,
    });
    break;

  case 'update':
    result = await runUpdate({
      target: flags.target,
      version: flags.version,
      from: flags.from,
      force: flags.force,
      dryRun: flags.dryRun,
    });
    break;

  case 'status':
    result = await runStatus({
      target: flags.target,
    });
    break;

  case 'verify':
    result = await runVerify({
      target: flags.target,
    });
    break;

  default:
    // Should not reach here — parseArgs would have added an error
    process.stderr.write(`Error: Unknown command "${command}"\n`);
    process.exit(1);
}

process.exit(result.exitCode);
