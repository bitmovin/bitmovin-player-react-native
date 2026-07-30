const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  availableTestTags,
  createSpecs,
  cueMetadataSelector,
} = require('../tests');

describe('test suite manifest', () => {
  it('exposes a valid selector registry without loading React Native', () => {
    const names = availableTestTags.map(({ name }) => name);

    assert.equal(typeof createSpecs, 'function');
    assert.equal(cueMetadataSelector, 'cue-metadata');
    assert.equal(new Set(names).size, names.length);
    assert.ok(names.includes(cueMetadataSelector));

    for (const { name, platforms } of availableTestTags) {
      assert.ok(name.length > 0);
      assert.ok(platforms.length > 0);
      assert.ok(
        platforms.every((platform) => ['android', 'ios'].includes(platform))
      );
    }
  });
});
