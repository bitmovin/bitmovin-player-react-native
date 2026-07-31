const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { availableTestTags, createSpecs } = require('../tests');

describe('test suite manifest', () => {
  it('exposes a valid selector registry without loading React Native', () => {
    const names = availableTestTags.map(({ name }) => name);
    const cueMetadataTag = availableTestTags.find(
      ({ name }) => name === 'cue-metadata'
    );

    assert.equal(typeof createSpecs, 'function');
    assert.equal(new Set(names).size, names.length);
    assert.deepEqual(cueMetadataTag, {
      name: 'cue-metadata',
      platforms: ['android', 'ios'],
    });
    assert.equal(names.includes('cue-geometry'), false);

    for (const { name, platforms } of availableTestTags) {
      assert.ok(name.length > 0);
      assert.ok(platforms.length > 0);
      assert.ok(
        platforms.every((platform) => ['android', 'ios'].includes(platform))
      );
    }
  });

  it('resolves every registered suite module', () => {
    const originalTypeScriptLoader = require.extensions['.ts'];
    const loadedModulePaths = [];

    require.extensions['.ts'] = (module, filename) => {
      loadedModulePaths.push(filename);
      module.exports = { default: () => {} };
    };

    try {
      const specs = createSpecs();

      assert.equal(specs.length, loadedModulePaths.length);
      for (const registerSpec of specs) {
        assert.doesNotThrow(() => registerSpec({ describe() {} }));
      }
    } finally {
      for (const modulePath of loadedModulePaths) {
        delete require.cache[modulePath];
      }

      if (originalTypeScriptLoader) {
        require.extensions['.ts'] = originalTypeScriptLoader;
      } else {
        delete require.extensions['.ts'];
      }
    }
  });
});
