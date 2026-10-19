/* eslint-env node */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInThisContext } = require('node:vm');
const ts = require('typescript');

// Exercise the real JS bridge code without React Native or a device.
function loadTypeScript(path, imports, timers = globalThis) {
  const source = readFileSync(join(__dirname, '..', path), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };
  const requireImport = (name) => {
    assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
    return imports[name];
  };
  const run = runInThisContext(
    `(function(require, module, exports, setTimeout, clearTimeout) {\n${outputText}\n})`,
    { filename: path }
  );
  run(
    requireImport,
    module,
    module.exports,
    timers.setTimeout,
    timers.clearTimeout
  );
  return module.exports;
}

const listeners = new Map();
function addListener(type, listener) {
  const group = listeners.get(type) ?? new Set();
  listeners.set(type, group);
  group.add(listener);
  return { remove: () => group.delete(listener) };
}
function emit(type, event) {
  [...(listeners.get(type) ?? [])].forEach((listener) => listener(event));
}

let playerInitializations = 0;
let networkInitializations = 0;
let sourceInitializations = 0;
let failInitialization = false;
let loadedIds;
let finishNetworkInitialization;
const networkReady = new Promise((resolve) => {
  finishNetworkInitialization = resolve;
});
const nativePlayer = {
  addListener,
  initializeWithConfig: async () => {
    playerInitializations++;
    if (failInitialization) throw new Error('Initialization failed');
  },
  loadPlaylist: async (_, ids) => {
    loadedIds = ids;
  },
  getPlaylistSources: async () => loadedIds,
  loadSource: async () => {},
  destroy: async () => {},
};
const nativeSource = {
  initializeWithConfig: async () => {
    sourceInitializations++;
  },
  destroy: async () => {},
};
const nativeInstance = loadTypeScript('src/nativeInstance.ts', {
  'expo-crypto': { randomUUID },
});
const sourceModule = loadTypeScript('src/source.ts', {
  './nativeInstance': nativeInstance,
  './modules/SourceModule': { default: nativeSource },
  './drm': { Drm: class {} },
});
const platform = { Platform: { OS: 'android' } };
const playlistModule = loadTypeScript('src/playlist.ts', {
  'react-native': platform,
  './modules/PlayerModule': { default: nativePlayer },
  './utils/normalizeNonFinite': loadTypeScript(
    'src/utils/normalizeNonFinite.ts',
    {}
  ),
});
const networkModule = loadTypeScript('src/network/index.ts', {
  '../nativeInstance': nativeInstance,
  '../debug': { DebugConfig: { log: () => {} } },
  './networkConfig': {},
  './networkModule': {
    default: {
      addListener,
      initializeWithConfig: async () => {
        networkInitializations++;
        await networkReady;
      },
      destroy: async () => {},
    },
  },
});
class UnusedApi {}
const { Player } = loadTypeScript('src/player.ts', {
  'react-native': platform,
  './modules/PlayerModule': { default: nativePlayer },
  './nativeInstance': nativeInstance,
  './source': sourceModule,
  './analytics/player': { AnalyticsApi: UnusedApi },
  './bufferApi': { BufferApi: UnusedApi },
  './mediaControlsApi': { MediaControlsApi: UnusedApi },
  './network': networkModule,
  './decoder': {},
  './playlist': playlistModule,
});
const { Source } = sourceModule;

async function checkInitialization() {
  const observerCount = listeners.get('onPlaylistTransition')?.size ?? 0;
  const player = new Player({ nativeId: 'playlist-test', networkConfig: {} });
  assert.equal(listeners.get('onPlaylistTransition')?.size ?? 0, observerCount);
  const first = new Source({ url: 'https://example.invalid/first.mpd' });
  const second = new Source({ url: 'https://example.invalid/second.mpd' });
  const initializing = player.initialize();
  assert.equal(player.initialize(), initializing);
  const loading = player.loadPlaylist([first, first, second]);
  finishNetworkInitialization();
  await Promise.all([initializing, loading]);
  assert.equal(networkInitializations, 1);
  assert.equal(playerInitializations, 1);
  assert.equal(sourceInitializations, 2);
  assert.equal(listeners.get('onPlaylistTransition').size, observerCount + 1);
  assert.deepEqual(loadedIds, [
    first.nativeId,
    first.nativeId,
    second.nativeId,
  ]);
  assert.deepEqual(await player.playlist.getSources(), [first, first, second]);
  return { player, first, second };
}

function checkEvents(player, first, second, event) {
  const replacement = new Source({
    url: 'https://example.invalid/replacement.mpd',
  });
  let received = 0;
  const firstListener = player.playlist.addEventListener(
    'playlistTransition',
    () => {
      assert.equal(player.source, second);
      player.loadSource(replacement);
    }
  );
  const secondListener = player.playlist.addEventListener(
    'playlistTransition',
    (resolved) => {
      received++;
      assert.equal(player.source, replacement);
      assert.equal(resolved.from.duration, Infinity);
      assert.ok(Number.isNaN(resolved.to.duration));
      assert.equal(resolved.toSourceReference, second);
      assert.equal(typeof resolved.toSourceReference.duration, 'function');
    }
  );
  emit('onPlaylistTransition', { ...event, nativeId: 'another-player' });
  assert.equal(received, 0);
  emit('onPlaylistTransition', event);
  assert.equal(received, 1);
  assert.equal(event.from.duration, 'BMP_Infinity');
  firstListener.remove();
  secondListener.remove();
  emit('onPlaylistTransition', event);
  assert.equal(
    player.source,
    second,
    'Headless transitions need no public listener'
  );
  player.destroy();
  emit('onPlaylistTransition', { ...event, toSourceNativeId: first.nativeId });
  assert.equal(player.source, second, 'Destroy removes the internal listener');
}

async function checkInitializationRetry() {
  const player = new Player();
  failInitialization = true;
  const first = player.initialize();
  const second = player.initialize();
  assert.equal(first, second);
  await assert.rejects(Promise.all([first, second]), /Initialization failed/);
  assert.equal(player.isInitialized, false);
  failInitialization = false;
  await player.initialize();
  assert.equal(player.isInitialized, true);
  assert.equal(playerInitializations, 3);
  player.destroy();
}

const timers = new Map();
const { callPlaylistAndExpectEvent } = loadTypeScript(
  'integration_test/tests/playlistTest.ts',
  {
    'react-native': platform,
    'bitmovin-player-react-native': { Player, Source },
    '../playertesting': {},
    './helper/Expect': {},
    './helper/Sources': {},
  },
  {
    setTimeout: (callback) => {
      const id = randomUUID();
      timers.set(id, callback);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  }
);

async function checkWaiterCleanup() {
  const player = new Player();
  const countListeners = () => listeners.get('onSourceAdded')?.size ?? 0;
  const baseline = countListeners();
  await assert.rejects(
    callPlaylistAndExpectEvent(player, 'sourceAdded', async () => {
      throw new Error('Add failed');
    }),
    /Add failed/
  );
  assert.equal(timers.size, 0);
  assert.equal(countListeners(), baseline);
  const waiting = callPlaylistAndExpectEvent(
    player,
    'sourceAdded',
    async () => {}
  );
  [...timers.values()][0]();
  await assert.rejects(waiting, /Timed out waiting for sourceAdded/);
  assert.equal(timers.size, 0);
  assert.equal(countListeners(), baseline);
  const event = await callPlaylistAndExpectEvent(
    player,
    'sourceAdded',
    async () => {
      emit('onSourceAdded', { nativeId: player.nativeId, index: 2 });
    }
  );
  assert.equal(event.index, 2);
  assert.equal(timers.size, 0);
  assert.equal(countListeners(), baseline);
  player.destroy();
}

async function main() {
  const { player, first, second } = await checkInitialization();
  checkEvents(player, first, second, {
    nativeId: player.nativeId,
    name: 'onPlaylistTransition',
    timestamp: Date.now(),
    from: { duration: 'BMP_Infinity' },
    to: { duration: 'BMP_NaN' },
    fromSourceNativeId: first.nativeId,
    toSourceNativeId: second.nativeId,
  });
  await checkInitializationRetry();
  await checkWaiterCleanup();
  console.info('Playlist initialization, events, and waiter checks passed.');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
