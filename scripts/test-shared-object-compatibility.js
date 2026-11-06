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
  const create = (kind, nativeId) => {
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
    let initialized = false;
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
      'initializeWithConfig',
      'initializeWithAnalyticsConfig',
      'destroy',
      'play',
      'pause',
      'seek',
      'loadSource',
      'unload',
      'setVolume',
      'setMetadata',
      'setShouldLoadAdItem',
      'setShouldPlayAdBreak',
      'setPreparedImaSettings',
      'getBufferLevel',
      'setBufferTargetLevel',
      'sendCustomDataEvent',
      'getAnalyticsUserId',
      'isMediaControlsEnabled',
      'setMediaControlsEnabled',
      ...Object.keys(values),
    ]) {
      native[method] = track(native, method, () => {
        if (method.startsWith('initializeWith')) initialized = true;
        if (method === 'destroy') initialized = false;
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
    creations.push({ kind, nativeId, native });
    return native;
  };

  const levels = { audio: { level: 3 }, video: { level: 5 } };
  const modules = {
    PlayerModule: {
      create: (id) => create('player', id),
      isGoogleImaEnabled: true,
    },
    SourceModule: {
      create: (...args) => {
        assert.equal(args.length, 0);
        return create('source');
      },
    },
    DebugModule: { setDebugLoggingEnabled: async () => {} },
    NetworkModule: {},
    DecoderConfigModule: {},
    DrmModule: { initializeWithConfig: async () => {} },
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
    emit: (native, eventName, payload) => {
      for (const listener of listeners.get(native).get(eventName) ?? []) {
        listener(payload);
      }
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
    creations.map(({ kind, nativeId }) => ({ kind, nativeId })),
    [
      { kind: 'player', nativeId: 'named' },
      { kind: 'source', nativeId: undefined },
      { kind: 'player', nativeId: generatedPlayer.nativeId },
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
  assert.equal(
    calls.find(
      ({ target, method }) =>
        target === nativeOf(configuredPlayer) &&
        method === 'initializeWithConfig'
    ).args[0],
    playerConfig
  );
  assert.equal(
    calls.find(
      ({ target, method }) =>
        target === nativeOf(configuredSource) &&
        method === 'initializeWithConfig'
    ).args[1],
    sourceConfig
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

test('one alias failing initialization does not unregister another alias successful backend', async (t) => {
  const { nativeOf, Player, modules, lookup } = fixture(t);
  const failure = new Error('First initialization attempt failed');
  let rejectFirstAttempt;
  const firstAttempt = new Promise((_, reject) => {
    rejectFirstAttempt = reject;
  });
  const create = modules.PlayerModule.create;
  modules.PlayerModule.create = (id) => {
    const native = create(id);
    const initialize = native.initializeWithConfig;
    native.initializeWithConfig = (config, ...args) =>
      config?.licenseKey === 'failing-fixture'
        ? firstAttempt
        : initialize(config, ...args);
    return native;
  };
  const first = new Player({
    nativeId: 'overlapping-initialization',
    licenseKey: 'failing-fixture',
  });
  const failedInitialization = assert.rejects(
    first.initialize(),
    (error) => error === failure
  );
  await new Promise(setImmediate);
  const alias = new Player({ nativeId: first.nativeId });
  await alias.initialize();
  const native = nativeOf(alias);
  rejectFirstAttempt(failure);
  await failedInitialization;

  assert.equal(first.isInitialized, false);
  assert.equal(alias.isInitialized, true);
  assert.equal(lookup('player', first.nativeId), native);
  assert.equal(nativeOf(first), native);
  alias.destroy();
  assert.equal(lookup('player', first.nativeId), undefined);
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
  test(`${platform}: advertising callbacks and completions stay on their player object`, async (t) => {
    const { nativeOf, Player, calls, emit } = fixture(t, platform);
    const decisions = [];
    const beforeInitialization = [];
    const callbackName =
      platform === 'android' ? 'shouldPlayAdBreak' : 'shouldLoadAdItem';
    const eventName =
      platform === 'android' ? 'onShouldPlayAdBreak' : 'onShouldLoadAdItem';
    const completionName =
      platform === 'android' ? 'setShouldPlayAdBreak' : 'setShouldLoadAdItem';
    const eventValue =
      platform === 'android'
        ? { ads: [{ id: 'ad', data: { custom: 'original' } }] }
        : { sources: [{ type: 'vast', uri: 'https://test/ad' }] };
    const payload = {
      id: 1,
      [platform === 'android' ? 'adBreak' : 'adItem']: eventValue,
    };
    const makeConfig = (id, result) => ({
      nativeId: id,
      advertisingConfig: {
        [callbackName]: (value) => {
          decisions.push({ id, value });
          return result;
        },
        ima: {
          beforeInitialization: (settings) => {
            beforeInitialization.push(id);
            return { ...settings, language: id };
          },
        },
      },
    });
    const first = new Player(makeConfig('first', false));
    const second = new Player(makeConfig('second', true));
    await first.initialize();
    await second.initialize();
    calls.length = 0;
    const firstNative = nativeOf(first);

    // No string ID routing is needed inside an object-scoped event. Reusing a
    // completion ID on another object must still call the corresponding object.
    emit(firstNative, eventName, payload);
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0].id, 'first');
    assert.deepEqual(decisions[0].value, eventValue);
    assert.notEqual(decisions[0].value, eventValue);
    emit(nativeOf(second), eventName, payload);
    emit(firstNative, 'onImaBeforeInitialization', {
      id: 1,
      settings: { language: 'original' },
    });
    assert.deepEqual(beforeInitialization, ['first']);
    assert.deepEqual(
      calls.map(({ target, method, args }) => ({ target, method, args })),
      [
        { target: nativeOf(first), method: completionName, args: [1, false] },
        { target: nativeOf(second), method: completionName, args: [1, true] },
        {
          target: nativeOf(first),
          method: 'setPreparedImaSettings',
          args: [1, { language: 'first' }],
        },
      ]
    );

    first.destroy();
    calls.length = 0;
    emit(firstNative, eventName, payload);
    emit(firstNative, 'onImaBeforeInitialization', {
      id: 2,
      settings: {},
    });
    assert.equal(decisions.length, 2);
    assert.equal(beforeInitialization.length, 1);
    assert.deepEqual(calls, []);
  });
}

test('queued callbacks complete on their original object after the player ID is reused', async (t) => {
  const { nativeOf, Player, calls, emit } = fixture(t, 'android');
  const owner = new Player({
    nativeId: 'reused-callback-id',
    advertisingConfig: {
      shouldLoadAdItem: () => false,
      shouldPlayAdBreak: () => false,
      ima: { beforeInitialization: () => ({ language: 'original' }) },
    },
  });
  await owner.initialize();
  const originalNative = nativeOf(owner);
  // Lifecycle flags and subscriptions remain per wrapper, as in the legacy API.
  // Retiring through another wrapper leaves the original wrapper's listeners.
  new Player({ nativeId: owner.nativeId }).destroy();
  const replacement = new Player({ nativeId: owner.nativeId });
  await replacement.initialize();
  assert.notEqual(nativeOf(replacement), originalNative);
  calls.length = 0;

  emit(originalNative, 'onShouldLoadAdItem', {
    id: 1,
    adItem: { sources: [] },
  });
  emit(originalNative, 'onShouldPlayAdBreak', {
    id: 1,
    adBreak: { ads: [] },
  });
  emit(originalNative, 'onImaBeforeInitialization', {
    id: 1,
    settings: {},
  });
  assert.deepEqual(
    calls.map(({ target, method, args }) => ({ target, method, args })),
    [
      {
        target: originalNative,
        method: 'setShouldLoadAdItem',
        args: [1, false],
      },
      {
        target: originalNative,
        method: 'setShouldPlayAdBreak',
        args: [1, false],
      },
      {
        target: originalNative,
        method: 'setPreparedImaSettings',
        args: [1, { language: 'original' }],
      },
    ]
  );
});
