const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { tagTestSuite } = require('./tag-test-suite');

describe('tagTestSuite', () => {
  it('assigns the suite tag to otherwise untagged tests', () => {
    const registeredTags = [];
    const scope = {
      describe(_label, defineTests, tag) {
        this.tag = tag;
        defineTests();
      },
      it(_label, _test, tag) {
        registeredTags.push(this.tag || tag);
      },
    };
    const registerSuite = tagTestSuite((spec) => {
      spec.describe('playing a source', () => {
        spec.it('plays', async () => {});
      });
    }, 'playback');

    registerSuite(scope);

    assert.deepEqual(registeredTags, ['playback']);
  });

  it('preserves an explicitly tagged subgroup', () => {
    const registeredTags = [];
    const scope = {
      describe(_label, defineTests, tag) {
        this.tag = tag;
        defineTests();
      },
      it(_label, _test, tag) {
        registeredTags.push(this.tag || tag);
      },
    };
    const registerSuite = tagTestSuite((spec) => {
      spec.describe(
        'cue geometry',
        () => {
          spec.it('reports layout', async () => {});
        },
        'cue-geometry'
      );
    }, 'caption-metadata');

    registerSuite(scope);

    assert.deepEqual(registeredTags, ['cue-geometry']);
  });
});
