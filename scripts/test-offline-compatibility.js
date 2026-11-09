const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offline-compatibility-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
const compiled = path.join(root, 'compiled');
before(() => {
  const program = ts.createProgram(
    [path.resolve(__dirname, '../src/offline/offlineContentManager.ts')],
    {
      rootDir: path.resolve(__dirname, '../src'),
      outDir: compiled,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      noCheck: true,
      types: [],
    }
  );
  const result = program.emit();
  assert.equal(result.emitSkipped, false);
});

function fixture(t, platform = 'android', isTV = false) {
  const directory = fs.mkdtempSync(path.join(root, 'case-'));
  fs.cpSync(compiled, directory, { recursive: true });
  t.after(() => {
    for (const name of Object.keys(require.cache)) {
      if (name.startsWith(`${directory}${path.sep}`))
        delete require.cache[name];
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  for (const name of ['expo-modules-core', 'expo-crypto', 'react-native']) {
    const location = path.join(directory, 'node_modules', name);
    fs.mkdirSync(location, { recursive: true });
    fs.writeFileSync(path.join(location, 'index.js'), 'module.exports = {};');
  }
  const owners = [];
  const calls = [];
  let sequence = 0;
  const config = {
    nativeId: 'public-label',
    identifier: 'content',
    sourceConfig: { url: 'https://example.com/video.m3u8' },
  };
  require(path.join(directory, 'node_modules/react-native')).Platform = {
    OS: platform,
    isTV,
  };
  require(path.join(directory, 'node_modules/expo-crypto')).randomUUID = () =>
    `generated-${++sequence}`;
  const offlineModule = {
    createEvents: () => {
      const listeners = new Set();
      return {
        addListener: (eventName, listener) => {
          assert.equal(eventName, 'onBitmovinOfflineEvent');
          listeners.add(listener);
          return { remove: () => listeners.delete(listener) };
        },
        emit: (event) => {
          for (const listener of listeners) listener(event);
        },
      };
    },
    create: async (nativeConfig, drm, events) => {
      assert.equal(Object.hasOwn(nativeConfig, 'nativeId'), false);
      const owner = {
        emit: (event) => events.emit(event),
        destroy: async () => calls.push(['destroy', owner]),
      };
      for (const method of [
        'getState',
        'getOptions',
        'download',
        'resume',
        'suspend',
        'cancelDownload',
        'usedStorage',
        'deleteAll',
        'downloadLicense',
        'releaseLicense',
        'renewOfflineLicense',
      ]) {
        owner[method] = async (...args) => {
          calls.push([method, owner, ...args]);
          return method === 'getState'
            ? 'Downloaded'
            : method === 'usedStorage'
              ? 123
              : undefined;
        };
      }
      calls.push(['create', owner, nativeConfig, drm]);
      owners.push(owner);
      return owner;
    },
  };
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).requireNativeModule = (name) =>
    name === 'OfflineModule' ? offlineModule : {};
  const { OfflineContentManager } = require(
    path.join(directory, 'offline/offlineContentManager.js')
  );
  return { OfflineContentManager, config, owners, calls, offlineModule };
}

const operations = {
  state: ['getState'],
  getOptions: ['getOptions'],
  download: ['download', {}],
  resume: ['resume'],
  suspend: ['suspend'],
  cancelDownload: ['cancelDownload'],
  usedStorage: ['usedStorage'],
  deleteAll: ['deleteAll'],
  downloadLicense: ['downloadLicense'],
  releaseLicense: ['releaseLicense'],
  renewOfflineLicense: ['renewOfflineLicense'],
};

for (const lifecycle of ['before initialization', 'after destruction']) {
  test(`Android missing-manager errors ${lifecycle} preserve codes and compatibility labels`, async (t) => {
    const { OfflineContentManager, config, owners } = fixture(t);
    const manager = new OfflineContentManager(config);
    if (lifecycle === 'after destruction') {
      await manager.initialize();
      await manager.destroy();
    }
    const count = owners.length;
    for (const [method, [nativeMethod, ...args]] of Object.entries(
      operations
    )) {
      await assert.rejects(manager[method](...args), (error) => {
        assert.equal(error.code, 'ERR_MANAGER_NOT_FOUND');
        assert.equal(
          error.message,
          `Call to function 'OfflineModule.${nativeMethod}' has been rejected.\n→ Caused by: No offline content manager bridge for id public-label`
        );
        return true;
      });
    }
    assert.equal(
      owners.length,
      count,
      'queries must not create empty native managers'
    );
  });
}

test('first Android destroy before initialization rejects and retains the public destroyed flag', async (t) => {
  const { OfflineContentManager, config, owners } = fixture(t);
  const manager = new OfflineContentManager(config);
  await assert.rejects(manager.destroy(), {
    code: 'ERR_MANAGER_NOT_FOUND',
    message:
      "Call to function 'OfflineModule.release' has been rejected.\n→ Caused by: No offline content manager bridge for id public-label",
  });
  assert.equal(manager.isDestroyed, true);
  assert.equal(manager.isInitialized, false);
  await manager.destroy();
  assert.equal(owners.length, 0);
});

test('Android rejects duplicate IDs without changing alias flags or passing labels natively', async (t) => {
  const { OfflineContentManager, config, owners, calls } = fixture(t);
  const first = new OfflineContentManager(config);
  const alias = new OfflineContentManager(config);
  const aliasEvents = [];
  alias.addListener({ onProgress: (event) => aliasEvents.push(event) });
  await first.initialize();
  await assert.rejects(alias.initialize(), {
    code: 'ERR_MANAGER_ALREADY_EXISTS',
    message:
      "Call to function 'OfflineModule.initializeWithConfig' has been rejected.\n→ Caused by: Content manager bridge id already exists: public-label",
  });
  assert.equal(alias.isInitialized, false);
  assert.equal(alias.isDestroyed, false);
  owners[0].emit({
    identifier: 'content',
    eventType: 'onProgress',
    state: 'Downloading',
    progress: 0.5,
  });
  assert.equal(aliasEvents.length, 1);
  assert.equal(aliasEvents[0].nativeId, 'public-label');
  assert.equal(await alias.state(), 'Downloaded');
  assert.equal(owners.length, 1);
  await alias.destroy();
  await assert.rejects(first.state(), { code: 'ERR_MANAGER_NOT_FOUND' });
  assert.equal(calls.filter(([method]) => method === 'destroy').length, 1);
});

for (const [platform, isTV, state] of [
  ['ios', false, 'NotDownloaded'],
  ['ios', true, null],
]) {
  test(`Apple missing-manager defaults and no-op methods (${isTV ? 'tvOS' : 'iOS'})`, async (t) => {
    const { OfflineContentManager, config, owners } = fixture(
      t,
      platform,
      isTV
    );
    const manager = new OfflineContentManager(config);
    assert.equal(await manager.state(), state);
    assert.equal(await manager.usedStorage(), null);
    for (const [method, [, ...args]] of Object.entries(operations)) {
      if (method === 'state' || method === 'usedStorage') continue;
      assert.equal(await manager[method](...args), undefined);
    }
    await manager.destroy();
    assert.equal(manager.isDestroyed, true);
    assert.equal(owners.length, 0);
  });
}

test('iOS aliases share the backend and public events regain the JS compatibility label', async (t) => {
  const { OfflineContentManager, config, owners } = fixture(t, 'ios');
  const first = new OfflineContentManager(config);
  const alias = new OfflineContentManager(config);
  const received = [];
  first.addListener({ onProgress: (event) => received.push(['first', event]) });
  const unsubscribe = alias.addListener({
    onProgress: (event) => received.push(['alias', event]),
  });
  await first.initialize();
  await alias.initialize();
  assert.equal(owners.length, 1);
  const event = {
    identifier: 'content',
    eventType: 'onProgress',
    state: 'Downloading',
    progress: 0.5,
  };
  owners[0].emit(event);
  assert.deepEqual(received, [
    ['first', { ...event, nativeId: 'public-label' }],
    ['alias', { ...event, nativeId: 'public-label' }],
  ]);
  unsubscribe();
  owners[0].emit(event);
  assert.equal(received.length, 3);
  assert.equal(Object.hasOwn(event, 'nativeId'), false);
  await alias.destroy();
  await first.destroy();
});

test('offline listeners receive events emitted before the configured factory resolves', async (t) => {
  const { OfflineContentManager, config, offlineModule } = fixture(t, 'ios');
  const create = offlineModule.create;
  const event = {
    identifier: 'content',
    eventType: 'onProgress',
    state: 'Downloading',
    progress: 0.25,
  };
  offlineModule.create = async (...args) => {
    args[2].emit(event);
    return create(...args);
  };
  const manager = new OfflineContentManager(config);
  const received = [];
  manager.addListener({ onProgress: (value) => received.push(value) });
  await manager.initialize();
  assert.deepEqual(received, [{ ...event, nativeId: config.nativeId }]);
  await manager.destroy();
});

test('a queued offline event can still reach a surviving alias after another alias is destroyed', async (t) => {
  const { OfflineContentManager, config, owners } = fixture(t, 'ios');
  const first = new OfflineContentManager(config);
  const alias = new OfflineContentManager(config);
  const firstEvents = [],
    aliasEvents = [];
  first.addListener({ onProgress: (value) => firstEvents.push(value) });
  alias.addListener({ onProgress: (value) => aliasEvents.push(value) });
  await first.initialize();
  await alias.initialize();
  const event = {
    identifier: 'content',
    eventType: 'onProgress',
    state: 'Downloading',
    progress: 0.75,
  };
  queueMicrotask(() => owners[0].emit(event));
  await first.destroy();
  assert.deepEqual(firstEvents, []);
  assert.deepEqual(aliasEvents, [{ ...event, nativeId: config.nativeId }]);
  await alias.destroy();
});

test('iOS configured creation failures reject without marking initialized and can be retried', async (t) => {
  const { OfflineContentManager, config, offlineModule, owners } = fixture(
    t,
    'ios'
  );
  const create = offlineModule.create;
  const failure = new Error('SDK manager creation failed');
  let failedEvents;
  offlineModule.create = async (_config, _drm, events) => {
    failedEvents = events;
    throw failure;
  };
  const manager = new OfflineContentManager(config);
  const received = [];
  manager.addListener({ onProgress: (event) => received.push(event) });
  await assert.rejects(manager.initialize(), (error) => error === failure);
  assert.equal(manager.isInitialized, false);
  assert.equal(manager.isDestroyed, false);
  assert.equal(owners.length, 0);
  failedEvents.emit({ eventType: 'onProgress', progress: 1 });
  assert.deepEqual(received, []);
  offlineModule.create = create;
  await manager.initialize();
  assert.equal(manager.isInitialized, true);
  assert.equal(owners.length, 1);
  await manager.destroy();
});
