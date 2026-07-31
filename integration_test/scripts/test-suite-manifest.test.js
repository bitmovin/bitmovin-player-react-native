const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { availableTestTags, createSpecs } = require('../tests');

describe('test suite manifest', () => {
  it('exposes a valid selector registry without loading React Native', () => {
    const names = availableTestTags.map(({ name }) => name);

    assert.equal(new Set(names).size, names.length);

    for (const { name, platforms } of availableTestTags) {
      assert.ok(name.length > 0);
      assert.ok(platforms.length > 0);
      assert.ok(
        platforms.every((platform) => ['android', 'ios'].includes(platform))
      );
    }
  });

  it('resolves and tags every registered suite module', () => {
    const originalTypeScriptLoader = require.extensions['.ts'];
    const loadedModulePaths = [];
    const registeredTags = [];

    require.extensions['.ts'] = (module, filename) => {
      loadedModulePaths.push(filename);
      module.exports = {
        default: (spec) => {
          spec.describe('suite', () => spec.it('test', () => {}));
        },
      };
    };

    try {
      const specs = createSpecs();

      assert.equal(specs.length, loadedModulePaths.length);
      for (const registerSpec of specs) {
        const scope = {
          describe(_label, defineTests, tag) {
            this.tag = tag;
            defineTests();
          },
          it() {
            registeredTags.push(this.tag);
          },
        };
        registerSpec(scope);
      }

      assert.deepEqual(
        registeredTags,
        availableTestTags.map(({ name }) => name)
      );
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
