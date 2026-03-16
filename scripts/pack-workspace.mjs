import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspace = process.argv[2];

if (!workspace) {
  console.error('Usage: node scripts/pack-workspace.mjs <workspace>');
  process.exit(1);
}

const destination = resolve('tmp/dist');
mkdirSync(destination, { recursive: true });

const result = spawnSync(
  'npm',
  ['pack', `--workspace=${workspace}`, '--pack-destination', destination],
  {
    cwd: resolve('.'),
    stdio: 'inherit',
    shell: true,
  }
);

process.exit(result.status ?? 1);
