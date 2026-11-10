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
      'player.ts',
      'source.ts',
      'ui/fullscreenhandlerbridge.ts',
      'ui/custommessagehandlerbridge.ts',
    ].map((name) => path.resolve(__dirname, '../src', name)),
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
    const native = {
      destroy: async () => {
        callbacks.delete(native);
      },
      loadSource: async (source) => {
        calls.push({ native, source });
      },
      unload: async () => {},
      setIsFullscreenActive: async () => {},
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
    FullscreenHandlerModule: {
      create: (callback) => create('fullscreen', {}, callback),
    },
    CustomMessageHandlerModule: {
      create: (callback) => create('custom-message', {}, callback),
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
  return {
    Player,
    Source,
    FullscreenHandlerBridge: require(
      path.join(directory, 'ui/fullscreenhandlerbridge.js')
    ).FullscreenHandlerBridge,
    CustomMessageHandlerBridge: require(
      path.join(directory, 'ui/custommessagehandlerbridge.js')
    ).CustomMessageHandlerBridge,
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

test('Player aliases share eager native creation', async (t) => {
  const { Player, creations } = fixture(t);
  const player = new Player({ nativeId: 'shared' });
  const alias = new Player({ nativeId: 'shared' });
  assert.equal(player.isInitialized, false);
  await new Promise(setImmediate);
  assert.equal(creations.length, 1);
  assert.equal(await player.native, await alias.native);
  assert.equal(await alias.getVolume(), 37);
  assert.equal(player.isInitialized, true);
  await player.destroy();
});

test('fullscreen callbacks reach the current JS handler', (t) => {
  const { FullscreenHandlerBridge, dispatch } = fixture(t);
  const bridge = new FullscreenHandlerBridge();
  const handler = {
    isFullscreenActive: false,
    enterFullscreen() {
      this.isFullscreenActive = true;
    },
    exitFullscreen() {
      this.isFullscreenActive = false;
    },
  };
  bridge.setFullscreenHandler(handler);
  assert.equal(dispatch(bridge.native, 'enterFullscreen'), true);
  assert.equal(dispatch(bridge.native, 'exitFullscreen'), false);
  bridge.destroy();
});

test('custom messages preserve synchronous replies and async delivery', (t) => {
  const { CustomMessageHandlerBridge, dispatch } = fixture(t);
  const bridge = new CustomMessageHandlerBridge();
  const received = [];
  bridge.setCustomMessageHandler({
    receivedSynchronousMessage: (message, data) => `${message}:${data}`,
    receivedAsynchronousMessage: (...args) => received.push(args),
  });
  assert.equal(
    dispatch(bridge.native, 'synchronousMessage', ['get', 'value']),
    'get:value'
  );
  dispatch(bridge.native, 'asynchronousMessage', ['notify', 'value']);
  assert.deepEqual(received, [['notify', 'value']]);
  bridge.destroy();
});

test('Player creation failures reach callers', async (t) => {
  const { Player, modules } = fixture(t);
  const failure = new Error('Native creation failed');
  modules.PlayerModule.create = async () => {
    throw failure;
  };
  await assert.rejects(new Player().initialize(), (error) => error === failure);
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
  const native = await player.native;
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
  const { Player, Source, calls, invoke } = fixture(t);
  const source = new Source({
    url: 'https://test/source',
    type: 'hls',
    drmConfig: { fairplay: { prepareMessage: (message) => message } },
  });
  const first = new Player();
  await first.loadSource(source);
  assert.equal(source.isInitialized, true);
  await first.destroy();
  const second = new Player();
  await second.loadSource(source);
  const nativeSource = await source.native;
  assert.deepEqual(
    calls.map((call) => call.source),
    [nativeSource, nativeSource]
  );
  assert.equal(
    invoke(nativeSource, 'drmConfig.fairplay.prepareMessage', ['message']),
    'message'
  );
  await source.drm.fairplay.renewExpiringLicense({ skdUri: 'skd://content' });
  assert.deepEqual(calls[2], { native: nativeSource, skdUri: 'skd://content' });
  await second.destroy();
});

test('play awaits native completion and propagates failures', async (t) => {
  const { Player } = fixture(t);
  const player = new Player();
  const native = await player.native;
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
