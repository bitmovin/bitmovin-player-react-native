const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { availableTestTags, createSpecs, testSelectors } = require('../tests');

describe('test suite manifest', () => {
  it('exposes every suite and focused selector without loading React Native', () => {
    assert.deepEqual(availableTestTags, [
      { name: 'advertising', platforms: ['android', 'ios'] },
      { name: 'caption', platforms: ['android', 'ios'] },
      { name: 'cue-geometry', platforms: ['android', 'ios'] },
      { name: 'cue-metadata', platforms: ['ios'] },
      { name: 'error', platforms: ['android', 'ios'] },
      { name: 'loading', platforms: ['android', 'ios'] },
      { name: 'media-controls', platforms: ['ios'] },
      { name: 'metadata-id3', platforms: ['android', 'ios'] },
      { name: 'playback', platforms: ['android', 'ios'] },
      { name: 'unloading', platforms: ['android', 'ios'] },
      { name: 'audio-track', platforms: ['android', 'ios'] },
      { name: 'video-quality', platforms: ['android', 'ios'] },
    ]);
    assert.equal(typeof createSpecs, 'function');
    assert.equal(testSelectors.cueGeometry, 'cue-geometry');
    assert.equal(testSelectors.cueMetadata, 'cue-metadata');
  });
});
