const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(
  path.join(os.tmpdir(), 'shared-object-compatibility-')
);
const compiled = path.join(root, 'compiled');
after(() => fs.rmSync(root, { recursive: true, force: true }));

before(() => {
  const program = ts.createProgram(
    [
      'src/player.ts',
      'src/source.ts',
      'src/bufferApi.ts',
      'src/analytics/player.ts',
      'src/mediaControlsApi.ts',
      'src/hooks/usePlayer.ts',
    ].map((filename) => path.resolve(__dirname, '..', filename)),
    {
      rootDir: path.resolve(__dirname, '../src'),
      outDir: compiled,
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
});

test('Source accepts a facade with only its public structural API', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const configuration = ts.readConfigFile(
    path.join(projectRoot, 'tsconfig.json'),
    ts.sys.readFile
  );
  assert.equal(configuration.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(
    configuration.config,
    ts.sys,
    projectRoot
  );
  const filename = path.join(root, 'source-public-facade.ts');
  fs.writeFileSync(
    filename,
    `import type { Source } from ${JSON.stringify(path.join(projectRoot, 'src/source'))};
declare const facade: Pick<Source, keyof Source>;
const source: Source = facade;
void source;
`
  );
  const program = ts.createProgram([filename], {
    ...parsed.options,
    rootDir: undefined,
    noEmit: true,
    types: [],
  });
  assert.deepEqual(
    ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      ),
    []
  );
});

// Real public wrappers run against controlled native boundary doubles. These
// checks establish JS identity, routing and return shapes, not SDK cleanup,
// Expo argument conversion, SharedObject release, or playback behavior.
function fixture(t, platform = 'ios') {
  const directory = fs.mkdtempSync(path.join(root, 'case-'));
  fs.cpSync(compiled, directory, { recursive: true });
  t.after(() => {
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(`${directory}${path.sep}`)) {
        delete require.cache[filename];
      }
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });

  for (const name of [
    'expo-modules-core',
    'expo-crypto',
    'react-native',
    'react',
  ]) {
    const packageDirectory = path.join(directory, 'node_modules', name);
    fs.mkdirSync(packageDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(packageDirectory, 'index.js'),
      'module.exports = {};'
    );
  }
  let nextId = 0;
  require(path.join(directory, 'node_modules/expo-crypto')).randomUUID = () =>
    `generated-${++nextId}`;
  require(path.join(directory, 'node_modules/react-native')).Platform = {
    OS: platform,
  };
  let playerRef;
  require(path.join(directory, 'node_modules/react')).useRef = (initialValue) =>
    (playerRef ??= { current: initialValue });

  const calls = [];
  const creations = [];
  const listeners = new Map();
  const track =
    (target, method, implementation = () => undefined) =>
    (...args) => {
      calls.push({ target, method, args });
      return Promise.resolve().then(() => implementation(...args));
    };
  const callbacks = new Map();
  const create = (kind, config, callback, configured = false) => {
    const native = {
      __expo_shared_object_id__: creations.length + 1,
      release: () => assert.fail('Public destroy must not release Expo'),
      addListener: (eventName, listener) => {
        const objectListeners = listeners.get(native);
        const eventListeners = objectListeners.get(eventName) ?? new Set();
        objectListeners.set(eventName, eventListeners);
        eventListeners.add(listener);
        return { remove: () => eventListeners.delete(listener) };
      },
    };
    listeners.set(native, new Map());
    let initialized = configured;
    if (callback) callbacks.set(native, callback);
    const values = {
      getVolume: 37,
      duration: 123,
      isPlaying: false,
      isPaused: true,
      isActive: false,
      isAttachedToPlayer: false,
      loadingState: 0,
      getMetadata: { title: 'native metadata' },
    };
    for (const method of [
      'destroy',
      'play',
      'pause',
      'seek',
      'loadSource',
      'unload',
      'setVolume',
      'setMetadata',
      'getBufferLevel',
      'setBufferTargetLevel',
      'sendCustomDataEvent',
      'getAnalyticsUserId',
      'isMediaControlsEnabled',
      'setMediaControlsEnabled',
      ...Object.keys(values),
    ]) {
      native[method] = track(native, method, () => {
        if (method === 'destroy') {
          initialized = false;
          callbacks.delete(native);
        }
        if (method === 'getBufferLevel') return initialized ? levels : null;
        if (method === 'isMediaControlsEnabled')
          return initialized ? true : null;
        if (
          method === 'getAnalyticsUserId' ||
          method === 'sendCustomDataEvent'
        ) {
          if (!initialized && platform === 'android') {
            throw Object.assign(new Error('Player is not initialized'), {
              code: 'PlayerAnalyticsError',
            });
          }
          return method === 'getAnalyticsUserId'
            ? initialized
              ? 'user-id'
              : null
            : undefined;
        }
        return values[method];
      });
    }
    creations.push({ kind, config, native });
    return native;
  };

  const levels = { audio: { level: 3 }, video: { level: 5 } };
  const modules = {
    PlayerModule: {
      createEmpty: () => create('player'),
      create: async (...args) => {
        const native = create('player', args[0], args[4], true);
        calls.push({ target: native, method: 'create', args });
        return native;
      },
      isGoogleImaEnabled: true,
    },
    SourceModule: {
      createEmpty: () => create('source'),
      create: async (...args) => {
        const native = create('source', args[0], undefined, true);
        calls.push({ target: native, method: 'create', args });
        return native;
      },
    },
    NativeCallbacksModule: {},
    OfflineModule: {},
    DebugModule: { setDebugLoggingEnabled: async () => {} },
    NetworkModule: {
      create: (config, callback) => create('network', config, callback, true),
    },
    DecoderConfigModule: {
      create: (config, callback) => create('decoder', config, callback, true),
    },
    DrmModule: { create: () => ({ destroy: async () => {} }) },
  };
  for (const module of Object.values(modules)) {
    module.addListener = () => ({ remove() {} });
  }
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).requireNativeModule = (name) => {
    assert.ok(modules[name], `Unexpected native module: ${name}`);
    return modules[name];
  };

  const { Player } = require(path.join(directory, 'player.js'));
  const { Source, SourceType } = require(path.join(directory, 'source.js'));
  const { BufferApi, BufferType } = require(
    path.join(directory, 'bufferApi.js')
  );
  const { AnalyticsApi } = require(path.join(directory, 'analytics/player.js'));
  const { MediaControlsApi } = require(
    path.join(directory, 'mediaControlsApi.js')
  );
  const { usePlayer } = require(path.join(directory, 'hooks/usePlayer.js'));
  const { lookup } = require(path.join(directory, 'nativeInstanceRegistry.js'));
  return {
    Player,
    Source,
    SourceType,
    BufferApi,
    BufferType,
    AnalyticsApi,
    MediaControlsApi,
    usePlayer,
    lookup,
    modules,
    nativeOf: (instance) =>
      lookup(
        instance instanceof Source ? 'source' : 'player',
        instance.nativeId
      ),
    calls,
    creations,
    levels,
    invoke: async (native, operation, args) => {
      const callback = callbacks.get(native);
      if (!callback) return null;
      return new Promise((resolve) =>
        callback(operation, structuredClone(args), { resolve })
      );
    },
  };
}

test('public wrappers preserve named and generated IDs', async (t) => {
  const { Player, Source, creations } = fixture(t);
  const namedPlayer = new Player({ nativeId: 'named' });
  const namedSource = new Source({
    nativeId: 'named',
    url: 'https://test/source',
  });
  const generatedPlayer = new Player();
  const generatedSource = new Source({ url: 'https://test/generated' });

  assert.equal(namedPlayer.nativeId, 'named');
  assert.equal(namedSource.nativeId, 'named');
  assert.match(generatedPlayer.nativeId, /^generated-\d+$/);
  assert.match(generatedSource.nativeId, /^generated-\d+$/);
  assert.notEqual(generatedPlayer.nativeId, generatedSource.nativeId);
  assert.equal(creations.length, 0);
  for (const instance of [
    namedPlayer,
    namedSource,
    generatedPlayer,
    generatedSource,
  ]) {
    await instance.initialize();
  }
  assert.deepEqual(
    creations.map(({ kind, config }) => ({ kind, nativeId: config?.nativeId })),
    [
      { kind: 'player', nativeId: undefined },
      { kind: 'source', nativeId: undefined },
      { kind: 'player', nativeId: undefined },
      { kind: 'source', nativeId: undefined },
    ]
  );
});

test('usePlayer rerenders create one player and preserve the initial config', async (t) => {
  const { nativeOf, usePlayer, creations } = fixture(t);
  const config = { playbackConfig: { isAutoplayEnabled: true } };
  const first = usePlayer(config);
  const rerendered = usePlayer({
    playbackConfig: { isAutoplayEnabled: false },
  });

  assert.equal(rerendered, first);
  assert.equal(rerendered.config, config);
  assert.equal(creations.length, 0);
  await first.initialize();
  assert.equal(creations.length, 1);
  assert.equal(creations[0].native, nativeOf(first));
  assert.equal(first.nativeId, 'generated-1');
});

test('same-ID wrappers keep separate configs and flags while routing to the same initialized backend', async (t) => {
  const { nativeOf, Player, Source, creations } = fixture(t);
  const config = {
    nativeId: 'shared',
    playbackConfig: { isAutoplayEnabled: true },
  };
  const player = new Player(config);
  const alias = new Player({ nativeId: 'shared' });
  const source = new Source({ nativeId: 'shared', url: 'https://test/source' });
  const sourceAlias = new Source({
    nativeId: 'shared',
    url: 'https://test/other',
  });

  assert.notEqual(alias, player);
  assert.notEqual(sourceAlias, source);
  assert.equal(player.config, config);
  assert.notEqual(alias.config, config);
  assert.equal(creations.length, 0);
  await player.initialize();
  await source.initialize();
  assert.equal(alias.isInitialized, false);
  assert.equal(sourceAlias.isInitialized, false);
  assert.equal(nativeOf(alias), nativeOf(player));
  assert.equal(nativeOf(sourceAlias), nativeOf(source));
  assert.notEqual(nativeOf(player), nativeOf(source));
  assert.equal(creations.length, 2);
  await alias.initialize();
  assert.equal(alias.isInitialized, true);
  player.destroy();
  assert.equal(alias.isDestroyed, false);
});

test('uninitialized construction is not retained and the first initializing wrapper supplies its config', async (t) => {
  const { nativeOf, Player, Source, calls, creations, lookup } = fixture(t);
  const firstPlayer = new Player({ nativeId: 'configured-player' });
  const playerConfig = {
    nativeId: 'configured-player',
    licenseKey: 'test-fixture-placeholder',
  };
  const configuredPlayer = new Player(playerConfig);
  const firstSource = new Source({
    nativeId: 'configured-source',
    url: 'https://test/first',
  });
  const sourceConfig = {
    nativeId: 'configured-source',
    url: 'https://test/configured',
    drmConfig: { widevine: { licenseUrl: 'https://test/license' } },
  };
  const configuredSource = new Source(sourceConfig);
  assert.equal(creations.length, 0);
  assert.equal(lookup('player', firstPlayer.nativeId), undefined);
  assert.equal(lookup('source', firstSource.nativeId), undefined);
  assert.equal(firstPlayer.config.licenseKey, undefined);
  assert.equal(firstSource.config.url, 'https://test/first');

  await configuredPlayer.initialize();
  await configuredSource.initialize();
  assert.equal(nativeOf(firstPlayer), nativeOf(configuredPlayer));
  assert.equal(nativeOf(firstSource), nativeOf(configuredSource));
  assert.equal(
    lookup('player', firstPlayer.nativeId),
    nativeOf(configuredPlayer)
  );
  assert.equal(
    lookup('source', firstSource.nativeId),
    nativeOf(configuredSource)
  );
  assert.deepEqual(
    calls.find(
      ({ target, method }) =>
        target === nativeOf(configuredPlayer) && method === 'create'
    ).args[0],
    { licenseKey: playerConfig.licenseKey }
  );
  assert.deepEqual(
    calls.find(
      ({ target, method }) =>
        target === nativeOf(configuredSource) && method === 'create'
    ).args[0],
    { url: sourceConfig.url, drmConfig: sourceConfig.drmConfig }
  );
  assert.equal(firstPlayer.isInitialized, false);
  assert.equal(firstSource.isInitialized, false);
});

test('Player and Source methods call their SharedObject without string IDs', async (t) => {
  const { nativeOf, Player, Source, SourceType, calls } = fixture(t);
  const player = new Player({ nativeId: 'routing-player' });
  const source = new Source({
    nativeId: 'routing-source',
    url: 'https://test/source',
    type: SourceType.HLS,
  });
  await player.initialize();
  calls.length = 0;

  assert.equal(player.play(), undefined);
  assert.equal(player.seek(12), undefined);
  assert.equal(player.loadSource(source), undefined);
  await new Promise(setImmediate);
  assert.equal(source.setMetadata({ title: 'updated' }), undefined);
  const duration = source.duration();
  const volume = player.getVolume();
  assert.ok(duration instanceof Promise);
  assert.ok(volume instanceof Promise);
  assert.equal(await duration, 123);
  assert.equal(await volume, 37);
  assert.equal(player.source, source);

  for (const [target, method, args] of [
    [nativeOf(player), 'play', []],
    [nativeOf(player), 'seek', [12]],
    [nativeOf(player), 'loadSource', [nativeOf(source)]],
    [nativeOf(source), 'setMetadata', [{ title: 'updated' }]],
    [nativeOf(source), 'duration', []],
    [nativeOf(player), 'getVolume', []],
  ]) {
    const matches = calls.filter(
      (call) => call.target === target && call.method === method
    );
    assert.equal(matches.length, 1, method);
    assert.deepEqual(matches[0].args, args, method);
  }
});

test('destroy is idempotent and stale wrappers cannot unregister replacements', async (t) => {
  const { nativeOf, Player, Source, BufferApi, BufferType, calls } = fixture(t);
  const original = new Player({ nativeId: 'reusable' });
  const originalSource = new Source({
    nativeId: 'source',
    url: 'https://test/old',
  });
  await original.initialize();
  await originalSource.initialize();
  const retiredNative = nativeOf(original);
  const retiredSourceNative = nativeOf(originalSource);
  assert.equal(original.destroy(), undefined);
  assert.equal(originalSource.destroy(), undefined);
  const replacement = new Player({ nativeId: 'reusable' });
  const replacementSource = new Source({
    nativeId: 'source',
    url: 'https://test/new',
  });
  await replacement.initialize();
  await replacementSource.initialize();
  original.destroy();
  originalSource.destroy();

  assert.notEqual(replacement, original);
  assert.notEqual(replacementSource, originalSource);
  assert.equal(
    nativeOf(new Player({ nativeId: 'reusable' })),
    nativeOf(replacement)
  );
  assert.equal(
    nativeOf(new Source({ nativeId: 'source', url: 'ignored' })),
    nativeOf(replacementSource)
  );
  for (const native of [retiredNative, retiredSourceNative]) {
    assert.equal(
      calls.filter(
        (call) => call.target === native && call.method === 'destroy'
      ).length,
      1
    );
  }
  await new BufferApi('reusable').getLevel(BufferType.FORWARD_DURATION);
  assert.equal(calls.at(-1).target, nativeOf(replacement));
});

test('destroying a precreated alias retires the current backend without changing another wrapper flags', async (t) => {
  const { nativeOf, Player, Source, calls, lookup } = fixture(t);
  for (const [kind, make] of [
    ['player', () => new Player({ nativeId: 'alias-destroy' })],
    [
      'source',
      () =>
        new Source({ nativeId: 'alias-destroy', url: 'https://test/source' }),
    ],
  ]) {
    const alias = make();
    const owner = make();
    await owner.initialize();
    const native = nativeOf(owner);
    alias.destroy();
    assert.equal(alias.isDestroyed, true);
    assert.equal(owner.isDestroyed, false);
    assert.equal(lookup(kind, 'alias-destroy'), undefined);
    assert.equal(
      calls.filter(
        (call) => call.target === native && call.method === 'destroy'
      ).length,
      1
    );

    const replacement = make();
    await replacement.initialize();
    assert.notEqual(nativeOf(replacement), native);
    alias.destroy();
    assert.equal(lookup(kind, 'alias-destroy'), nativeOf(replacement));
    assert.equal(nativeOf(owner), nativeOf(replacement));
  }
});

test('a synchronous native factory failure does not register an instance', async (t) => {
  const { nativeOf, Player, modules, lookup } = fixture(t);
  const failure = new Error('Native factory failed');
  const create = modules.PlayerModule.create;
  modules.PlayerModule.create = () => {
    throw failure;
  };
  const player = new Player({ nativeId: 'retry-factory' });
  await assert.rejects(player.initialize(), (error) => error === failure);
  assert.equal(lookup('player', player.nativeId), undefined);
  assert.equal(player.isInitialized, false);
  modules.PlayerModule.create = create;
  await player.initialize();
  assert.equal(lookup('player', player.nativeId), nativeOf(player));
});

test('overlapping aliases share creation and can retry after a failed factory', async (t) => {
  const { nativeOf, Player, modules, lookup } = fixture(t);
  const failure = new Error('First creation failed');
  let rejectFirstAttempt;
  const firstAttempt = new Promise((_, reject) => {
    rejectFirstAttempt = reject;
  });
  const create = modules.PlayerModule.create;
  let attempts = 0;
  modules.PlayerModule.create = (...args) =>
    ++attempts === 1 ? firstAttempt : create(...args);
  const first = new Player({ nativeId: 'overlapping' });
  const alias = new Player({ nativeId: first.nativeId });
  const firstFailure = assert.rejects(
    first.initialize(),
    (error) => error === failure
  );
  const aliasFailure = assert.rejects(
    alias.initialize(),
    (error) => error === failure
  );
  await new Promise(setImmediate);
  assert.equal(attempts, 1);
  rejectFirstAttempt(failure);
  await Promise.all([firstFailure, aliasFailure]);
  assert.equal(lookup('player', first.nativeId), undefined);
  await alias.initialize();
  assert.equal(alias.isInitialized, true);
  assert.equal(first.isInitialized, false);
  assert.equal(nativeOf(first), nativeOf(alias));
});

test('legacy feature facades resolve their player on every call', async (t) => {
  const {
    nativeOf,
    Player,
    BufferApi,
    BufferType,
    AnalyticsApi,
    MediaControlsApi,
    calls,
    levels,
  } = fixture(t);
  const buffer = new BufferApi('late-player');
  const analytics = new AnalyticsApi('late-player');
  const controls = new MediaControlsApi('late-player');
  const player = new Player({ nativeId: 'late-player' });
  await player.initialize();
  calls.length = 0;

  const level = buffer.getLevel(BufferType.FORWARD_DURATION);
  assert.ok(level instanceof Promise);
  assert.equal(await level, levels);
  await buffer.setTargetLevel(BufferType.FORWARD_DURATION, 8);
  assert.equal(await analytics.getUserId(), 'user-id');
  await analytics.sendCustomDataEvent({ customData1: 'test' });
  assert.equal(await controls.isEnabled(), true);
  await controls.setEnabled(false);
  assert.deepEqual(
    calls.map(({ target, method, args }) => ({ target, method, args })),
    [
      {
        target: nativeOf(player),
        method: 'getBufferLevel',
        args: [BufferType.FORWARD_DURATION],
      },
      {
        target: nativeOf(player),
        method: 'setBufferTargetLevel',
        args: [BufferType.FORWARD_DURATION, 8],
      },
      { target: nativeOf(player), method: 'getAnalyticsUserId', args: [] },
      {
        target: nativeOf(player),
        method: 'sendCustomDataEvent',
        args: [{ customData1: 'test' }],
      },
      { target: nativeOf(player), method: 'isMediaControlsEnabled', args: [] },
      {
        target: nativeOf(player),
        method: 'setMediaControlsEnabled',
        args: [false],
      },
    ]
  );

  player.destroy();
  const replacement = new Player({ nativeId: 'late-player' });
  await replacement.initialize();
  calls.length = 0;
  await buffer.getLevel(BufferType.FORWARD_DURATION);
  await analytics.getUserId();
  await controls.isEnabled();
  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(call.target, nativeOf(replacement));
  }
});

for (const platform of ['ios', 'android']) {
  test(`${platform}: missing-player helpers preserve their defaults and analytics errors`, async (t) => {
    const {
      Player,
      BufferApi,
      BufferType,
      AnalyticsApi,
      MediaControlsApi,
      creations,
      lookup,
    } = fixture(t, platform);
    const warnings = [];
    t.mock.method(console, 'warn', (message) => warnings.push(message));
    const buffer = new BufferApi('missing-player');
    const analytics = new AnalyticsApi('missing-player');
    const controls = new MediaControlsApi('missing-player');
    assert.equal(await buffer.getLevel(BufferType.FORWARD_DURATION), null);
    assert.equal(
      await buffer.setTargetLevel(BufferType.FORWARD_DURATION, 4),
      undefined
    );
    assert.equal(await controls.isEnabled(), false);
    assert.equal(await controls.setEnabled(false), undefined);
    assert.equal(creations.length, 0);

    if (platform === 'android') {
      await assert.rejects(analytics.getUserId(), {
        code: 'PlayerAnalyticsError',
      });
      await assert.rejects(analytics.sendCustomDataEvent({}), {
        code: 'PlayerAnalyticsError',
      });
      assert.equal(warnings.length, 2);
    } else {
      assert.equal(await analytics.getUserId(), null);
      assert.equal(await analytics.sendCustomDataEvent({}), undefined);
      assert.equal(warnings.length, 0);
    }
    assert.equal(creations.length, 2);
    assert.equal(lookup('player', 'missing-player'), undefined);

    const player = new Player({ nativeId: 'missing-player' });
    await player.initialize();
    assert.equal(await analytics.getUserId(), 'user-id');
    player.destroy();
    assert.equal(await buffer.getLevel(BufferType.FORWARD_DURATION), null);
    if (platform === 'android') {
      await assert.rejects(analytics.getUserId(), {
        code: 'PlayerAnalyticsError',
      });
    } else {
      assert.equal(await analytics.getUserId(), null);
    }
    assert.equal(lookup('player', 'missing-player'), undefined);
  });
}

for (const platform of ['ios', 'android']) {
  test(`${platform}: direct advertising callbacks stay with their configured player`, async (t) => {
    const { nativeOf, Player, invoke } = fixture(t, platform);
    const received = [];
    const make = (nativeId, decision) =>
      new Player({
        nativeId,
        advertisingConfig: {
          shouldLoadAdItem: (item) => {
            received.push([nativeId, item]);
            return decision;
          },
          ima: {
            beforeInitialization: (settings) => {
              settings.language = nativeId;
              return { playerType: 'custom' };
            },
          },
        },
      });
    const first = make('first', false);
    const second = make('second', true);
    await Promise.all([first.initialize(), second.initialize()]);
    const item = { sources: [{ uri: 'https://test/ad' }] };
    assert.equal(
      await invoke(nativeOf(first), 'shouldLoadAdItem', [item]),
      false
    );
    assert.equal(
      await invoke(nativeOf(second), 'shouldLoadAdItem', [item]),
      true
    );
    assert.deepEqual(
      received.map(([id]) => id),
      ['first', 'second']
    );
    assert.deepEqual(received[0][1], item);
    assert.notEqual(received[0][1], item);
    assert.deepEqual(
      await invoke(nativeOf(first), 'imaBeforeInitialization', [
        { language: 'original' },
      ]),
      {
        language: 'first',
        playerType: 'custom',
      }
    );
    const original = nativeOf(first);
    first.destroy();
    await new Promise(setImmediate);
    assert.equal(await invoke(original, 'shouldLoadAdItem', [item]), null);
  });
}

test('a canceled creation cannot replace a player reusing its public ID', async (t) => {
  const { Player, modules, nativeOf } = fixture(t);
  const create = modules.PlayerModule.create;
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  modules.PlayerModule.create = () => pending;
  const old = new Player({ nativeId: 'reuse-during-creation' });
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
  assert.equal(old.isDestroyed, true);
  assert.equal(replacement.isInitialized, true);
});

test('destroying before deferred creation starts allocates no configuration owners', async (t) => {
  const { Player, creations, lookup } = fixture(t, 'android');
  const player = new Player({
    nativeId: 'cancel-before-start',
    networkConfig: { preprocessHttpRequest: (_type, request) => request },
    playbackConfig: { decoderConfig: {} },
  });
  const initialization = player.initialize();
  player.destroy();
  await initialization;
  assert.equal(
    creations.filter(({ kind }) => kind === 'network' || kind === 'decoder')
      .length,
    0
  );
  assert.equal(lookup('player', player.nativeId), undefined);
});

test('canceling an alias during creation disposes its configuration owners', async (t) => {
  const { Player, modules, creations, calls, lookup } = fixture(t, 'android');
  const create = modules.PlayerModule.create;
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  modules.PlayerModule.create = () => pending;
  const player = new Player({
    nativeId: 'cancel-with-configuration',
    networkConfig: { preprocessHttpRequest: (_type, request) => request },
    playbackConfig: { decoderConfig: {} },
  });
  const initialization = player.initialize();
  await new Promise(setImmediate);
  new Player({ nativeId: player.nativeId }).destroy();
  finish(await create());
  await initialization;
  for (const { kind, native } of creations.filter(
    ({ kind }) => kind === 'network' || kind === 'decoder'
  )) {
    assert.equal(
      calls.filter(
        (call) => call.target === native && call.method === 'destroy'
      ).length,
      1,
      kind
    );
  }
  assert.equal(lookup('player', player.nativeId), undefined);
});
