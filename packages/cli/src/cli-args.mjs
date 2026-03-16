/**
 * cli-args.mjs — deterministic argument parser for spec-corpus CLI (v1)
 *
 * No external dependencies. Parses process.argv manually.
 *
 * V1 locked command signatures:
 *   init      [--target <path>] [--version <semver>] [--from <tgz>] [--dry-run]
 *   bootstrap --target <path> [--version <semver>] [--from <tgz>] [--dry-run]
 *   update    --target <path> [--version <semver>] [--from <tgz>] [--force] [--dry-run]
 *   status    --target <path>
 *   verify    --target <path>
 *
 * Returns a ParseResult: { command, args, errors }
 */

export const COMMANDS = ['init', 'bootstrap', 'update', 'status', 'verify'];

/**
 * @typedef {Object} ParsedArgs
 * @property {string} command - One of COMMANDS, or null for top-level flags
 * @property {Object} flags - Parsed flag values
 * @property {string|null} flags.target
 * @property {string|null} flags.version
 * @property {string|null} flags.from
 * @property {boolean} flags.dryRun
 * @property {boolean} flags.force
 * @property {boolean} flags.help
 * @property {string[]} errors - Validation errors (empty = valid)
 */

/**
 * Parse argv array (typically process.argv.slice(2)).
 * @param {string[]} argv
 * @returns {ParsedArgs}
 */
export function parseArgs(argv) {
  const errors = [];
  let command = null;
  const flags = {
    target: null,
    version: null,
    from: null,
    dryRun: false,
    force: false,
    help: false,
  };

  // Collect unknown flags for error reporting
  const unknownFlags = [];

  let i = 0;

  // First positional arg (if present and not a flag) is the command
  if (argv.length > 0 && !argv[0].startsWith('-')) {
    command = argv[0];
    i = 1;
  }

  // Parse remaining flags
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      i++;
      continue;
    }

    if (arg === '--dry-run') {
      flags.dryRun = true;
      i++;
      continue;
    }

    if (arg === '--force') {
      flags.force = true;
      i++;
      continue;
    }

    if (arg === '--target') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        errors.push('--target requires a value');
        i++;
      } else {
        flags.target = argv[i + 1];
        i += 2;
      }
      continue;
    }

    if (arg.startsWith('--target=')) {
      flags.target = arg.slice('--target='.length);
      i++;
      continue;
    }

    if (arg === '--version') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        errors.push('--version requires a value');
        i++;
      } else {
        flags.version = argv[i + 1];
        i += 2;
      }
      continue;
    }

    if (arg.startsWith('--version=')) {
      flags.version = arg.slice('--version='.length);
      i++;
      continue;
    }

    if (arg === '--from') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        errors.push('--from requires a value');
        i++;
      } else {
        flags.from = argv[i + 1];
        i += 2;
      }
      continue;
    }

    if (arg.startsWith('--from=')) {
      flags.from = arg.slice('--from='.length);
      i++;
      continue;
    }

    // Unknown flag or positional after command
    if (arg.startsWith('-')) {
      unknownFlags.push(arg);
      i++;
    } else {
      // Extra positional argument
      errors.push(`Unexpected argument: ${arg}`);
      i++;
    }
  }

  // Validate command
  if (command !== null && !COMMANDS.includes(command)) {
    errors.push(`Unknown command: "${command}". Expected one of: ${COMMANDS.join(', ')}`);
  }

  // Report unknown flags
  for (const flag of unknownFlags) {
    errors.push(`Unknown flag: ${flag}`);
  }

  // Apply command defaults before validation
  if (command === 'init' && !flags.target) {
    flags.target = '.';
  }

  // Validate required flags per command (only when not in help mode)
  if (command !== null && !flags.help) {
    if (COMMANDS.includes(command)) {
      if (!flags.target) {
        errors.push(`--target <path> is required for "${command}"`);
      }
    }
  }

  // Validate flag compatibility per command
  if (command && COMMANDS.includes(command)) {
    if (flags.force && command !== 'update') {
      errors.push(`--force is only valid for the "update" command`);
    }
    if (flags.dryRun && (command === 'status' || command === 'verify')) {
      errors.push(`--dry-run is not valid for the "${command}" command`);
    }
  }

  return { command, flags, errors };
}

/**
 * Build a human-readable usage string.
 * @returns {string}
 */
export function buildUsage() {
  return `spec-corpus — CLI tool for installing and managing the spec-corpus in your project

USAGE
  spec-corpus <command> [flags]

COMMANDS
  init        Install the spec-corpus into the current project (friendly default)
  bootstrap   Install the spec-corpus into a target project directory
  update      Update an existing spec-corpus installation to a newer version
  status      Report the installation status of the spec-corpus in a target directory
  verify      Verify the integrity of the installed spec-corpus files

FLAGS (per command)
  init       [--target <path>]  [--version <semver>]  [--from <tgz>]  [--dry-run]
  bootstrap  --target <path>  [--version <semver>]  [--from <tgz>]  [--dry-run]
  update     --target <path>  [--version <semver>]  [--from <tgz>]  [--force]  [--dry-run]
  status     --target <path>
  verify     --target <path>

GLOBAL FLAGS
  --help, -h   Show this help message

EXAMPLES
  spec-corpus init
  spec-corpus init --target ./my-project
  spec-corpus bootstrap --target ./my-project
  spec-corpus bootstrap --target ./my-project --dry-run
  spec-corpus update --target ./my-project --force
  spec-corpus status --target ./my-project
  spec-corpus verify --target ./my-project
`;
}
