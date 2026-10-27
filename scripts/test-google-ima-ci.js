const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const YAML = require('yaml');

const root = path.resolve(__dirname, '..');
const workflow = (name) =>
  YAML.parse(
    fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8')
  );
const runs = (job) => job.steps.map((step) => step.run || '').join('\n');

test('Android example verifies Google IMA is present', () => {
  const job = workflow('ci-android.yml').jobs['test-build-android'];
  assert.notEqual(job.env?.BITMOVIN_ENABLE_GOOGLE_IMA, 'false');
  assert.match(runs(job), /debugRuntimeClasspath/);
  assert.match(
    runs(job),
    /com\.google\.ads\.interactivemedia\.v3:interactivemedia/
  );
  assert.match(runs(job), /Missing Google IMA/);
});

test('Android integration build disables Google IMA and verifies its absence', () => {
  const job =
    workflow('ci-android.yml').jobs['test-build-android-integration-tests'];
  assert.equal(job.env?.BITMOVIN_ENABLE_GOOGLE_IMA, 'false');
  assert.match(runs(job), /debugRuntimeClasspath/);
  assert.match(
    runs(job),
    /com\.google\.ads\.interactivemedia\.v3:interactivemedia/
  );
  assert.match(runs(job), /Unexpected Google IMA/);
});

test('iOS integration build disables Google IMA and verifies package and framework absence', () => {
  const job = workflow('ci-ios-tvos.yml').jobs['ios-integration-build'];
  assert.equal(job.env?.BITMOVIN_ENABLE_GOOGLE_IMA, 'false');
  assert.match(runs(job), /Package\.resolved/);
  assert.match(runs(job), /GoogleInteractiveMediaAds/);
  assert.match(runs(job), /Unexpected Google IMA/);
});

test('tvOS builds and verifies both enabled and disabled Google IMA variants', () => {
  const job = workflow('ci-ios-tvos.yml').jobs['tvos-example-build'];
  assert.ok(job.strategy?.matrix?.include, 'tvOS job must define a matrix');
  const variants = job.strategy.matrix.include.map(
    (entry) => entry['google-ima']
  );
  assert.deepEqual(variants.sort(), ['false', 'true']);
  assert.match(runs(job), /Package\.resolved/);
  assert.match(runs(job), /GoogleInteractiveMediaAdsTvOS/);
  assert.match(runs(job), /Missing Google IMA/);
  assert.match(runs(job), /Unexpected Google IMA/);
});
