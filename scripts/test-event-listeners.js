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

test('initializes a source natively once for overlapping initialize calls', async (t) => {
  const { nativeModules } = require(
    path.join(root, 'node_modules/expo-modules-core')
  );
  t.after(() => delete nativeModules.SourceModule);
  const calls = [];
  nativeModules.SourceModule = {
    addListener: () => ({ remove: () => {} }),
    initializeWithConfig: async (nativeId) => {
      calls.push(['initializeWithConfig', nativeId]);
      // Let the other initialize call run while this one is in progress.
      await new Promise(setImmediate);
    },
    on: async (nativeId, eventName) => calls.push(['on', nativeId, eventName]),
    off: async () => {},
  };
  const { Source } = require(path.join(root, 'source'));
  const source = new Source({ url: 'https://example.com/a.m3u8', type: 'hls' });
  source.on('sourceLoaded', () => {});

  // E.g. `source.initialize()` followed by `player.loadSource(source)`.
  await Promise.all([source.initialize(), source.initialize()]);
  await source.initialize();

  assert.deepEqual(calls, [
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
