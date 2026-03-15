#!/usr/bin/env node
/**
 * generate-release-manifest.mjs
 *
 * Reads the staged snapshot output from build-snapshot.mjs and produces
 * a release-manifest.json conforming to release-manifest.schema.json.
 * Also copies staged files into the output directory.
 *
 * Usage:
 *   node packages/corpus/scripts/generate-release-manifest.mjs --stage <stagingDir> --out <outDir>
 *
 * Where:
 *   --stage  Path to the staging dir produced by build-snapshot.mjs
 *            (e.g. tmp/stage  — manifest input is at tmp/release-manifest-input.json)
 *   --out    Output directory for dist artifacts (e.g. packages/corpus/dist)
 */

import { createHash } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  statSync,
  existsSync,
} from 'node:fs';
import {
  join,
  dirname,
  isAbsolute,
  resolve,
  relative,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const stageIdx = args.indexOf('--stage');
  const outIdx = args.indexOf('--out');
  if (stageIdx === -1 || !args[stageIdx + 1]) {
    console.error('Usage: node generate-release-manifest.mjs --stage <path> --out <path>');
    process.exit(1);
  }
  if (outIdx === -1 || !args[outIdx + 1]) {
    console.error('Usage: node generate-release-manifest.mjs --stage <path> --out <path>');
    process.exit(1);
  }
  return { stage: args[stageIdx + 1], out: args[outIdx + 1] };
}

function resolveAbs(p) {
  return isAbsolute(p) ? p : resolve(process.cwd(), p);
}

/**
 * Recursively copy all files from srcDir into destDir, preserving the
 * relative directory structure.
 */
function copyDirRecursive(srcDir, destDir) {
  if (!existsSync(srcDir)) return;
  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
    }
  }
}

function sha256hex(str) {
  return createHash('sha256').update(str, 'utf8').digest('hex');
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return '0000000000000000000000000000000000000000';
  }
}

function gitTag() {
  try {
    return execFileSync('git', ['describe', '--tags', '--exact-match', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { stage, out } = parseArgs(process.argv);

const stageAbs = resolveAbs(stage);
const outAbs = resolveAbs(out);

// manifest input is ONE level ABOVE the staging dir
const manifestInputPath = join(dirname(stageAbs), 'release-manifest-input.json');

if (!existsSync(manifestInputPath)) {
  console.error(`ERROR: release-manifest-input.json not found at: ${manifestInputPath}`);
  console.error('Run build-snapshot.mjs first.');
  process.exit(1);
}

const manifestInput = JSON.parse(readFileSync(manifestInputPath, 'utf8'));

// Read package version from packages/corpus/package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const packageVersion = pkg.version;

// --- Build corpora array (from object to array with provenanceRef) -----------
const corporaArray = Object.entries(manifestInput.corpora).map(([corpusId, files]) => ({
  corpusId,
  files,
  provenanceRef: `corpora/${corpusId}/skills-lock.json`,
}));

// --- Build manifest WITHOUT manifestHash ------------------------------------
const manifestWithoutHash = {
  schemaVersion: 1,
  packageName: '@spec-corpus/corpus',
  packageVersion,
  sourceCommit: gitHead(),
  sourceTag: gitTag(),
  generatedAt: new Date().toISOString(),
  rootDocs: manifestInput.root,
  corpora: corporaArray,
  files: manifestInput.files,
  manifestHash: '',
};

// Compute hash of the manifest without manifestHash field
const { manifestHash: _ignored, ...manifestForHashing } = manifestWithoutHash;
const computedHash = sha256hex(JSON.stringify(manifestForHashing));

const finalManifest = {
  ...manifestWithoutHash,
  manifestHash: computedHash,
};

// --- Ensure output dir exists ------------------------------------------------
mkdirSync(outAbs, { recursive: true });

// --- Copy staged content into output dir -------------------------------------
const stageRootDir = join(stageAbs, 'root');
const stageCorporaDir = join(stageAbs, 'corpora');

const outRootDir = join(outAbs, 'root');
const outCorporaDir = join(outAbs, 'corpora');

mkdirSync(outRootDir, { recursive: true });
mkdirSync(outCorporaDir, { recursive: true });

copyDirRecursive(stageRootDir, outRootDir);
copyDirRecursive(stageCorporaDir, outCorporaDir);

// --- Write release-manifest.json ---------------------------------------------
const manifestOutPath = join(outAbs, 'release-manifest.json');
writeFileSync(manifestOutPath, JSON.stringify(finalManifest, null, 2) + '\n', 'utf8');

// --- Summary -----------------------------------------------------------------
console.log(`✓ Release manifest written: ${manifestOutPath}`);
console.log(`  packageVersion : ${packageVersion}`);
console.log(`  sourceCommit   : ${finalManifest.sourceCommit}`);
console.log(`  sourceTag      : ${finalManifest.sourceTag || '(none)'}`);
console.log(`  rootDocs       : ${finalManifest.rootDocs.length}`);
console.log(`  corpora        : ${finalManifest.corpora.length}`);
console.log(`  files          : ${finalManifest.files.length}`);
console.log(`  manifestHash   : ${finalManifest.manifestHash}`);
console.log(`  generatedAt    : ${finalManifest.generatedAt}`);
console.log(`✓ Staged content copied to: ${outAbs}`);
