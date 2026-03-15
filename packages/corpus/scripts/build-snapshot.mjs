#!/usr/bin/env node
/**
 * build-snapshot.mjs
 *
 * Copies exactly the allowed public files into a staging tree with per-file
 * hashes and sizes, ready for packaging by Task 4.
 *
 * Usage:
 *   node packages/corpus/scripts/build-snapshot.mjs --out <path>
 *
 * Output layout:
 *   <out>/root/                   — 5 root docs
 *   <out>/corpora/<corpus-id>/    — 5 corpora (without .agents/)
 *   <out>/release-manifest-input.json
 */

import { createHash } from 'node:crypto';
import {
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  copyFileSync,
  existsSync,
} from 'node:fs';
import { join, relative, dirname, sep, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT_DOCS, CORPORA, isExcluded } from '../src/corpus-allowlist.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIdx = args.indexOf('--out');
  if (outIdx === -1 || !args[outIdx + 1]) {
    console.error('Usage: node build-snapshot.mjs --out <path>');
    process.exit(1);
  }
  return { out: args[outIdx + 1] };
}

function sha256hex(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function fileEntry(absPath, stagingRelPath) {
  const stat = statSync(absPath);
  return {
    path: stagingRelPath.replace(/\\/g, '/'),
    hash: sha256hex(absPath),
    size: stat.size,
  };
}

/**
 * Recursively collect all files under `dir`, skipping entries for which
 * `isExcluded(relPathFromDir)` returns true.
 *
 * @param {string} dir        - absolute path to walk
 * @param {string} [baseDir]  - base used to compute relative paths (defaults to dir)
 * @returns {{ absPath: string, relPath: string }[]}
 */
function walkDir(dir, baseDir = dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = join(dir, entry.name);
    const relPath = relative(baseDir, absPath).replace(/\\/g, '/');

    if (isExcluded(relPath)) continue;

    if (entry.isDirectory()) {
      results.push(...walkDir(absPath, baseDir));
    } else if (entry.isFile()) {
      results.push({ absPath, relPath });
    }
  }
  return results;
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { out } = parseArgs(process.argv);

// Resolve repo root relative to this script: packages/corpus/scripts/ → ../../..
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..');

const outAbs = isAbsolute(out) ? out : resolve(process.cwd(), out);

const allFiles = [];
const corporaMap = {};

// --- 1. Root docs -----------------------------------------------------------
const rootOutDir = join(outAbs, 'root');
ensureDir(rootOutDir);

for (const doc of ROOT_DOCS) {
  const src = join(repoRoot, doc);
  if (!existsSync(src)) {
    console.error(`ERROR: Root doc not found: ${src}`);
    process.exit(1);
  }
  const dest = join(rootOutDir, doc);
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
  const entry = fileEntry(src, `root/${doc}`);
  allFiles.push(entry);
}

// --- 2. Corpora -------------------------------------------------------------
const corporaOutDir = join(outAbs, 'corpora');
ensureDir(corporaOutDir);

for (const corpusId of CORPORA) {
  const corpusSrc = join(repoRoot, corpusId);
  if (!existsSync(corpusSrc)) {
    console.error(`ERROR: Corpus dir not found: ${corpusSrc}`);
    process.exit(1);
  }

  const corpusFiles = walkDir(corpusSrc);
  const corpusEntries = [];

  for (const { absPath, relPath } of corpusFiles) {
    const stagingRelPath = `corpora/${corpusId}/${relPath}`;
    const dest = join(corporaOutDir, corpusId, relPath);
    ensureDir(dirname(dest));
    copyFileSync(absPath, dest);
    const entry = fileEntry(absPath, stagingRelPath);
    allFiles.push(entry);
    corpusEntries.push(entry);
  }

  corporaMap[corpusId] = corpusEntries;
}

// --- 3. Write manifest input ------------------------------------------------
const manifestInput = {
  root: allFiles.filter((f) => f.path.startsWith('root/')),
  corpora: corporaMap,
  files: allFiles,
};

const manifestPath = join(outAbs, 'release-manifest-input.json');
import { writeFileSync } from 'node:fs';
writeFileSync(manifestPath, JSON.stringify(manifestInput, null, 2) + '\n', 'utf8');

// --- 4. Summary -------------------------------------------------------------
console.log(`✓ Snapshot staged to: ${outAbs}`);
console.log(`  Root docs : ${ROOT_DOCS.length}`);
console.log(`  Corpora   : ${CORPORA.length}`);
console.log(`  Total files: ${allFiles.length}`);
console.log(`  Manifest  : ${manifestPath}`);
