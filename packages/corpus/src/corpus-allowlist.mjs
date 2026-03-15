/**
 * corpus-allowlist.mjs
 *
 * Source-of-truth for what ships in @spec-corpus/corpus.
 * Defines root docs, corpora IDs, and exclusion predicate.
 */

export const ROOT_DOCS = [
  'README.md',
  'OPERATING-MODEL.md',
  'ARCHITECTURE.md',
  'CENTRAL-CHECKLIST.md',
  'CONTRIBUTING.md',
];

export const CORPORA = [
  'spec_frontend',
  'spec_backend',
  'spec_code-quality',
  'spec_documentation',
  'spec_infrastructure',
];

/**
 * Returns true for relative paths (within a corpus dir) that should be
 * EXCLUDED from staging.
 *
 * @param {string} relPath - path relative to corpus root, using forward slashes
 * @returns {boolean}
 */
export function isExcluded(relPath) {
  // Normalise to forward slashes
  const p = relPath.replace(/\\/g, '/');

  // .agents/ subdirectories — internal tooling, must NOT ship
  if (p.startsWith('.agents/') || p === '.agents') return true;

  // node_modules
  if (p.startsWith('node_modules/') || p === 'node_modules') return true;

  // .git
  if (p.startsWith('.git/') || p === '.git') return true;

  // .sisyphus
  if (p.startsWith('.sisyphus/') || p === '.sisyphus') return true;

  // tmp/
  if (p.startsWith('tmp/') || p === 'tmp') return true;

  // packages/ (distribution tooling, not corpus content)
  if (p.startsWith('packages/') || p === 'packages') return true;

  // handoff.md (case-insensitive)
  if (p.toLowerCase() === 'handoff.md') return true;

  // package.json / package-lock.json at root level only
  if (p === 'package.json' || p === 'package-lock.json') return true;

  // *.tgz
  if (p.endsWith('.tgz')) return true;

  return false;
}
