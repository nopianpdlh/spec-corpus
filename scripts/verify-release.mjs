import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

console.log('--- verify:release ---');

function runCommand(cmd, args, cwd = resolve('.')) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`Command failed with status ${result.status}`);
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(1);
  }
  return result;
}

console.log('\n1. Packing packages...');
runCommand('npm', ['run', 'pack:corpus']);
runCommand('npm', ['run', 'pack:cli']);

const corpusVersion = JSON.parse(readFileSync(resolve('packages/corpus/package.json'), 'utf-8')).version;
const cliVersion = JSON.parse(readFileSync(resolve('packages/cli/package.json'), 'utf-8')).version;

const corpusTarball = resolve(`tmp/dist/spec-corpus-corpus-${corpusVersion}.tgz`);
const cliTarball = resolve(`tmp/dist/spec-corpus-${cliVersion}.tgz`);

if (!existsSync(corpusTarball)) {
  console.error(`Missing corpus tarball at ${corpusTarball}`);
  process.exit(1);
}
if (!existsSync(cliTarball)) {
  console.error(`Missing cli tarball at ${cliTarball}`);
  process.exit(1);
}

const tmpBase = join(tmpdir(), `verify-release-${Date.now()}`);
mkdirSync(tmpBase, { recursive: true });

try {
  console.log('\n2. Extracting CLI tarball to test executable...');
  const cliExtractPath = join(tmpBase, 'cli-extract');
  mkdirSync(cliExtractPath, { recursive: true });
  runCommand('npm', ['install', '--no-save', cliTarball], cliExtractPath);
  
  const cliBin = join(cliExtractPath, 'node_modules', 'spec-corpus', 'bin', 'spec-corpus.js');
  
  if (!existsSync(cliBin)) {
    console.error(`CLI bin not found after install at ${cliBin}`);
    process.exit(1);
  }

  console.log('\n3. Bootstrap smoke test...');
  const bootstrapTarget = join(tmpBase, 'bootstrap-test');
  mkdirSync(bootstrapTarget, { recursive: true });
  
  runCommand('node', [cliBin, 'bootstrap', '--target', bootstrapTarget, '--from', corpusTarball]);
  
  const installJsonPath = join(bootstrapTarget, '.spec-corpus', 'install.json');
  if (!existsSync(installJsonPath)) {
    console.error(`Bootstrap failed: missing ${installJsonPath}`);
    process.exit(1);
  }
  
  console.log('Bootstrap smoke test passed.');

  console.log('\n4. Update smoke test...');
  const updateTarget = join(tmpBase, 'update-test');
  mkdirSync(updateTarget, { recursive: true });
  
  // Set up fake v0.0.1 state
  const specDir = join(updateTarget, '.spec-corpus');
  const snapshotsDir = join(specDir, 'snapshots');
  const snap001 = join(snapshotsDir, '0.0.1');
  
  mkdirSync(snap001, { recursive: true });
  writeFileSync(join(snap001, 'dummy.txt'), 'fake old version');
  
  writeFileSync(join(specDir, 'install.json'), JSON.stringify({
    schemaVersion: 1,
    corpusPackageName: '@spec-corpus/corpus',
    corpusPackageVersion: '0.0.1',
    corpusPackageIntegrity: 'sha512-fake',
    cliPackageName: 'spec-corpus',
    cliPackageVersion: cliVersion,
    activeSnapshotVersion: '0.0.1',
    activeSnapshotPath: '.spec-corpus/snapshots/0.0.1',
    installedAt: new Date().toISOString(),
    installSource: 'tarball'
  }, null, 2));

  // Run update
  runCommand('node', [cliBin, 'update', '--target', updateTarget, '--from', corpusTarball]);

  // Verify new version
  const updatedInstallJsonPath = join(updateTarget, '.spec-corpus', 'install.json');
  const record = JSON.parse(readFileSync(updatedInstallJsonPath, 'utf-8'));
  
  if (record.activeSnapshotVersion !== corpusVersion) {
    console.error(`Update failed: expected version ${corpusVersion}, got ${record.activeSnapshotVersion}`);
    process.exit(1);
  }
  
  console.log('Update smoke test passed.');

  console.log('\n--- verify:release SUCCESS ---');
} finally {
  rmSync(tmpBase, { recursive: true, force: true });
}
