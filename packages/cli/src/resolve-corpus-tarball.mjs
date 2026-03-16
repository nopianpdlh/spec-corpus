import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const CORPUS_PACKAGE_NAME = '@spec-corpus/corpus';
const REGISTRY_OVERRIDE_ENV = 'SPEC_CORPUS_REGISTRY_TARBALL';

function validateTarballPath(filePath) {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    throw new Error(`Tarball not found: ${absPath}`);
  }
  return absPath;
}

function parsePackResult(stdout, spec) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error(`npm pack returned no JSON output for ${spec}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    throw new Error(`Failed to parse npm pack output for ${spec}: ${err.message}`);
  }

  if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0]?.filename) {
    throw new Error(`npm pack did not report a tarball filename for ${spec}`);
  }

  return parsed[0];
}

/**
 * Resolve the corpus tarball from either a local file or the npm registry.
 * Uses npm pack for registry-first resolution so npm handles tag/range lookup.
 *
 * In tests, SPEC_CORPUS_REGISTRY_TARBALL can force the registry path to a local fixture.
 *
 * @param {{ from: string|null, version: string|null }} opts
 * @returns {{ tarballPath: string, installSource: 'tarball'|'registry', cleanup: () => void, resolvedSpec: string|null }}
 */
export function resolveCorpusTarball({ from, version }) {
  if (from) {
    return {
      tarballPath: validateTarballPath(from),
      installSource: 'tarball',
      cleanup: () => {},
      resolvedSpec: null,
    };
  }

  const overrideTarball = process.env[REGISTRY_OVERRIDE_ENV];
  if (overrideTarball) {
    return {
      tarballPath: validateTarballPath(overrideTarball),
      installSource: 'registry',
      cleanup: () => {},
      resolvedSpec: `${CORPUS_PACKAGE_NAME}@${version ?? 'latest'}`,
    };
  }

  const spec = `${CORPUS_PACKAGE_NAME}@${version ?? 'latest'}`;
  const tempDir = mkdtempSync(join(tmpdir(), 'spec-corpus-registry-pack-'));

  try {
    const result = spawnSync('npm', ['pack', spec, '--json'], {
      cwd: tempDir,
      encoding: 'utf-8',
      timeout: 120_000,
    });

    if (result.status !== 0) {
      const msg = (result.stderr || result.error?.message || 'unknown error').trim();
      throw new Error(`Failed to fetch ${spec} from npm: ${msg}`);
    }

    const packResult = parsePackResult(result.stdout, spec);
    const tarballPath = validateTarballPath(join(tempDir, packResult.filename));

    return {
      tarballPath,
      installSource: 'registry',
      cleanup: () => {
        rmSync(tempDir, { recursive: true, force: true });
      },
      resolvedSpec: spec,
    };
  } catch (err) {
    rmSync(tempDir, { recursive: true, force: true });
    throw err;
  }
}
