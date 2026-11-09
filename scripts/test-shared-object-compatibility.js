const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');
const { EventEmitter } = require('node:events');

const root = fs.mkdtempSync(
  path.join(os.tmpdir(), 'shared-object-compatibility-')
);
const compiled = path.join(root, 'compiled');
after(() => fs.rmSync(root, { recursive: true, force: true }));

before(() => {
  const program = ts.createProgram(
    ['player.ts', 'source.ts'].map((name) =>
      path.resolve(__dirname, '../src', name)
    ),
    {
      rootDir: path.resolve(__dirname, '../src'),
      outDir: compiled,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      noCheck: true,
      types: [],
    }
  );
  assert.equal(program.emit().emitSkipped, false);
});

// Exercise public TS orchestration. These doubles do not establish native SDK
// cleanup, Expo conversion, garbage collection, or playback behavior.
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(root, 'case-'));
  fs.cpSync(compiled, directory, { recursive: true });
  t.after(() => {
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(`${directory}${path.sep}`))
        delete require.cache[filename];
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  for (const name of ['expo-modules-core', 'expo-crypto', 'react-native']) {
    const location = path.join(directory, 'node_modules', name);
    fs.mkdirSync(location, { recursive: true });
    fs.writeFileSync(path.join(location, 'index.js'), 'module.exports = {};');
  }
  let sequence = 0;
  require(path.join(directory, 'node_modules/expo-crypto')).randomUUID = () =>
    `generated-${++sequence}`;
  require(path.join(directory, 'node_modules/react-native')).Platform = {
    OS: 'ios',
  };

  const calls = [];
  const creations = [];
  const callbacks = new WeakMap();
  const create = (kind, config, callback) => {
    const emitter = new EventEmitter();
    let playlist = [];
    const native = {
      addListener(event, listener) {
        emitter.on(event, listener);
        return { remove: () => emitter.off(event, listener) };
      },
      emit: (event, payload) => emitter.emit(event, payload),
      sdkSource: Symbol(kind),
      isSameSource: (other) => other.sdkSource === native.sdkSource,
      destroy: async () => {
        callbacks.delete(native);
      },
      loadSource: async (source) => {
        playlist = [source];
      },
      loadPlaylist: async (sources, options) => {
        playlist = sources;
        calls.push({ sources, options });
      },
      getPlaylistSources: async () =>
        playlist.map((source) => ({
          sdkSource: source.sdkSource,
          isSameSource: (other) => other.sdkSource === source.sdkSource,
          getMetadata: source.getMetadata,
        })),
      getSource: async () => (await native.getPlaylistSources())[0] ?? null,
      playlistAdd: async (source, index = playlist.length) => {
        playlist.splice(index, 0, source);
      },
      playlistRemove: async (source) => {
        playlist = playlist.filter((item) => !item.isSameSource(source));
      },
      playlistRemoveAt: async (index) => {
        playlist.splice(index, 1);
      },
      playlistSeek: async (source, time) => {
        calls.push({ source, time });
      },
      playlistSeekTo: async (source, target) => {
        calls.push({ source, target });
      },
      unload: async () => {
        playlist = [];
      },
      getVolume: async () => 37,
      getMetadata: async () => ({ title: 'shared source' }),
      drmFairplayRenewExpiringLicense: async (skdUri) => {
        calls.push({ native, skdUri });
      },
    };
    if (callback) callbacks.set(native, { config, callback });
    creations.push({ kind, native });
    return native;
  };
  const modules = {
    PlayerModule: {
      create: async (...args) => create('player', args[0], args[2]),
      isGoogleImaEnabled: true,
    },
    SourceModule: {
      create: async (...args) => create('source', args[0], args[3]),
    },
    NativeCallbacksModule: {},
    OfflineModule: {},
    DebugModule: {},
  };
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).requireNativeModule = (name) => {
    assert.ok(modules[name], `Unexpected native module: ${name}`);
    return modules[name];
  };
  const { Player } = require(path.join(directory, 'player.js'));
  const { Source } = require(path.join(directory, 'source.js'));
  const { lookup } = require(path.join(directory, 'nativeInstanceRegistry.js'));
  return {
    Player,
    Source,
    modules,
    calls,
    creations,
    nativeOf: (instance) =>
      lookup(
        instance instanceof Source ? 'source' : 'player',
        instance.nativeId
      ),
    invoke: (native, field, args, mutating = false) => {
      const entry = callbacks.get(native);
      const token = field
        .split('.')
        .reduce((value, key) => value?.[key], entry?.config);
      return (
        entry?.callback(token, structuredClone(args), undefined, mutating) ??
        null
      );
    },
  };
}

for (const kind of ['player', 'source']) {
  test(`same-ID wrappers control the same ${kind}`, async (t) => {
    const { Player, Source, creations } = fixture(t);
    const make = () =>
      kind === 'player'
        ? new Player({ nativeId: 'shared' })
        : new Source({
            nativeId: 'shared',
            url: 'https://test/source',
            type: 'hls',
          });
    const first = make();
    const alias = make();
    await Promise.all(
      kind === 'player'
        ? [first.getVolume(), alias.getVolume()]
        : [first.metadata(), alias.metadata()]
    );
    assert.equal(creations.filter((item) => item.kind === kind).length, 1);
    assert.deepEqual(
      kind === 'player' ? await alias.getVolume() : await alias.metadata(),
      kind === 'player' ? 37 : { title: 'shared source' }
    );
    if (kind === 'player') first.destroy();
  });
}

test('a failed shared player creation can be retried', async (t) => {
  const { Player, modules } = fixture(t);
  const create = modules.PlayerModule.create;
  const failure = new Error('Native creation failed');
  modules.PlayerModule.create = async () => {
    throw failure;
  };
  const first = new Player({ nativeId: 'retry' });
  const alias = new Player({ nativeId: first.nativeId });
  await Promise.all([
    assert.rejects(first.initialize(), (error) => error === failure),
    assert.rejects(alias.initialize(), (error) => error === failure),
  ]);
  modules.PlayerModule.create = create;
  await alias.initialize();
  assert.equal(await alias.getVolume(), 37);
  alias.destroy();
});

test('a canceled creation cannot replace a player reusing its ID', async (t) => {
  const { Player, modules, nativeOf } = fixture(t);
  const create = modules.PlayerModule.create;
  let finish;
  modules.PlayerModule.create = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const old = new Player({ nativeId: 'reuse' });
  const initialization = old.initialize();
  await new Promise(setImmediate);
  old.destroy();
  modules.PlayerModule.create = create;
  const replacement = new Player({ nativeId: old.nativeId });
  await replacement.initialize();
  const retired = await create();
  finish(retired);
  await initialization;
  assert.notEqual(nativeOf(replacement), retired);
  assert.equal(await replacement.getVolume(), 37);
  replacement.destroy();
});

test('advertising decisions and IMA settings use their own player configuration', async (t) => {
  const { Player, nativeOf, invoke } = fixture(t);
  const make = (decision) =>
    new Player({
      advertisingConfig: {
        shouldLoadAdItem: () => decision,
        ima: {
          beforeInitialization: (settings) => {
            settings.language = 'de';
            return { playerType: 'custom' };
          },
        },
      },
    });
  const first = make(false);
  const second = make(true);
  await Promise.all([first.initialize(), second.initialize()]);
  assert.equal(
    invoke(nativeOf(first), 'advertisingConfig.shouldLoadAdItem', [{}]),
    false
  );
  assert.equal(
    invoke(nativeOf(second), 'advertisingConfig.shouldLoadAdItem', [{}]),
    true
  );
  assert.deepEqual(
    invoke(
      nativeOf(first),
      'advertisingConfig.ima.beforeInitialization',
      [{ language: 'en' }],
      true
    ),
    { language: 'de', playerType: 'custom' }
  );
  first.destroy();
  second.destroy();
});

test('failed Source creation permits retry with DRM callbacks', async (t) => {
  const { Source, modules, nativeOf, invoke } = fixture(t);
  const source = new Source({
    url: 'https://test/source',
    type: 'hls',
    drmConfig: { fairplay: { prepareMessage: (message) => message } },
  });
  const create = modules.SourceModule.create;
  const failure = new Error('SDK Source creation failed');
  modules.SourceModule.create = async () => {
    throw failure;
  };
  await assert.rejects(source.metadata(), (error) => error === failure);
  modules.SourceModule.create = create;
  await source.metadata();
  assert.equal(
    invoke(nativeOf(source), 'drmConfig.fairplay.prepareMessage', ['message']),
    'message'
  );
});

test('a Source retains its DRM callbacks after player destruction and reuse', async (t) => {
  const { Player, Source, nativeOf, calls, invoke } = fixture(t);
  const source = new Source({
    url: 'https://test/source',
    type: 'hls',
    drmConfig: { fairplay: { prepareMessage: (message) => message } },
  });
  const first = new Player();
  await first.initialize();
  first.loadSource(source);
  await new Promise(setImmediate);
  const native = nativeOf(source);
  first.destroy();
  await source.drm.fairplay.renewExpiringLicense({ skdUri: 'skd://content' });
  assert.equal(
    invoke(native, 'drmConfig.fairplay.prepareMessage', ['message']),
    'message'
  );
  const second = new Player();
  await second.initialize();
  second.loadSource(source);
  await new Promise(setImmediate);
  assert.equal(nativeOf(source), native);
  await source.drm.fairplay.renewExpiringLicense({ skdUri: 'skd://content' });
  assert.deepEqual(calls, [
    { native, skdUri: 'skd://content' },
    { native, skdUri: 'skd://content' },
  ]);
  second.destroy();
});

test('awaited object subscriptions use their native owner and can be removed', async (t) => {
  const { Player, Source, nativeOf } = fixture(t);
  const player = new Player();
  const other = new Player();
  const source = new Source({
    url: 'https://example.com/video.m3u8',
    type: 'hls',
  });
  let playerCalls = 0;
  let sourceCalls = 0;
  let removedCalls = 0;
  const playerSubscription = await player.on('ready', () => playerCalls++);
  const sourceSubscription = await source.on(
    'sourceLoaded',
    () => sourceCalls++
  );
  const removed = await player.on('ready', () => removedCalls++);
  removed.remove();
  await other.initialize();
  nativeOf(other).emit('ready', { name: 'onReady' });
  nativeOf(player).emit('ready', { name: 'onReady' });
  assert.equal(playerCalls, 1);
  assert.equal(sourceCalls, 0);
  assert.equal(removedCalls, 0);
  playerSubscription.remove();
  nativeOf(player).emit('ready', { name: 'onReady' });
  assert.equal(playerCalls, 1);
  nativeOf(source).emit('sourceLoaded', { name: 'onSourceLoaded' });
  assert.equal(sourceCalls, 1);
  sourceSubscription.remove();
  let destroyed = 0;
  const destroyedSubscription = await player.on('destroy', () => destroyed++);
  nativeOf(player).emit('destroy', { name: 'onDestroy' });
  assert.equal(destroyed, 1);
  destroyedSubscription.remove();
});

test('concurrent destruction warns when it prevents event registration', async (t) => {
  const { Player, nativeOf } = fixture(t);
  const player = new Player();
  await player.initialize();
  const native = nativeOf(player);
  let calls = 0;
  const warnings = [];
  t.mock.method(console, 'warn', (message) => warnings.push(message));
  const pending = player.on('destroy', () => calls++);
  assert.equal(typeof pending.then, 'function');
  player.destroy();
  const subscription = await pending;
  native.emit('destroy', { name: 'onDestroy' });
  assert.equal(calls, 0);
  assert.equal(warnings.length, 1);
  assert.match(
    warnings[0],
    /Cannot subscribe to 'destroy'.*destroyed during registration/
  );
  subscription.remove();
});

test('playlist queries wrap SDK sources without creating replacement sources', async (t) => {
  const { Player, Source, calls, creations, nativeOf } = fixture(t);
  const player = new Player();
  const first = new Source({ url: 'https://test/first' });
  const second = new Source({ url: 'https://test/second' });
  const options = { preloadAllSources: true, replayMode: 'lastSource' };
  await player.loadPlaylist({ sources: [first, second], options });
  assert.deepEqual(calls[0], {
    sources: [nativeOf(first), nativeOf(second)],
    options,
  });
  assert.deepEqual(await player.playlist.getSources(), [first, second]);
  assert.equal(await player.getSource(), first);
  await player.playlist.seek(second, 12);
  assert.deepEqual(calls[1], { source: nativeOf(second), time: 12 });
  await player.playlist.remove(second);
  assert.deepEqual(await player.playlist.getSources(), [first]);
  await player.playlist.add(second, 0);
  assert.deepEqual(await player.playlist.getSources(), [second, first]);
  await player.playlist.removeAt(1);
  assert.deepEqual(await player.playlist.getSources(), [second]);
  assert.equal(creations.filter(({ kind }) => kind === 'source').length, 2);
  player.destroy();
});

test('playlist query uses native state and does not overwrite ownership after a rejected load', async (t) => {
  const { Player, Source, nativeOf } = fixture(t);
  const player = new Player();
  const source = new Source({ url: 'https://test/first' });
  await player.loadPlaylist({ sources: [source] });
  nativeOf(player).loadPlaylist = async () => {
    throw new Error('SDK rejected load');
  };
  await assert.rejects(
    player.loadPlaylist({ sources: [] }),
    /SDK rejected load/
  );
  assert.equal(await player.getSource(), source);
  // The native double changes its playlist independently of the wrapper.
  await nativeOf(player).playlistRemoveAt(0);
  assert.deepEqual(await player.playlist.getSources(), []);
  assert.equal(await player.getSource(), undefined);
  player.destroy();
});

test('playlist seekTo reports unsupported iOS use without submitting a native seek', async (t) => {
  const { Player, Source, calls } = fixture(t);
  const player = new Player();
  const source = new Source({ url: 'https://test/first' });
  await assert.rejects(
    player.playlist.seekTo(source, { offset: 10 }),
    /only supported on Android/
  );
  assert.deepEqual(calls, []);
  player.destroy();
});

test('source event subscriptions attach before loading and can be canceled before creation', async (t) => {
  const { Player, Source, nativeOf } = fixture(t);
  const source = new Source({ url: 'https://test/source' });
  const received = [];
  const canceled = source.on('sourceLoaded', () =>
    assert.fail('Canceled subscription called')
  );
  canceled.remove();
  const active = source.on('sourceLoaded', (event) => received.push(event));
  const player = new Player();
  await player.loadPlaylist({ sources: [source] });
  const event = { name: 'onSourceLoaded', timestamp: 1 };
  nativeOf(source).emit('sourceLoad', { name: 'onSourceLoad', timestamp: 0 });
  nativeOf(source).emit('sourceLoaded', event);
  assert.deepEqual(received, [event]);
  active.remove();
  nativeOf(source).emit('sourceLoaded', event);
  assert.deepEqual(received, [event]);
  player.destroy();
});

test('native-owned sources are adopted without creating another SDK source', async (t) => {
  const { Player, modules, nativeOf, creations } = fixture(t);
  const player = new Player();
  await player.initialize();
  const native = await modules.SourceModule.create({
    url: 'https://test/native-source',
  });
  nativeOf(player).getSource = async () => native;
  const count = creations.length;
  const source = await player.getSource();
  assert.equal(source.isInitialized, true);
  assert.equal(source.config, undefined);
  assert.deepEqual(await source.metadata(), { title: 'shared source' });
  const received = [];
  const subscription = source.on('sourceLoaded', (event) =>
    received.push(event)
  );
  const event = { name: 'onSourceLoaded', timestamp: 1 };
  native.emit('sourceLoaded', event);
  assert.deepEqual(received, [event]);
  subscription.remove();
  assert.equal(creations.length, count);
  player.destroy();
});
