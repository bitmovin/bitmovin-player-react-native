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
    const native = {
      addListener(event, listener) {
        emitter.on(event, listener);
        return { remove: () => emitter.off(event, listener) };
      },
      emit: (event, payload) => emitter.emit(event, payload),
      destroy: async () => {
        callbacks.delete(native);
      },
      loadSource: async () => {},
      unload: async () => {},
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

test('object subscriptions use their native owner and can be removed before creation', async (t) => {
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
  const playerSubscription = player.on('ready', () => playerCalls++);
  const sourceSubscription = source.on('sourceLoaded', () => sourceCalls++);
  const removed = player.on('ready', () => removedCalls++);
  removed.remove();
  await Promise.all([
    player.initialize(),
    source.initialize(),
    other.initialize(),
  ]);
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
  // An initialized object must register synchronously before destroy() can emit.
  let destroyed = 0;
  const destroyedSubscription = player.on('destroy', () => destroyed++);
  nativeOf(player).emit('destroy', { name: 'onDestroy' });
  assert.equal(destroyed, 1);
  destroyedSubscription.remove();
});
