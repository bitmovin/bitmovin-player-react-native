const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'source-lifecycle-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
// Emit the import graphs once, without Expo's app build or typecheck. The Expo
// and React Native packages are replaced by the doubles below.
before(() => {
  const program = ts.createProgram(
    [
      path.resolve(__dirname, '../src/player.ts'),
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
    // The playlist API is only loaded on Android.
    'react-native': "module.exports = { Platform: { OS: 'android' } };",
    'expo-crypto': "module.exports = { randomUUID: () => 'random-id' };",
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

// Every case loads fresh modules, so the source registry starts empty. The
// native module doubles record the submitted calls and resolve with the result
// of `results['Module.method']`, if set. They do not prove that native creates,
// loads or destroys anything.
function fixture() {
  const directory = fs.realpathSync(root);
  for (const filename of Object.keys(require.cache)) {
    if (filename.startsWith(`${directory}${path.sep}`)) {
      delete require.cache[filename];
    }
  }
  const { nativeModules } = require(
    path.join(root, 'node_modules/expo-modules-core')
  );
  const calls = [];
  const results = {};
  const moduleListeners = [];
  const nativeModule = (name) =>
    new Proxy(
      {},
      {
        get: (_, method) => {
          if (method === 'addListener') {
            return (eventName, listener) => {
              moduleListeners.push([name, listener]);
              return {
                remove: () => calls.push([`${name}.removeListener`, eventName]),
              };
            };
          }
          return async (...args) => {
            calls.push([`${name}.${method}`, ...args]);
            return results[`${name}.${method}`]?.(...args);
          };
        },
      }
    );
  for (const name of [
    'PlayerModule',
    'SourceModule',
    'DrmModule',
    'PlaylistModule',
  ]) {
    nativeModules[name] = nativeModule(name);
  }
  const callsTo = (...names) => calls.filter(([name]) => names.includes(name));
  const emit = (moduleName, payload) =>
    moduleListeners
      .filter(([name]) => name === moduleName)
      .forEach(([, listener]) => listener(payload));
  const { Player } = require(path.join(root, 'player'));
  const { Source } = require(path.join(root, 'source'));
  return { Player, Source, calls, callsTo, results, emit };
}

const settle = () => new Promise(setImmediate);

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const url = 'https://example.com/a.m3u8';

test('rejects initializing a destroyed source without initializing it natively', async () => {
  const { Source, callsTo } = fixture();
  const source = new Source({ nativeId: 'a', url });
  source.destroy();

  await assert.rejects(source.initialize(), /Source a was destroyed/);

  assert.deepEqual(
    callsTo(
      'SourceModule.initializeWithConfig',
      'SourceModule.initializeWithAnalyticsConfig'
    ),
    []
  );
});

test('destroys a source destroyed while initializing right after its native initialization was sent', async () => {
  const { Player, Source, callsTo, results } = fixture();
  const initialization = deferred();
  results['SourceModule.initializeWithConfig'] = () => initialization.promise;
  results['PlayerModule.source'] = () => 'a';
  const player = new Player({ nativeId: 'player' });
  const source = new Source({ nativeId: 'a', url });

  player.loadSource(source);
  const initialized = source.initialize();
  source.destroy();

  assert.deepEqual(
    callsTo('SourceModule.initializeWithConfig', 'SourceModule.destroy').map(
      ([name, nativeId]) => [name, nativeId]
    ),
    [
      ['SourceModule.initializeWithConfig', 'a'],
      ['SourceModule.destroy', 'a'],
    ]
  );

  initialization.resolve();
  await assert.rejects(initialized, /Source a was destroyed/);
  await settle();

  assert.equal(source.isInitialized, false);
  assert.equal(await player.getSource(), undefined);
  assert.deepEqual(callsTo('PlayerModule.loadSource'), []);
});

test('destroys the DRM config of a failed DRM initialization and initializes it again on retry', async () => {
  const { Source, callsTo, results } = fixture();
  results['DrmModule.initializeWithConfig'] = () => {
    throw new Error('DRM initialization failed');
  };
  const source = new Source({
    nativeId: 'a',
    url,
    drmConfig: { nativeId: 'drm', widevine: { licenseUrl: 'https://drm' } },
  });

  await assert.rejects(source.initialize(), /DRM initialization failed/);
  delete results['DrmModule.initializeWithConfig'];
  await source.initialize();

  assert.deepEqual(
    callsTo(
      'DrmModule.initializeWithConfig',
      'DrmModule.destroy',
      'SourceModule.initializeWithConfig'
    ).map(([name, nativeId]) => [name, nativeId]),
    [
      ['DrmModule.initializeWithConfig', 'drm'],
      ['DrmModule.destroy', 'drm'],
      ['DrmModule.initializeWithConfig', 'drm'],
      ['SourceModule.initializeWithConfig', 'a'],
    ]
  );
  assert.equal(source.isInitialized, true);
  assert.equal(source.drm.isDestroyed, false);
});

test('destroys the DRM config and creates no source when destroyed while its DRM config initializes', async () => {
  const { Source, callsTo, results } = fixture();
  const drmInitialization = deferred();
  results['DrmModule.initializeWithConfig'] = () => drmInitialization.promise;
  const source = new Source({
    nativeId: 'a',
    url,
    drmConfig: { nativeId: 'drm', widevine: { licenseUrl: 'https://drm' } },
  });

  const initialized = source.initialize();
  source.destroy();
  drmInitialization.resolve();
  await assert.rejects(initialized, /Source a was destroyed/);
  await settle();

  assert.deepEqual(
    callsTo(
      'DrmModule.initializeWithConfig',
      'DrmModule.destroy',
      'SourceModule.initializeWithConfig',
      'SourceModule.destroy'
    ).map(([name, nativeId]) => [name, nativeId]),
    [
      ['DrmModule.initializeWithConfig', 'drm'],
      ['SourceModule.destroy', 'a'],
      ['DrmModule.destroy', 'drm'],
    ]
  );
});

test('reuses the DRM config when initializing again after the source creation failed', async () => {
  const { Source, callsTo, results } = fixture();
  results['SourceModule.initializeWithConfig'] = () => {
    throw new Error('Source creation failed');
  };
  const source = new Source({
    nativeId: 'a',
    url,
    drmConfig: { nativeId: 'drm', widevine: { licenseUrl: 'https://drm' } },
  });

  await assert.rejects(source.initialize(), /Source creation failed/);
  delete results['SourceModule.initializeWithConfig'];
  await source.initialize();

  assert.deepEqual(
    callsTo('DrmModule.initializeWithConfig', 'DrmModule.destroy').map(
      ([name, nativeId]) => [name, nativeId]
    ),
    [['DrmModule.initializeWithConfig', 'drm']]
  );
  assert.equal(source.isInitialized, true);
});

test('sends the creation of a source with the nativeId of a destroyed one after its destroy', async () => {
  const { Source, callsTo, results } = fixture();
  const firstInitialization = deferred();
  results['SourceModule.initializeWithConfig'] = () =>
    firstInitialization.promise;
  const first = new Source({ nativeId: 'a', url });
  const second = new Source({ nativeId: 'a', url });

  const firstInitialized = first.initialize();
  first.destroy();
  delete results['SourceModule.initializeWithConfig'];
  await second.initialize();
  firstInitialization.resolve();
  await assert.rejects(firstInitialized, /Source a was destroyed/);

  assert.deepEqual(
    callsTo('SourceModule.initializeWithConfig', 'SourceModule.destroy').map(
      ([name]) => name
    ),
    [
      'SourceModule.initializeWithConfig',
      'SourceModule.destroy',
      'SourceModule.initializeWithConfig',
    ]
  );
  assert.equal(second.isInitialized, true);
});

test('resolves the active source to its initialized instance until it is destroyed', async () => {
  const { Player, Source, results } = fixture();
  results['PlayerModule.source'] = () => 'a';
  const player = new Player({ nativeId: 'player' });
  const source = new Source({ nativeId: 'a', url });

  assert.equal(await player.getSource(), undefined);
  await source.initialize();
  assert.equal(await player.getSource(), source);

  source.destroy();
  assert.equal(await player.getSource(), undefined);
});

test('keeps resolving the first source when another source with its nativeId is initialized', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const { Player, Source, results } = fixture();
  results['PlayerModule.source'] = () => 'a';
  const player = new Player({ nativeId: 'player' });
  const first = new Source({ nativeId: 'a', url });
  const second = new Source({ nativeId: 'a', url });

  await first.initialize();
  await second.initialize();

  assert.equal(warn.mock.callCount(), 1);
  assert.match(
    warn.mock.calls[0].arguments[0],
    /Another source with the same nativeId exists/
  );
  assert.equal(await player.getSource(), first);

  second.destroy();
  assert.equal(await player.getSource(), first);
});

test('resolves the known playlist sources in native order and omits unknown ones', async () => {
  const { Player, Source, results } = fixture();
  results['PlaylistModule.sources'] = () => ['b', 'unknown', 'a'];
  const player = new Player({ nativeId: 'player' });
  const a = new Source({ nativeId: 'a', url });
  const b = new Source({ nativeId: 'b', url });
  await Promise.all([a.initialize(), b.initialize()]);

  const sources = await player.playlist.getSources();

  assert.equal(sources.length, 2);
  assert.equal(sources[0], b);
  assert.equal(sources[1], a);
});

test('destroys the sources of a destroyed player that native returns or it is still loading, then removes its listeners', async () => {
  const { Player, Source, calls, callsTo, results, emit } = fixture();
  const pendingInitialization = deferred();
  results['SourceModule.initializeWithConfig'] = (nativeId) =>
    nativeId.endsWith('pending') ? pendingInitialization.promise : undefined;
  let activeSource;
  results['PlayerModule.source'] = () => activeSource;
  const nativeDestroy = deferred();
  results['PlayerModule.destroy'] = () => nativeDestroy.promise;
  const player = new Player({ nativeId: 'player' });
  const received = [];
  player.on('destroy', (event) => received.push(event));

  player.load({ nativeId: 'created-destroyed', url });
  await settle();
  activeSource = 'created-destroyed';
  (await player.getSource()).destroy();
  player.load({ nativeId: 'created', url });
  await settle();
  activeSource = 'created';
  const created = await player.getSource();
  const session = new Source({ nativeId: 'session', url });
  const kept = new Source({ nativeId: 'kept', url });
  const pending = new Source({ nativeId: 'app-pending', url });
  player.loadSource(session);
  player.loadSource(kept);
  player.load({ nativeId: 'created-pending', url });
  player.loadSource(pending);
  await settle();
  calls.length = 0;

  player.destroy();
  await settle();

  assert.deepEqual(callsTo('PlayerModule.destroy'), [
    ['PlayerModule.destroy', 'player', ['created', 'created-pending']],
  ]);
  const event = { name: 'onDestroy', timestamp: 1 };
  emit('PlayerModule', { nativeId: 'player', eventName: 'destroy', event });
  assert.deepEqual(received, [event]);

  pendingInitialization.resolve();
  await settle();
  assert.deepEqual(
    callsTo(
      'SourceModule.destroy',
      'PlayerModule.loadSource',
      'PlayerModule.removeListener'
    ),
    [
      ['SourceModule.destroy', 'created-pending'],
      ['SourceModule.destroy', 'app-pending'],
    ]
  );

  calls.length = 0;
  nativeDestroy.resolve(['created', 'session', 'unknown']);
  await settle();

  assert.deepEqual(
    callsTo('SourceModule.destroy', 'PlayerModule.removeListener'),
    [
      ['SourceModule.destroy', 'created'],
      ['SourceModule.destroy', 'session'],
      ['PlayerModule.removeListener', 'onPlayerEvent'],
    ]
  );
  assert.equal(created.isDestroyed, true);
  assert.equal(session.isDestroyed, true);
  assert.equal(pending.isDestroyed, true);
  assert.equal(kept.isDestroyed, false);
});

test('throws synchronously when loading a destroyed source', () => {
  const { Player, Source, callsTo } = fixture();
  const player = new Player({ nativeId: 'player' });
  const source = new Source({ nativeId: 'a', url });
  source.destroy();

  assert.throws(() => player.loadSource(source), /Source a was destroyed/);
  assert.deepEqual(
    callsTo('SourceModule.initializeWithConfig', 'PlayerModule.loadSource'),
    []
  );
});

test('rejects adding a destroyed source to the playlist', async () => {
  const { Player, Source, callsTo } = fixture();
  const player = new Player({ nativeId: 'player' });
  const source = new Source({ nativeId: 'a', url });
  source.destroy();

  await assert.rejects(player.playlist.add(source), /Source a was destroyed/);
  assert.deepEqual(callsTo('PlaylistModule.add'), []);
});
