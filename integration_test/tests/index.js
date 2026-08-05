const androidAndIos = ['android', 'ios'];
const iosOnly = ['ios'];

function testSuite(name, platforms, load) {
  return { name, platforms, load };
}

const testRegistrations = [
  testSuite(
    'advertising',
    androidAndIos,
    () => require('./advertisingTest').default
  ),
  testSuite('caption', androidAndIos, () => require('./captionTest').default),
  testSuite(
    'cue-metadata',
    androidAndIos,
    () => require('./captionMetadataTest').default
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

const availableTestTags = testRegistrations.map(({ name, platforms }) => ({
  name,
  platforms,
}));

function createSpecs() {
  return testRegistrations.map(({ name, load }) => {
    const registerSuite = load();

    return (spec) => {
      const describe = spec.describe.bind(spec);
      spec.describe = (label, defineTests) =>
        describe(label, defineTests, name);

      return registerSuite(spec);
    };
  });
}

module.exports = {
  availableTestTags,
  createSpecs,
};
