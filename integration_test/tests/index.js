const { tagTestSuite } = require('../scripts/tag-test-suite');

const androidAndIos = ['android', 'ios'];

const testSelectors = Object.freeze({
  advertising: 'advertising',
  audioTrack: 'audio-track',
  caption: 'caption',
  cueGeometry: 'cue-geometry',
  cueMetadata: 'cue-metadata',
  error: 'error',
  loading: 'loading',
  mediaControls: 'media-controls',
  metadataId3: 'metadata-id3',
  playback: 'playback',
  unloading: 'unloading',
  videoQuality: 'video-quality',
});

const testRegistrations = [
  {
    defaultSelector: {
      name: testSelectors.advertising,
      platforms: androidAndIos,
    },
    load: () => require('./advertisingTest').default,
  },
  {
    defaultSelector: {
      name: testSelectors.caption,
      platforms: androidAndIos,
    },
    load: () => require('./captionTest').default,
  },
  {
    focusedSelectors: [
      { name: testSelectors.cueGeometry, platforms: androidAndIos },
      { name: testSelectors.cueMetadata, platforms: ['ios'] },
    ],
    load: () => require('./captionMetadataTest').default,
  },
  {
    defaultSelector: {
      name: testSelectors.error,
      platforms: androidAndIos,
    },
    load: () => require('./errorTest').default,
  },
  {
    defaultSelector: {
      name: testSelectors.loading,
      platforms: androidAndIos,
    },
    load: () => require('./loadingTest').default,
  },
  {
    defaultSelector: {
      name: testSelectors.mediaControls,
      platforms: ['ios'],
    },
    load: () => require('./mediaControlsTest').default,
  },
  {
    defaultSelector: {
      name: testSelectors.metadataId3,
      platforms: androidAndIos,
    },
    load: () => require('./metadataId3Test').default,
  },
  {
    defaultSelector: {
      name: testSelectors.playback,
      platforms: androidAndIos,
    },
    load: () => require('./playbackTest').default,
  },
  {
    defaultSelector: {
      name: testSelectors.unloading,
      platforms: androidAndIos,
    },
    load: () => require('./unloadingTest').default,
  },
  {
    defaultSelector: {
      name: testSelectors.audioTrack,
      platforms: androidAndIos,
    },
    load: () => require('./audioTrackTest').default,
  },
  {
    defaultSelector: {
      name: testSelectors.videoQuality,
      platforms: androidAndIos,
    },
    load: () => require('./videoQualityTest').default,
  },
];

const availableTestTags = testRegistrations.flatMap(
  ({ defaultSelector, focusedSelectors = [] }) => [
    ...(defaultSelector ? [defaultSelector] : []),
    ...focusedSelectors,
  ]
);

function createSpecs() {
  return testRegistrations.map(({ defaultSelector, load }) => {
    const registerSuite = load();
    return defaultSelector
      ? tagTestSuite(registerSuite, defaultSelector.name)
      : registerSuite;
  });
}

module.exports = {
  availableTestTags,
  createSpecs,
  testSelectors,
};
