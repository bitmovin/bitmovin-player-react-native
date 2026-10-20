const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function registeredTests(file, platform, ci = true) {
  const source = fs.readFileSync(
    path.join(__dirname, '../tests', file),
    'utf8'
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  const messages = [];
  vm.runInNewContext(outputText, {
    exports,
    process: { env: { EXPO_PUBLIC_CAVY_CI: ci ? '1' : '' } },
    console: { warn: (message) => messages.push(message) },
    require(name) {
      if (name === 'react-native') return { Platform: { OS: platform } };
      if (name === 'bitmovin-player-react-native') {
        return {
          AdSourceType: {
            IMA: 'ima',
            BITMOVIN: 'bitmovin',
            PROGRESSIVE: 'progressive',
          },
        };
      }
      if (name === './helper/Ads') return { AdTags: {} };
      return {};
    },
  });
  const names = [];
  exports.default({
    describe(_name, register) {
      register();
    },
    it(name) {
      names.push(name);
    },
  });
  return { names, messages };
}

for (const platform of ['android', 'ios']) {
  test(`${platform}: only registers its actual ID3 assertions`, () => {
    const { names } = registeredTests('metadataId3Test.ts', platform);
    assert.equal(names.length, 1);
    assert.match(names[0], platform === 'android' ? /Android/ : /iOS/);
  });

  test(`${platform}: only registers supported media-control assertions`, () => {
    assert.equal(
      registeredTests('mediaControlsTest.ts', platform).names.length,
      platform === 'ios' ? 1 : 0
    );
  });

  test(`${platform}: only registers supported ad-break filtering assertions`, () => {
    const { names } = registeredTests('advertisingTest.ts', platform);
    assert.equal(
      names.filter(
        (name) => name === 'skips ad break when callback returns false'
      ).length,
      platform === 'android' ? 5 : 0
    );
  });
}

test('iOS CI excludes FairPlay explicitly instead of registering a passing no-op', () => {
  const { names, messages } = registeredTests('errorTest.ts', 'ios');
  assert.deepEqual(names, []);
  assert.ok(messages.some((message) => /FairPlay.*physical/i.test(message)));
});

test('retains Android DRM and excludes FairPlay from the local simulator runner', () => {
  assert.equal(registeredTests('errorTest.ts', 'android').names.length, 1);
  assert.equal(registeredTests('errorTest.ts', 'ios', false).names.length, 0);
});
