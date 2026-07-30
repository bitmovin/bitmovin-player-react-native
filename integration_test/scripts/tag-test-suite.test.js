const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { tagTestSuite } = require('./tag-test-suite');

function createScope() {
  const registeredTags = [];
  const scope = {
    describe(_label, defineTests, tag) {
      this.tag = tag;
      defineTests();
    },
    it(_label, _test, tag) {
      registeredTags.push(this.tag || tag);
    },
    beforeEach(hook) {
      this.beforeEachHook = hook;
    },
  };

  return { registeredTags, scope };
}

describe('tagTestSuite', () => {
  it('assigns the default tag', () => {
    const { registeredTags, scope } = createScope();
    const registerSuite = tagTestSuite((spec) => {
      spec.describe('playback', () => spec.it('plays', async () => {}));
    }, 'playback');

    registerSuite(scope);

    assert.deepEqual(registeredTags, ['playback']);
  });

  it('preserves an explicit subgroup tag', () => {
    const { registeredTags, scope } = createScope();
    const registerSuite = tagTestSuite((spec) => {
      spec.describe(
        'cue geometry',
        () => spec.it('reports layout', async () => {}),
        'cue-geometry'
      );
    }, 'caption-metadata');

    registerSuite(scope);

    assert.deepEqual(registeredTags, ['cue-geometry']);
  });

  it('preserves state stored by Cavy scope methods', () => {
    const beforeEachHook = () => {};
    const { scope } = createScope();
    const registerSuite = tagTestSuite((spec) => {
      spec.beforeEach(beforeEachHook);
    }, 'playback');

    registerSuite(scope);

    assert.equal(scope.beforeEachHook, beforeEachHook);
  });
});
