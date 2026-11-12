const {
  installNativeClasses,
  controlFor,
} = require('./helpers/native-class-doubles');
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
    [
      'player.ts',
      'source.ts',
      'ui/fullscreenHandlerBridge.ts',
      'ui/customMessageHandler.ts',
    ].map((name) => path.resolve(__dirname, '../src', name)),
    {
      rootDir: path.resolve(__dirname, '../src'),
      outDir: compiled,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ESNext,
      noCheck: true,
      types: [],
    }
  );
  assert.equal(program.emit().emitSkipped, false);
});

// Exercise TS orchestration. These doubles do not establish native SDK
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
      destroy: async () => {
        callbacks.delete(native);
      },
      loadSource: async (source) => {
        playlist = [source];
        calls.push({ native, source });
      },
      loadPlaylist: async (sources, options) => {
        playlist = sources;
        calls.push({ sources, options });
      },
      getPlaylistSources: async (known = []) =>
        playlist.map(
          (source) =>
            known.find((peer) => peer.sdkSource === source.sdkSource) ?? {
              sdkSource: source.sdkSource,
              getMetadata: source.getMetadata,
            }
        ),
      getSource: async (known) =>
        (await native.getPlaylistSources(known))[0] ?? null,
      playlistAdd: async (source, index = playlist.length) => {
        playlist.splice(index, 0, source);
      },
      playlistRemove: async (source) => {
        playlist = playlist.filter(
          (item) => item.sdkSource !== source.sdkSource
        );
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
      setIsFullscreenActive: async () => {},
      getVolume: async () => 37,
      getMetadata: async () => ({ title: 'shared source' }),
      drmFairplayRenewExpiringLicense: async (skdUri) => {
        calls.push({ native, skdUri });
      },
    };
    if (callback) callbacks.set(native, { config, callback });
    creations.push({ kind, native, config });
    return native;
  };
  const modules = {
    PlayerModule: {
      create: async (...args) => create('player', args[0], args[2]),
      isGoogleImaEnabled: true,
    },
    SourceModule: {
      create: async (...args) => create('source', args[0], args[2]),
    },
    FullscreenHandlerModule: {
      create: (callback) => create('fullscreen', {}, callback),
    },
    CustomMessageHandlerModule: {
      create: (config, callback) => create('custom-message', config, callback),
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
  installNativeClasses(modules);
  const { Player } = require(path.join(directory, 'player.js'));
  const { Source } = require(path.join(directory, 'source.js'));
  return {
    Player,
    Source,
    FullscreenHandlerBridge: require(
      path.join(directory, 'ui/fullscreenHandlerBridge.js')
    ).FullscreenHandlerBridge,
    CustomMessageHandler: require(
      path.join(directory, 'ui/customMessageHandler.js')
    ).CustomMessageHandler,
    modules,
    calls,
    creations,
    dispatch: (native, operation, args = []) =>
      callbacks.get(native)?.callback(operation, args),
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

test('Player aliases share one lazily created SDK player', async (t) => {
  const { Player, creations } = fixture(t);
  const player = new Player({ nativeId: 'shared' });
  const alias = new Player({ nativeId: 'shared' });
  assert.equal(creations.length, 0);
  assert.equal(await alias.getVolume(), 37);
  assert.equal(creations.length, 1);
  assert.equal(Object.hasOwn(creations[0].config, 'nativeId'), false);
  assert.equal(player.config.nativeId, 'shared');
  assert.equal(player, alias);
  assert.equal(await controlFor(player), await controlFor(alias));
  assert.equal(await alias.getVolume(), 37);
  await player.destroy();
});

test('Player creation failures reach callers', async (t) => {
  const { Player, modules } = fixture(t);
  const failure = new Error('Native creation failed');
  modules.PlayerModule.create = async () => {
    throw failure;
  };
  const player = new Player();
  await assert.rejects(player.getVolume(), (error) => error === failure);
  await assert.rejects(player.getVolume(), (error) => error === failure);
});

test('advertising callbacks return decisions and update IMA settings', async (t) => {
  const { Player, invoke } = fixture(t);
  const player = new Player({
    advertisingConfig: {
      shouldLoadAdItem: () => false,
      ima: {
        beforeInitialization: (settings) => {
          settings.language = 'de';
          return { playerType: 'custom' };
        },
      },
    },
  });
  const native = await controlFor(player);
  assert.equal(
    invoke(native, 'advertisingConfig.shouldLoadAdItem', [{}]),
    false
  );
  assert.deepEqual(
    invoke(
      native,
      'advertisingConfig.ima.beforeInitialization',
      [{ language: 'en' }],
      true
    ),
    { language: 'de', playerType: 'custom' }
  );
  await player.destroy();
});

test('a Source can be loaded by another Player and still use its DRM API', async (t) => {
  const { Player, Source, calls, invoke, creations } = fixture(t);
  const source = new Source({
    url: 'https://test/source',
    type: 'hls',
    metadata: { nativeId: 'customer metadata' },
    drmConfig: { fairplay: { prepareMessage: (message) => message } },
  });
  const first = new Player();
  await first.loadSource(source);
  await first.destroy();
  const second = new Player();
  await second.loadSource(source);
  const nativeSource = await controlFor(source);
  assert.deepEqual(
    creations.find((entry) => entry.kind === 'source').config.metadata,
    source.config.metadata
  );
  assert.deepEqual(
    calls.map((call) => call.source.source),
    [source, source]
  );
  assert.equal(
    invoke(nativeSource, 'drmConfig.fairplay.prepareMessage', ['message']),
    'message'
  );
  await source.drm.fairplay.renewExpiringLicense({ skdUri: 'skd://content' });
  assert.deepEqual(calls[2], { native: nativeSource, skdUri: 'skd://content' });
  await second.destroy();
});

test('remote playback preparation uses the Player configuration callback', async (t) => {
  const { Player, invoke } = fixture(t);
  const local = { url: 'https://test/local.m3u8', type: 'hls' };
  const remote = { url: 'https://test/cast.mpd', type: 'dash' };
  const player = new Player({
    remoteControlConfig: {
      prepareSource: (type, sourceConfig) => {
        assert.equal(type, 0);
        assert.deepEqual(sourceConfig, local);
        return remote;
      },
    },
  });
  assert.deepEqual(
    invoke(await controlFor(player), 'remoteControlConfig.prepareSource', [
      0,
      local,
    ]),
    remote
  );
  await player.destroy();
});

test('play awaits native completion and propagates failures', async (t) => {
  const { Player } = fixture(t);
  const player = new Player();
  const native = await controlFor(player);
  let finish;
  native.play = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  let completed = false;
  const playing = player.play().then(() => {
    completed = true;
  });
  await new Promise(setImmediate);
  assert.equal(completed, false);
  finish();
  await playing;
  assert.equal(completed, true);
  const failure = new Error('SDK playback failure');
  native.play = async () => {
    throw failure;
  };
  await assert.rejects(player.play(), (error) => error === failure);
  await player.destroy();
});

test('awaited object subscriptions use their native owner and can be removed', async (t) => {
  const { Player, Source } = fixture(t);
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
  (await controlFor(other)).emit('ready', { name: 'onReady' });
  (await controlFor(player)).emit('ready', { name: 'onReady' });
  assert.equal(playerCalls, 1);
  assert.equal(sourceCalls, 0);
  assert.equal(removedCalls, 0);
  playerSubscription.remove();
  (await controlFor(player)).emit('ready', { name: 'onReady' });
  assert.equal(playerCalls, 1);
  (await controlFor(source)).emit('sourceLoaded', { name: 'onSourceLoaded' });
  assert.equal(sourceCalls, 1);
  sourceSubscription.remove();
  let destroyed = 0;
  const destroyedSubscription = await player.on('destroy', () => destroyed++);
  (await controlFor(player)).emit('destroy', { name: 'onDestroy' });
  assert.equal(destroyed, 1);
  destroyedSubscription.remove();
});

test('subscriptions and destruction do not create an unused SDK player', async (t) => {
  const { Player, creations } = fixture(t);
  const player = new Player();
  let calls = 0;
  const subscription = await player.on('destroy', () => calls++);
  await player.destroy();
  assert.equal(creations.length, 0);
  assert.equal(calls, 0);
  subscription.remove();
});

test('playlist mutations delegate without querying or reconciling native sources', async (t) => {
  const { Player, Source, calls } = fixture(t);
  const player = new Player();
  const first = new Source({ url: 'https://test/first' });
  const second = new Source({ url: 'https://test/second' });
  const native = await controlFor(player);
  native.getPlaylistSources = async () =>
    assert.fail('Mutation queried native sources');
  native.getSource = async () =>
    assert.fail('Mutation queried the active source');
  const options = { preloadAllSources: true, replayMode: 'lastSource' };
  await player.loadPlaylist({ sources: [first], options });
  assert.deepEqual(
    calls[0].sources.map((peer) => peer.source),
    [first]
  );
  assert.equal(calls[0].options, options);
  await player.playlist.add(second);
  await player.playlist.seek(second, 12);
  assert.equal(calls[1].source.source, second);
  assert.equal(calls[1].time, 12);
  await player.playlist.remove(second);
  await player.playlist.removeAt(0);
  player.destroy();
});

test('playlist queries preserve original Sources without creating SDK sources', async (t) => {
  const { Player, Source, creations } = fixture(t);
  const player = new Player();
  const first = new Source({ url: 'https://test/first' });
  const second = new Source({ url: 'https://test/second' });
  await player.loadPlaylist({ sources: [first, second] });
  (await controlFor(first)).getMetadata = async () => ({ title: 'first' });
  (await controlFor(second)).getMetadata = async () => ({ title: 'second' });
  const sources = await player.playlist.getSources();
  assert.deepEqual(
    await Promise.all(sources.map((source) => source.metadata())),
    [{ title: 'first' }, { title: 'second' }]
  );
  assert.equal(sources[0], first);
  assert.equal(sources[1], second);
  assert.equal((await player.playlist.getSources())[0], first);
  assert.equal(sources[0].config, first.config);
  assert.equal(await player.getSource(), first);
  assert.deepEqual(await (await player.getSource()).metadata(), {
    title: 'first',
  });
  await player.playlist.remove(sources[1]);
  assert.equal((await player.playlist.getSources()).length, 1);
  // The SDK double changes state independently of the JS object.
  await (await controlFor(player)).playlistRemoveAt(0);
  assert.deepEqual(await player.playlist.getSources(), []);
  assert.equal(await player.getSource(), undefined);
  assert.equal(creations.filter(({ kind }) => kind === 'source').length, 2);
  player.destroy();
});

test('playlist queries expose native state after a rejected load', async (t) => {
  const { Player, Source } = fixture(t);
  const player = new Player();
  const source = new Source({ url: 'https://test/first' });
  await player.loadPlaylist({ sources: [source] });
  (await controlFor(player)).loadPlaylist = async () => {
    throw new Error('SDK rejected load');
  };
  await assert.rejects(
    player.loadPlaylist({ sources: [] }),
    /SDK rejected load/
  );
  assert.deepEqual(await (await player.getSource()).metadata(), {
    title: 'shared source',
  });
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

test('source event subscriptions register before playlist loading and can be removed', async (t) => {
  const { Player, Source } = fixture(t);
  const source = new Source({ url: 'https://test/source' });
  const received = [];
  const canceled = await source.on('sourceLoaded', () =>
    assert.fail('Canceled subscription called')
  );
  canceled.remove();
  const active = await source.on('sourceLoaded', (event) =>
    received.push(event)
  );
  const player = new Player();
  await player.loadPlaylist({ sources: [source] });
  const event = { name: 'onSourceLoaded', timestamp: 1 };
  (await controlFor(source)).emit('sourceLoad', {
    name: 'onSourceLoad',
    timestamp: 0,
  });
  (await controlFor(source)).emit('sourceLoaded', event);
  assert.deepEqual(received, [event]);
  active.remove();
  (await controlFor(source)).emit('sourceLoaded', event);
  assert.deepEqual(received, [event]);
  player.destroy();
});

test('native-owned sources are adopted without creating another SDK source', async (t) => {
  const { Player, modules, creations } = fixture(t);
  const player = new Player();
  const native = await modules.SourceModule.create({
    url: 'https://test/native-source',
  });
  (await controlFor(player)).getSource = async () => native;
  const count = creations.length;
  const source = await player.getSource();
  assert.equal(source.config, undefined);
  assert.deepEqual(await source.metadata(), { title: 'shared source' });
  const received = [];
  const subscription = await source.on('sourceLoaded', (event) =>
    received.push(event)
  );
  const event = { name: 'onSourceLoaded', timestamp: 1 };
  native.emit('sourceLoaded', event);
  assert.deepEqual(received, [event]);
  subscription.remove();
  assert.equal(creations.length, count);
  player.destroy();
});

test('can load and clear content through compatibility aliases', async (t) => {
  const { Player, Source } = fixture(t);
  const player = new Player();
  const alias = new Player({ nativeId: player.nativeId });
  const source = new Source({ url: 'https://test/source', type: 'hls' });
  await player.loadSource(source);
  await alias.unload();
  await player.loadSource(source);
  await alias.destroy();
});

test('detached native methods remain usable as UI callbacks', async (t) => {
  const { Player } = fixture(t);
  const player = new Player();
  const native = await controlFor(player);
  let calls = 0;
  native.play = async () => {
    calls++;
  };
  const play = player.play;
  await play();
  assert.equal(calls, 1);
  await player.destroy();
});

// This inspects only the controlled Expo boundary; native lifetime is exercised in Cavy.
test('public facades keep transport on their paired Expo peer', async (t) => {
  const { Player, Source, modules } = fixture(t);
  const player = new Player();
  const source = new Source({ url: 'https://test/source', type: 'hls' });
  for (const [owner, Native, backref] of [
    [player, modules.PlayerModule.Player, 'player'],
    [source, modules.SourceModule.Source, 'source'],
    [player.buffer, modules.PlayerModule.BufferApi, 'buffer'],
  ]) {
    assert.equal(owner instanceof Native, false);
    assert.equal(owner.native instanceof Native, true);
    assert.equal(owner.native[backref], owner);
    assert.equal('release' in owner, false);
    assert.equal('emit' in owner, false);
    assert.equal('addListener' in owner, false);
  }
  await player.destroy();
});
