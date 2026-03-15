import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const schema = require('../src/release-manifest.schema.json');

describe('release-manifest.schema.json', () => {
  it('schema version is locked at 1', () => {
    assert.strictEqual(schema.properties.schemaVersion.const, 1);
    assert.strictEqual(schema.properties.schemaVersion.type, 'integer');
  });

  it('required fields include all expected properties', () => {
    const expected = [
      'schemaVersion',
      'packageName',
      'packageVersion',
      'sourceCommit',
      'generatedAt',
      'rootDocs',
      'corpora',
      'files',
      'manifestHash',
    ];
    for (const field of expected) {
      assert.ok(
        schema.required.includes(field),
        `"${field}" must be in required array`
      );
    }
  });

  it('sourceTag is defined but not required (optional)', () => {
    assert.ok(schema.properties.sourceTag, 'sourceTag property must exist');
    assert.ok(
      !schema.required.includes('sourceTag'),
      'sourceTag must NOT be required'
    );
  });

  it('files array items have path, hash, size', () => {
    const fileItem = schema.properties.files.items;
    assert.ok(fileItem.properties.path, 'file item must have path');
    assert.ok(fileItem.properties.hash, 'file item must have hash');
    assert.ok(fileItem.properties.size, 'file item must have size');
    assert.deepStrictEqual(fileItem.required, ['path', 'hash', 'size']);
  });

  it('corpora array items have corpusId, files, provenanceRef', () => {
    const corpusItem = schema.properties.corpora.items;
    assert.ok(corpusItem.properties.corpusId, 'corpus item must have corpusId');
    assert.ok(corpusItem.properties.files, 'corpus item must have files');
    assert.ok(
      corpusItem.properties.provenanceRef,
      'corpus item must have provenanceRef'
    );
    assert.deepStrictEqual(corpusItem.required, [
      'corpusId',
      'files',
      'provenanceRef',
    ]);
  });

  it('corpora files sub-items have path, hash, size', () => {
    const corpusFileItem = schema.properties.corpora.items.properties.files.items;
    assert.ok(corpusFileItem.properties.path, 'corpus file item must have path');
    assert.ok(corpusFileItem.properties.hash, 'corpus file item must have hash');
    assert.ok(corpusFileItem.properties.size, 'corpus file item must have size');
    assert.deepStrictEqual(corpusFileItem.required, ['path', 'hash', 'size']);
  });

  it('rootDocs array items have path, hash, size', () => {
    const rootDocItem = schema.properties.rootDocs.items;
    assert.ok(rootDocItem.properties.path, 'rootDoc item must have path');
    assert.ok(rootDocItem.properties.hash, 'rootDoc item must have hash');
    assert.ok(rootDocItem.properties.size, 'rootDoc item must have size');
    assert.deepStrictEqual(rootDocItem.required, ['path', 'hash', 'size']);
  });

  it('uses JSON Schema draft-07', () => {
    assert.strictEqual(schema.$schema, 'http://json-schema.org/draft-07/schema#');
  });
});
