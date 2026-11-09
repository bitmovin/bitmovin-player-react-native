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
    const native = {
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
  const { getNativeOwner } = require(path.join(directory, 'nativeOwner.js'));
  return {
    Player,
    Source,
    modules,
    calls,
    creations,
    nativeOf: (player) => getNativeOwner(player),
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

test('same-ID constructors eagerly share the same player', async (t) => {
  const { Player, creations } = fixture(t);
  const first = new Player({ nativeId: 'shared' });
  const alias = new Player({ nativeId: 'shared' });
  assert.equal(first.isInitialized, false);
  await new Promise(setImmediate);
  assert.equal(creations.filter((item) => item.kind === 'player').length, 1);
  assert.equal(await alias.getVolume(), 37);
  assert.equal(first.isInitialized, true);
  assert.equal(alias.isInitialized, true);
  await first.destroy();
});

test('each Source eagerly owns a distinct native object without an ID', async (t) => {
  const { Source, creations } = fixture(t);
  const config = { url: 'https://test/source', type: 'hls' };
  const first = new Source(config);
  const second = new Source(config);
  assert.equal(first.isInitialized, false);
  await new Promise(setImmediate);
  assert.equal(creations.filter((item) => item.kind === 'source').length, 2);
  assert.notEqual(await first.native, await second.native);
  assert.equal(first.isInitialized, true);
  assert.equal('nativeId' in first, false);
});

test('a failed player creation stays rejected; a new wrapper can retry', async (t) => {
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
  assert.equal(first.isInitialized, false);
  modules.PlayerModule.create = create;
  await assert.rejects(alias.initialize(), (error) => error === failure);
  const replacement = new Player({ nativeId: first.nativeId });
  await replacement.initialize();
  assert.equal(await replacement.getVolume(), 37);
  replacement.destroy();
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
  let retiredDestroyed = false;
  retired.destroy = async () => {
    retiredDestroyed = true;
  };
  finish(retired);
  await initialization;
  await new Promise(setImmediate);
  assert.equal(retiredDestroyed, true);
  const alias = new Player({ nativeId: replacement.nativeId });
  await alias.initialize();
  assert.equal(nativeOf(alias), nativeOf(replacement));
  assert.notEqual(nativeOf(alias), retired);
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

test('a new Source can retry failed creation with DRM callbacks', async (t) => {
  const { Source, modules, invoke } = fixture(t);
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
  await assert.rejects(source.initialize(), (error) => error === failure);
  const replacement = new Source(source.config);
  await replacement.initialize();
  assert.equal(
    invoke(await replacement.native, 'drmConfig.fairplay.prepareMessage', [
      'message',
    ]),
    'message'
  );
});

test('a Source retains its DRM callbacks after player destruction and reuse', async (t) => {
  const { Player, Source, calls, invoke } = fixture(t);
  const source = new Source({
    url: 'https://test/source',
    type: 'hls',
    drmConfig: { fairplay: { prepareMessage: (message) => message } },
  });
  const first = new Player();
  await first.initialize();
  first.loadSource(source);
  await new Promise(setImmediate);
  const native = await source.native;
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
  assert.equal(await source.native, native);
  await source.drm.fairplay.renewExpiringLicense({ skdUri: 'skd://content' });
  assert.deepEqual(calls, [
    { native, skdUri: 'skd://content' },
    { native, skdUri: 'skd://content' },
  ]);
  second.destroy();
});

test('Player commands await native completion and propagate errors', async (t) => {
  const { Player, nativeOf } = fixture(t);
  const player = new Player();
  await player.initialize();
  const native = nativeOf(player);
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
  const completions = [];
  native.destroy = () => new Promise((resolve) => completions.push(resolve));
  let destroyed = 0;
  const destructions = [player.destroy(), player.destroy()].map(
    async (call) => {
      await call;
      destroyed++;
    }
  );
  await new Promise(setImmediate);
  assert.equal(completions.length, 2);
  assert.equal(destroyed, 0);
  completions.forEach((complete) => complete());
  await Promise.all(destructions);
  assert.equal(destroyed, 2);
});

test('a pending Source load reaches native after Player destruction', async (t) => {
  const { Player, Source, modules } = fixture(t);
  const player = new Player();
  const native = await player.native;
  const create = modules.SourceModule.create;
  let finish;
  modules.SourceModule.create = (...args) =>
    new Promise((resolve) => {
      finish = async () => resolve(await create(...args));
    });
  const source = new Source({ url: 'https://test/source', type: 'hls' });
  let loaded;
  native.loadSource = async (value) => {
    loaded = value;
  };
  const loading = player.loadSource(source);
  await player.destroy();
  await finish();
  await loading;
  assert.equal(loaded, await source.native);
});
