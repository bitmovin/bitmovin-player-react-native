const { tagTestSuite } = require('../scripts/tag-test-suite');

const androidAndIos = ['android', 'ios'];
const iosOnly = ['ios'];
const cueMetadataSelector = 'cue-metadata';

function testSuite(name, platforms, load, additionalSelectors = []) {
  return { name, platforms, load, additionalSelectors };
}

const testRegistrations = [
  testSuite(
    'advertising',
    androidAndIos,
    () => require('./advertisingTest').default
  ),
  testSuite('caption', androidAndIos, () => require('./captionTest').default),
  testSuite(
    'cue-geometry',
    androidAndIos,
    () => require('./captionMetadataTest').default,
    [{ name: cueMetadataSelector, platforms: iosOnly }]
  ),
  testSuite('error', androidAndIos, () => require('./errorTest').default),
  testSuite('loading', androidAndIos, () => require('./loadingTest').default),
  testSuite(
    'media-controls',
    iosOnly,
    () => require('./mediaControlsTest').default
  ),
  testSuite(
    'metadata-id3',
    androidAndIos,
    () => require('./metadataId3Test').default
  ),
  testSuite('playback', androidAndIos, () => require('./playbackTest').default),
  testSuite(
    'unloading',
    androidAndIos,
    () => require('./unloadingTest').default
  ),
  testSuite(
    'audio-track',
    androidAndIos,
    () => require('./audioTrackTest').default
  ),
  testSuite(
    'video-quality',
    androidAndIos,
    () => require('./videoQualityTest').default
  ),
];

const availableTestTags = testRegistrations.flatMap(
  ({ name, platforms, additionalSelectors }) => [
    { name, platforms },
    ...additionalSelectors,
  ]
);

function createSpecs() {
  return testRegistrations.map(({ name, load }) => tagTestSuite(load(), name));
}

module.exports = {
  availableTestTags,
  createSpecs,
  cueMetadataSelector,
};
