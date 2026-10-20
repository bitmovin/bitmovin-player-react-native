const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

test('each pause-ad case uses a fresh Google ad session', async () => {
  const configs = [];
  const cases = [];
  let description;
  function load(file, dependencies) {
    const exports = {};
    const { outputText } = ts.transpileModule(
      fs.readFileSync(path.join(__dirname, file), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    );
    vm.runInNewContext(outputText, {
      exports,
      require: (name) => dependencies[name] || {},
    });
    return exports;
  }
  const ads = load('../tests/helper/Ads.ts', {});
  const player = { pause() {}, play() {}, skipAd() {} };
  const helpers = {
    EventType: {},
    loadSourceConfig: async () => {},
    playUntil: async () => {},
    callPlayerAndExpectEvent: async (trigger) => trigger(player),
    startPlayerTest: async (config, body) => {
      configs.push(config);
      await body();
    },
  };
  const suite = load('../tests/advertisingTest.ts', {
    '../playertesting': helpers,
    './helper/Ads': ads,
    './helper/Sources': { Sources: {} },
    'react-native': { Platform: { OS: 'android' } },
    'bitmovin-player-react-native': { AdSourceType: { BITMOVIN: 'bitmovin' } },
  });
  suite.default({
    describe(name, register) {
      description = name;
      register();
    },
    it(name, run) {
      if (description === 'playing pause ads' && !name.includes('fails')) {
        cases.push(run);
      }
    },
  });
  assert.equal(cases.length, 3);
  for (const run of cases) await run();
  const tags = configs.map(
    (config) => config.advertisingConfig.schedule[0].sources[0].tag
  );
  assert.equal(new Set(tags).size, 3, 'players must not share a correlator');
  for (const tag of tags) {
    const url = new URL(tag);
    assert.equal(url.hostname, 'pubads.g.doubleclick.net');
    assert.match(url.searchParams.get('cust_params'), /nonlinear/);
    assert.ok(url.searchParams.get('correlator'));
  }
});
