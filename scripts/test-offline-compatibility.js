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

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offline-compatibility-'));
const compiled = path.join(root, 'compiled');
after(() => fs.rmSync(root, { recursive: true, force: true }));
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
  assert.equal(program.emit().emitSkipped, false);
});

function fixture(t) {
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
  require(path.join(directory, 'node_modules/react-native')).Platform = {
    OS: 'ios',
    isTV: false,
  };
  const config = {
    nativeId: 'public-label',
    identifier: 'content',
    sourceConfig: { url: 'https://example.com/video.m3u8', type: 'hls' },
  };
  const owners = [];
  const offlineModule = {
    createEvents: () => {
      const listeners = new Set();
      return {
        addListener: (_name, listener) => {
          listeners.add(listener);
          return { remove: () => listeners.delete(listener) };
        },
        emit: (event) => {
          for (const listener of listeners) listener(event);
        },
      };
    },
    create: async (config, events) => {
      const owner = {
        config,
        events,
        emit: (event) => events.emit(event),
        getState: async () => 'Downloaded',
        destroy: async () => {},
      };
      owners.push(owner);
      return owner;
    },
  };
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).requireNativeModule = (name) =>
    name === 'OfflineModule' ? offlineModule : {};
  installNativeClasses({ OfflineModule: offlineModule });
  const { OfflineContentManager } = require(
    path.join(directory, 'offline/offlineContentManager.js')
  );
  return { OfflineContentManager, config, owners, offlineModule };
}

test('offline aliases share the native manager', async (t) => {
  const { OfflineContentManager, config, owners } = fixture(t);
  const manager = new OfflineContentManager(config);
  const alias = new OfflineContentManager(config);
  assert.equal(await alias.state(), 'Downloaded');
  assert.equal(owners.length, 1);
  assert.equal(Object.hasOwn(owners[0].config, 'nativeId'), false);
  assert.equal(config.nativeId, 'public-label');
  assert.equal(manager, alias);
  assert.equal(await controlFor(manager), await controlFor(alias));
  await manager.destroy();
  await alias.destroy();
});

test('offline progress reaches listeners with the public nativeId', async (t) => {
  const { OfflineContentManager, config, owners } = fixture(t);
  const manager = new OfflineContentManager(config);
  const received = [];
  const unsubscribe = manager.addListener({
    onProgress: (event) => received.push(event),
  });
  await manager.state();
  const event = { eventType: 'onProgress', progress: 0.5 };
  owners[0].emit(event);
  assert.deepEqual(received, [{ ...event, nativeId: config.nativeId }]);
  unsubscribe();
  owners[0].emit(event);
  assert.equal(received.length, 1);
  await manager.destroy();
});

test('offline creation failures reach callers', async (t) => {
  const { OfflineContentManager, config, offlineModule } = fixture(t);
  const failure = new Error('SDK manager creation failed');
  offlineModule.create = async () => {
    throw failure;
  };
  await assert.rejects(
    new OfflineContentManager(config).state(),
    (error) => error === failure
  );
});
