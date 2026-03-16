import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const schema = require('../src/install-record.schema.json');

describe('install-record.schema.json', () => {
  it('schema version is locked at 1', () => {
    assert.strictEqual(schema.properties.schemaVersion.const, 1);
    assert.strictEqual(schema.properties.schemaVersion.type, 'integer');
  });

  it('required fields include all expected properties', () => {
    const expected = [
      'schemaVersion',
      'layoutVersion',
      'corpusPackageName',
      'corpusPackageVersion',
      'corpusPackageIntegrity',
      'cliPackageName',
      'cliPackageVersion',
      'activeSnapshotVersion',
      'installedAt',
      'installSource',
    ];
    for (const field of expected) {
      assert.ok(
        schema.required.includes(field),
        `"${field}" must be in required array`
      );
    }
  });

  it('updatedAt is defined but not required (optional)', () => {
    assert.ok(schema.properties.updatedAt, 'updatedAt property must exist');
    assert.ok(
      !schema.required.includes('updatedAt'),
      'updatedAt must NOT be required'
    );
  });

  it('installSource enum is exactly ["registry", "tarball"]', () => {
    assert.deepStrictEqual(schema.properties.installSource.enum, [
      'registry',
      'tarball',
    ]);
  });

  it('layoutVersion enum is [1, 2]', () => {
    assert.deepStrictEqual(schema.properties.layoutVersion.enum, [1, 2]);
  });

  it('activeSnapshotPath remains optional for legacy v1 compatibility', () => {
    assert.ok(schema.properties.activeSnapshotPath, 'activeSnapshotPath property must exist');
    assert.ok(
      !schema.required.includes('activeSnapshotPath'),
      'activeSnapshotPath must NOT be required in layout v2'
    );
  });

  it('schema does NOT define a files property (thin install record)', () => {
    assert.strictEqual(
      schema.properties.files,
      undefined,
      'install record schema must NOT contain a "files" property — keep it thin'
    );
  });

  it('additionalProperties is false (strict shape)', () => {
    assert.strictEqual(schema.additionalProperties, false);
  });

  it('uses JSON Schema draft-07', () => {
    assert.strictEqual(schema.$schema, 'http://json-schema.org/draft-07/schema#');
  });
});
