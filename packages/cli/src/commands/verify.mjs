/**
 * verify.mjs — verify command handler (stub)
 *
 * Full integrity-check logic will be implemented in a later task.
 * This stub satisfies the v1 command contract and output shape.
 *
 * Output contract:
 *   stdout: JSON line with { event: "verify", command: "verify", target, status: "not-implemented" }
 *   stderr: human-readable summary
 */

/**
 * Run the verify command.
 * @param {{ target: string }} options
 * @returns {Promise<{ exitCode: number }>}
 */
export async function runVerify(options) {
  const { target } = options;

  const result = {
    event: 'verify',
    command: 'verify',
    target,
    status: 'not-implemented',
    message: 'Full integrity verification will be added in a later task.',
  };

  process.stdout.write(JSON.stringify(result) + '\n');
  process.stderr.write(`[verify] ${target}\n`);
  process.stderr.write(`  status: not-implemented\n`);
  process.stderr.write(`  Full integrity verification will be added in a later task.\n`);

  return { exitCode: 0 };
}
