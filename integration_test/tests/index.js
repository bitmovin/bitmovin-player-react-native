const androidAndIos = ['android', 'ios'];
const iosOnly = ['ios'];
// TODO: switch playlist to androidAndIos once the iOS playlist bridge is implemented
const androidOnly = ['android'];

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
  {
    ...testSuite(
      'loading-vod',
      androidAndIos,
      () => require('./loadingTest').loadingVodTests
    ),
    selectionOnly: true,
  },
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
  testSuite('playlist', androidOnly, () => require('./playlistTest').default),
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

// Like the native player suites, rerun a failed test once so slow external
// streams or ad servers do not fail CI. Passing tests run once.
function retryFailedTestsOnce(spec) {
  const it = spec.it.bind(spec);
  spec.it = (label, run, tag) => {
    const test = `${spec.describeLabel}: ${label}`;
    return it(
      label,
      async function () {
        try {
          await run.call(this);
        } catch (error) {
          console.warn(
            '[Cavy retry]',
            JSON.stringify({ test, error: String(error?.message ?? error) })
          );
          // Reset the app like Cavy does before every test.
          await this.component.clearAsync();
          this.component.reRender();
          await run.call(this);
        }
      },
      tag
    );
  };
}

function createSpecs() {
  const selectedTags = (process.env.EXPO_PUBLIC_CAVY_ONLY_TAGS || '')
    .split(',')
    .map((tag) => tag.trim());
  return testRegistrations
    .filter(
      ({ name, selectionOnly }) => !selectionOnly || selectedTags.includes(name)
    )
    .map(({ name, load }) => {
      const registerSuite = load();

      return (spec) => {
        const describe = spec.describe.bind(spec);
        spec.describe = (label, defineTests) =>
          describe(label, defineTests, name);
        retryFailedTestsOnce(spec);

        return registerSuite(spec);
      };
    });
}

module.exports = {
  availableTestTags,
  createSpecs,
};
