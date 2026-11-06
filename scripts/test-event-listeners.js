const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'event-listeners-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
// Emit the import graphs once, without Expo's app build or typecheck. The Expo
// and React Native packages are replaced by the doubles below.
before(() => {
  const program = ts.createProgram(
    [
      path.resolve(__dirname, '../src/utils/eventListeners.ts'),
      path.resolve(__dirname, '../src/source.ts'),
    ],
    {
      rootDir: path.resolve(__dirname, '../src'),
      outDir: root,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      noCheck: true,
      types: [],
    }
  );
  const emission = program.emit();
  assert.equal(emission.emitSkipped, false);
  for (const diagnostic of ts
    .getPreEmitDiagnostics(program)
    .concat(emission.diagnostics)) {
    assert.fail(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  }
  const doubles = {
    'react-native': "module.exports = { Platform: { OS: 'android' } };",
    'expo-crypto': "module.exports = { randomUUID: () => 'random-id' };",
    // Each test sets the native module it needs on `nativeModules`.
    'expo-modules-core': `
      module.exports = {
        nativeModules: {},
        requireNativeModule(name) {
          return new Proxy({}, { get: (_, key) => module.exports.nativeModules[name]?.[key] });
        },
      };`,
  };
  for (const [name, source] of Object.entries(doubles)) {
    const directory = path.join(root, 'node_modules', name);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'index.js'), source);
  }
});

// The native module double only records the submitted calls. It does not prove
// that native attaches or detaches a listener.
function fixture() {
  const { EventListeners } = require(path.join(root, 'utils/eventListeners'));
  const calls = [];
  const nativeModule = {
    on: async (nativeId, eventName) => calls.push(['on', nativeId, eventName]),
    off: async (nativeId, eventName) =>
      calls.push(['off', nativeId, eventName]),
  };
  let moduleListener;
  const listeners = new EventListeners(
    'player-id',
    nativeModule,
    (listener) => {
      moduleListener = listener;
      return { remove: () => (moduleListener = undefined) };
    }
  );
  const emit = (payload) => moduleListener?.(payload);
  return { listeners, calls, emit };
}

test('attaches the native listeners registered before attachNative once', () => {
  const { listeners, calls } = fixture();
  listeners.on('ready', () => {});
  listeners.on('ready', () => {});
  listeners.on('playing', () => {});
  assert.deepEqual(calls, []);

  listeners.attachNative();
  // Overlapping initializations of the same instance call attachNative again.
  listeners.attachNative();

  assert.deepEqual(calls, [
    ['on', 'player-id', 'ready'],
    ['on', 'player-id', 'playing'],
  ]);
});

test('keeps the native listeners in sync after attachNative was called twice', () => {
  const { listeners, calls } = fixture();
  const listener = () => {};
  listeners.on('ready', listener);
  listeners.attachNative();
  listeners.attachNative();

  listeners.off('ready', listener);
  listeners.on('ready', listener);

  assert.deepEqual(calls, [
    ['on', 'player-id', 'ready'],
    ['off', 'player-id', 'ready'],
    ['on', 'player-id', 'ready'],
  ]);
});

test('attaches the native listeners again after removeAll', () => {
  const { listeners, calls } = fixture();
  listeners.attachNative();
  listeners.removeAll();
  listeners.on('ready', () => {});
  assert.deepEqual(calls, []);

  listeners.attachNative();

  assert.deepEqual(calls, [['on', 'player-id', 'ready']]);
});

test('dispatches events by the event name they were attached for', () => {
  const { listeners, emit } = fixture();
  const received = [];
  listeners.on('sourceAdded', (event) => received.push(['sourceAdded', event]));
  listeners.on('ready', (event) => received.push(['ready', event]));
  // The native name does not need to match the event name, e.g. iOS's
  // `onSourceAddedEvent`.
  const event = { name: 'onSourceAddedEvent', timestamp: 1 };

  emit({ nativeId: 'other-player', eventName: 'sourceAdded', event });
  emit({ nativeId: 'player-id', eventName: 'sourceAdded', event });

  assert.deepEqual(received, [['sourceAdded', event]]);
});

// The module listeners the doubles received, shared across the tests, as the source
// registry subscribes to source releases only once.
const moduleListeners = new Map();
let nextInstanceId = 0;

// Models native creating the source on the first initialization and after
// `release` only, and reporting the instance id of a created source, as the
// Android bridge does. DRM configs are recorded in `calls`.
function sourceFixture(
  t,
  config = { url: 'https://example.com/a.m3u8', type: 'hls' }
) {
  const { nativeModules } = require(
    path.join(root, 'node_modules/expo-modules-core')
  );
  const calls = [];
  let instanceId;
  nativeModules.SourceModule = {
    addListener: (name, listener) => {
      moduleListeners.set(name, listener);
      return { remove: () => {} };
    },
    initializeWithConfig: async (nativeId) => {
      calls.push(['initializeWithConfig', nativeId]);
      // Let the other initialize call run while this one is in progress.
      await new Promise(setImmediate);
      if (instanceId !== undefined) {
        return null;
      }
      instanceId = nextInstanceId++;
      return instanceId;
    },
    on: async (nativeId, eventName) => calls.push(['on', nativeId, eventName]),
    off: async () => {},
    destroy: async () => {},
  };
  nativeModules.DrmModule = {
    addListener: () => ({ remove: () => {} }),
    initializeWithConfig: async () => calls.push(['drm.initialize']),
    destroy: async () => calls.push(['drm.destroy']),
  };
  const { Source } = require(path.join(root, 'source'));
  const { SourceRegistry } = require(path.join(root, 'utils/sourceRegistry'));
  const source = new Source(config);
  // All sources get the same `nativeId`, so destroy it to not share it with the next test.
  t.after(() => {
    source.destroy();
    delete nativeModules.SourceModule;
    delete nativeModules.DrmModule;
  });
  // Releases the native source, as a player removing it does.
  const release = () => {
    const released = instanceId;
    instanceId = undefined;
    return released;
  };
  // Emits `onSourceReleased` for the released native source.
  const emitRelease = (released) =>
    moduleListeners.get('onSourceReleased')?.({
      nativeId: source.nativeId,
      instanceId: released,
    });
  return { source, calls, release, emitRelease, SourceRegistry };
}

test('initializes a source natively once for overlapping initialize calls', async (t) => {
  const { source, calls } = sourceFixture(t);
  source.on('sourceLoaded', () => {});

  // E.g. `source.initialize()` followed by `player.loadSource(source)`.
  await Promise.all([source.initialize(), source.initialize()]);

  assert.deepEqual(calls, [
    ['initializeWithConfig', 'random-id'],
    ['on', 'random-id', 'sourceLoaded'],
  ]);
});

test('attaches the native listeners of a source again only once it was created again', async (t) => {
  const { source, calls, release } = sourceFixture(t);
  source.on('sourceLoaded', () => {});
  await source.initialize();

  // Loading an existing source initializes it again without creating it.
  await source.initialize();
  release();
  await source.initialize();

  assert.deepEqual(calls, [
    ['initializeWithConfig', 'random-id'],
    ['on', 'random-id', 'sourceLoaded'],
    ['initializeWithConfig', 'random-id'],
    ['initializeWithConfig', 'random-id'],
    ['on', 'random-id', 'sourceLoaded'],
  ]);
});

// Several JS instances (e.g. `Player`s created with the same `nativeId`) can
// share one native instance and its native module.
function sharedFixture() {
  const { EventListeners } = require(path.join(root, 'utils/eventListeners'));
  const calls = [];
  const nativeModule = {
    on: async (nativeId, eventName) => calls.push(['on', nativeId, eventName]),
    off: async (nativeId, eventName) =>
      calls.push(['off', nativeId, eventName]),
  };
  const moduleListeners = new Set();
  const create = (nativeId, module = nativeModule) =>
    new EventListeners(nativeId, module, (listener) => {
      moduleListeners.add(listener);
      return { remove: () => moduleListeners.delete(listener) };
    });
  const emit = (payload) =>
    [...moduleListeners].forEach((listener) => listener(payload));
  return { EventListeners, nativeModule, calls, create, emit };
}

test('removes the listeners of all instances sharing the native instance', () => {
  const { calls, create, emit } = sharedFixture();
  const destroyed = create('player-id');
  const sharing = create('player-id');
  const other = create('other-player');
  const received = [];
  destroyed.on('ready', () => received.push('destroyed'));
  sharing.on('ready', () => received.push('sharing'));
  other.on('ready', () => received.push('other'));
  [destroyed, sharing, other].forEach((listeners) => listeners.attachNative());
  calls.length = 0;

  destroyed.removeAll();
  const event = { name: 'onReady', timestamp: 1 };
  emit({ nativeId: 'player-id', eventName: 'ready', event });
  emit({ nativeId: 'other-player', eventName: 'ready', event });

  assert.deepEqual(received, ['other']);
  // The native listeners are released with the native instance.
  assert.deepEqual(calls, []);
});

test('does not remove the listeners of another native module', () => {
  const { nativeModule, create, emit } = sharedFixture();
  const otherModule = { ...nativeModule };
  const player = create('same-id');
  const source = create('same-id', otherModule);
  const received = [];
  player.on('ready', () => received.push('player'));
  source.on('ready', () => received.push('source'));

  player.removeAll();
  emit({
    nativeId: 'same-id',
    eventName: 'ready',
    event: { name: 'onReady', timestamp: 1 },
  });

  assert.deepEqual(received, ['source']);
});

test('only keeps instances while they have listeners', () => {
  const { EventListeners, nativeModule, create } = sharedFixture();
  const listener = () => {};
  const first = create('player-id');
  const second = create('player-id');
  first.on('ready', listener);
  second.on('ready', listener);
  first.off('ready', listener);
  second.removeAll();

  // Implementation detail, checked so that unused instances are not retained.
  assert.equal(EventListeners.withListeners.get(nativeModule)?.size ?? 0, 0);
});

test('attaches the native listeners of all instances sharing a re-created native instance again', () => {
  const { calls, create } = sharedFixture();
  const initializing = create('source-id');
  const sharing = create('source-id');
  initializing.on('sourceLoaded', () => {});
  sharing.on('sourceUnloaded', () => {});
  initializing.attachNative();
  sharing.attachNative();
  calls.length = 0;

  // The native source was released and created again without native listeners.
  initializing.reattachNative();

  assert.deepEqual(calls, [
    ['on', 'source-id', 'sourceLoaded'],
    ['on', 'source-id', 'sourceUnloaded'],
  ]);
});

test('unregisters a source once native released it', async (t) => {
  const { source, release, emitRelease, SourceRegistry } = sourceFixture(t);
  await source.initialize();
  assert.equal(SourceRegistry.get(source.nativeId), source);

  emitRelease(release());

  assert.equal(SourceRegistry.get(source.nativeId), undefined);
  assert.equal(source.isInitialized, false);
});

test('ignores the release of a native source that was created again since', async (t) => {
  const { source, release, emitRelease, SourceRegistry } = sourceFixture(t);
  await source.initialize();
  const released = release();
  await source.initialize();

  // The release arrives after the initialization that created the source again.
  emitRelease(released);

  assert.equal(SourceRegistry.get(source.nativeId), source);
  assert.equal(source.isInitialized, true);
});

test('handles a release that arrives during an initialization once it finished', async (t) => {
  const { source, calls, release, emitRelease, SourceRegistry } = sourceFixture(
    t,
    {
      url: 'https://example.com/a.mpd',
      type: 'dash',
      drmConfig: { widevine: { licenseUrl: 'https://example.com/license' } },
    }
  );
  await source.initialize();
  const released = release();

  // The initialization creates the source again with the existing DRM config, so
  // the late release must not release that DRM config.
  const initialization = source.initialize();
  emitRelease(released);
  await initialization;
  await new Promise(setImmediate);

  assert.equal(SourceRegistry.get(source.nativeId), source);
  assert.equal(source.isInitialized, true);
  assert.deepEqual(
    calls.filter(([call]) => call.startsWith('drm.')),
    [['drm.initialize']]
  );
});

test('releases the DRM of a released source and creates it again', async (t) => {
  const { source, calls, release, emitRelease } = sourceFixture(t, {
    url: 'https://example.com/a.mpd',
    type: 'dash',
    drmConfig: { widevine: { licenseUrl: 'https://example.com/license' } },
  });
  await source.initialize();
  const drm = source.drm;

  emitRelease(release());
  await source.initialize();

  assert.deepEqual(
    calls.filter(([call]) => call.startsWith('drm.')),
    [['drm.initialize'], ['drm.destroy'], ['drm.initialize']]
  );
  assert.notEqual(source.drm, drm);
});

test('initializes the DRM again after its initialization failed', async (t) => {
  const { nativeModules } = require(
    path.join(root, 'node_modules/expo-modules-core')
  );
  const { source, calls } = sourceFixture(t, {
    url: 'https://example.com/a.mpd',
    type: 'dash',
    drmConfig: { widevine: { licenseUrl: 'https://example.com/license' } },
  });
  const initialize = nativeModules.DrmModule.initializeWithConfig;
  nativeModules.DrmModule.initializeWithConfig = async () => {
    calls.push(['drm.initialize']);
    throw new Error('DRM initialization failed');
  };

  await assert.rejects(source.initialize(), /DRM initialization failed/);
  nativeModules.DrmModule.initializeWithConfig = initialize;
  await source.initialize();

  assert.deepEqual(
    calls.filter(([call]) => call.startsWith('drm.')),
    [['drm.initialize'], ['drm.destroy'], ['drm.initialize']]
  );
  assert.ok(source.drm, 'DRM of the source');
});
