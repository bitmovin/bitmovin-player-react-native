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
        availableTestTags
          .map(({ name }) => name)
          .filter((name) => name !== 'loading-vod')
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

  it('offers a VOD-only loading selector without duplicating the full loading suite', () => {
    assert.ok(availableTestTags.some(({ name }) => name === 'loading-vod'));
    const originalTypeScriptLoader = require.extensions['.ts'];
    const originalTags = process.env.EXPO_PUBLIC_CAVY_ONLY_TAGS;
    const loaded = [];
    const calls = [];
    require.extensions['.ts'] = (module, filename) => {
      loaded.push(filename);
      module.exports = {
        default: () => calls.push('full'),
        loadingVodTests: () => calls.push('vod'),
      };
    };
    try {
      process.env.EXPO_PUBLIC_CAVY_ONLY_TAGS = 'playback,loading-vod';
      for (const register of createSpecs())
        register({ describe() {}, it() {} });
      assert.equal(calls.filter((call) => call === 'vod').length, 1);
      delete process.env.EXPO_PUBLIC_CAVY_ONLY_TAGS;
      calls.length = 0;
      for (const register of createSpecs())
        register({ describe() {}, it() {} });
      assert.ok(calls.length > 0);
      assert.ok(calls.every((call) => call === 'full'));
    } finally {
      for (const filename of loaded) delete require.cache[filename];
      if (originalTypeScriptLoader)
        require.extensions['.ts'] = originalTypeScriptLoader;
      else delete require.extensions['.ts'];
      if (originalTags === undefined)
        delete process.env.EXPO_PUBLIC_CAVY_ONLY_TAGS;
      else process.env.EXPO_PUBLIC_CAVY_ONLY_TAGS = originalTags;
    }
  });

  it('reruns only failed tests once, resetting the app in between', async () => {
    const originalTypeScriptLoader = require.extensions['.ts'];
    const originalWarn = console.warn;
    const loadedModulePaths = [];
    const attempts = { passes: 0, flaky: 0, broken: 0 };
    const resets = [];
    const warnings = [];

    require.extensions['.ts'] = (module, filename) => {
      loadedModulePaths.push(filename);
      module.exports = {
        default: (spec) => {
          spec.describe('suite', () => {
            spec.it('passes', async () => {
              attempts.passes += 1;
            });
            spec.it('flaky', async () => {
              attempts.flaky += 1;
              if (attempts.flaky === 1) throw new Error('slow stream');
            });
            spec.it('broken', async () => {
              attempts.broken += 1;
              throw new Error(`broken attempt ${attempts.broken}`);
            });
          });
        },
      };
    };
    console.warn = (...args) => warnings.push(args.join(' '));

    try {
      const [registerSpec] = createSpecs();
      const testCases = [];
      const scope = {
        component: {
          clearAsync: async () => resets.push('clear'),
          reRender: () => resets.push('render'),
        },
        describe(label, defineTests) {
          this.describeLabel = label;
          defineTests();
        },
        it(label, run) {
          testCases.push({ label, run });
        },
      };
      registerSpec(scope);

      const [passes, flaky, broken] = testCases;
      await passes.run.call(scope);
      await flaky.run.call(scope);
      await assert.rejects(broken.run.call(scope), /broken attempt 2/);

      assert.deepEqual(attempts, { passes: 1, flaky: 2, broken: 2 });
      assert.deepEqual(resets, ['clear', 'render', 'clear', 'render']);
      assert.equal(warnings.length, 2);
      assert.match(warnings[0], /\[Cavy retry\].*suite: flaky.*slow stream/);
    } finally {
      console.warn = originalWarn;
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
