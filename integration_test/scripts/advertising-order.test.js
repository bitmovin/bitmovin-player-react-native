const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

// Run the Cavy test bodies and real event helpers without mounting a native view.
function advertisingHarness(platform, timing) {
  const timers = new Set();
  const modules = new Map();
  const observations = [];
  let nextId = 0;
  const native = {
    AdSourceType: {
      IMA: 'ima',
      BITMOVIN: 'bitmovin',
      PROGRESSIVE: 'progressive',
    },
  };
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    modules.set(file, exports);
    const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    });
    vm.runInNewContext(outputText, {
      exports,
      setTimeout(callback) {
        const handle = setTimeout(callback, 50);
        timers.add(handle);
        return handle;
      },
      clearTimeout,
      require(name) {
        if (name === 'react-native') return { Platform: { OS: platform } };
        if (name === 'react-native-uuid')
          return { v4: () => `listener-${nextId++}` };
        if (name === 'bitmovin-player-react-native') return native;
        if (name === './helper/Sources')
          return { Sources: { artOfMotionHls: {} } };
        if (name === './helper/Ads') return { AdTags: {} };
        if (name === 'fast-deep-equal') return require(name);
        if (!name.startsWith('.'))
          throw new Error(`Unexpected import: ${name}`);
        const base = path.resolve(path.dirname(file), name);
        const target = fs.existsSync(`${base}.ts`)
          ? `${base}.ts`
          : path.join(base, 'index.ts');
        return load(target);
      },
    });
    return exports;
  }

  const root = path.join(__dirname, '..');
  const helpers = load(path.join(root, 'playertesting/PlayerTesting.ts'));
  const World = load(
    path.join(root, 'playertesting/PlayerTestWorld.ts')
  ).default;
  const world = new World();
  World.shared = world;
  const { EventType } = load(path.join(root, 'playertesting/EventType.ts'));
  let config;
  let ready = false;
  let seeks = 0;
  const emit = (name) => world.onEvent({ name });
  const lifecycle = [
    EventType.AdBreakStarted,
    EventType.AdStarted,
    EventType.AdQuartile,
    EventType.AdQuartile,
    EventType.AdQuartile,
    EventType.AdFinished,
    EventType.AdBreakFinished,
  ];
  const emitLifecycle = () => lifecycle.forEach(emit);
  const player = {
    load() {
      // Manifest loading can finish before source readiness or play().
      if (timing === 'load') emit(EventType.AdManifestLoaded);
      setImmediate(() => {
        ready = true;
        emit(EventType.Ready);
      });
    },
    play() {
      if (timing === 'ready')
        assert.ok(ready, 'play must wait for source Ready');
      if (timing === 'load') {
        emitLifecycle();
      } else {
        // Let the original preroll observations succeed to isolate seek races.
        setImmediate(() => {
          emit(EventType.AdManifestLoaded);
          setImmediate(emitLifecycle);
        });
      }
    },
    seek(position) {
      seeks++;
      assert.equal(position, seeks === 1 ? 13 : 55);
      if (timing === 'before-seeked') {
        emit(EventType.AdManifestLoaded);
        emitLifecycle();
        emit(EventType.Seeked);
      } else {
        emit(EventType.Seeked);
        // The break may start while the manifest expectation is still pending.
        emitLifecycle();
        emit(EventType.AdManifestLoaded);
      }
    },
    async getDuration() {
      return 60;
    },
  };
  // Native player/view setup is outside this regression; event subscription,
  // expectation fulfillment, and listener removal use PlayerTestWorld itself.
  world.ensurePlayer = async () => player;
  helpers.startPlayerTest = async (playerConfig, fn) => {
    config = playerConfig;
    await fn();
  };
  for (const name of [
    'expectEvent',
    'expectEvents',
    'callPlayerAndExpectEvent',
    'callPlayerAndExpectEvents',
  ]) {
    const original = helpers[name];
    helpers[name] = (...args) => {
      const isCall = name.startsWith('callPlayer');
      const expectation = args[isCall ? 1 : 0];
      observations.push({ expectation, timeout: args[isCall ? 2 : 1] ?? 10 });
      return original(...args);
    };
  }

  const cases = new Map();
  const descriptions = [];
  load(path.join(root, 'tests/advertisingTest.ts')).default({
    describe(name, register) {
      descriptions.push(name);
      register();
      descriptions.pop();
    },
    it(name, run) {
      if (name === 'emits Ad events') cases.set(descriptions.join(' '), run);
    },
  });
  return {
    async run(scenario) {
      try {
        await cases.get(`playing ${scenario} ads`)();
        assert.equal(seeks, 2, 'both midroll and postroll must run');
        const sequences = observations.filter(
          ({ expectation }) => expectation.singleExpectations
        );
        assert.deepEqual(
          sequences.map(({ timeout }) => timeout),
          [18, 15, 18]
        );
        for (const { expectation } of sequences) {
          assert.deepEqual(
            Array.from(
              expectation.singleExpectations,
              (event) => event.eventType
            ),
            lifecycle
          );
        }
        const manifests = observations.filter(
          ({ expectation }) => expectation === EventType.AdManifestLoaded
        );
        const expectedManifests =
          scenario === 'IMA VMAP'
            ? 1
            : scenario === 'IMA VAST'
              ? platform === 'android'
                ? 3
                : 1
              : 0;
        assert.deepEqual(
          manifests.map(({ timeout }) => timeout),
          Array(expectedManifests).fill(20)
        );
        assert.deepEqual(
          observations
            .filter(({ expectation }) => expectation === EventType.Seeked)
            .map(({ timeout }) => timeout),
          [10, 10]
        );
        assert.ok(config.advertisingConfig.schedule.length > 0);
        assert.equal(
          Object.keys(world.eventListeners).length,
          0,
          'all concurrent listeners must be removed'
        );
      } finally {
        timers.forEach(clearTimeout);
        World.shared = undefined;
      }
    },
  };
}

for (const platform of ['ios', 'android']) {
  const scenarios = ['IMA VMAP', 'IMA VAST', 'Progressive', 'BITMOVIN VAST'];
  if (platform === 'android') scenarios.push('BITMOVIN VMAP');
  for (const scenario of scenarios) {
    for (const timing of ['ready', 'load', 'before-seeked', 'after-seeked']) {
      test(`${platform} ${scenario}: observes ads with ${timing} event timing`, async () => {
        await advertisingHarness(platform, timing).run(scenario);
      });
    }
  }
}
