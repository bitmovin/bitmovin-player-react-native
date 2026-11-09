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

function fixture(t, platform = 'ios') {
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
    OS: platform,
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
    create: async (_config, events) => {
      const owner = {
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
  const { OfflineContentManager } = require(
    path.join(directory, 'offline/offlineContentManager.js')
  );
  return { OfflineContentManager, config, owners, offlineModule };
}

test('Android rejects a duplicate offline manager ID', async (t) => {
  const { OfflineContentManager, config } = fixture(t, 'android');
  const first = new OfflineContentManager(config);
  const alias = new OfflineContentManager(config);
  await first.initialize();
  await assert.rejects(alias.initialize(), {
    code: 'ERR_MANAGER_ALREADY_EXISTS',
  });
  await first.destroy();
});

test('offline progress reaches listeners during creation and through iOS aliases', async (t) => {
  const { OfflineContentManager, config, offlineModule, owners } = fixture(t);
  const event = {
    identifier: 'content',
    eventType: 'onProgress',
    state: 'Downloading',
    progress: 0.5,
  };
  const create = offlineModule.create;
  offlineModule.create = async (...args) => {
    args[1].emit(event);
    return create(...args);
  };
  const first = new OfflineContentManager(config);
  const received = [];
  first.addListener({ onProgress: (value) => received.push(value) });
  await first.state();
  assert.deepEqual(received, [{ ...event, nativeId: config.nativeId }]);

  const alias = new OfflineContentManager(config);
  const aliasEvents = [];
  alias.addListener({ onProgress: (value) => aliasEvents.push(value) });
  await alias.initialize();
  owners[0].emit(event);
  assert.deepEqual(aliasEvents, [{ ...event, nativeId: config.nativeId }]);
  assert.equal(received.length, 2);
  await first.destroy();
  await alias.destroy();
});

test('iOS offline creation errors reject and permit retry', async (t) => {
  const { OfflineContentManager, config, offlineModule } = fixture(t);
  const create = offlineModule.create;
  const failure = new Error('SDK manager creation failed');
  offlineModule.create = async () => {
    throw failure;
  };
  const manager = new OfflineContentManager(config);
  await assert.rejects(manager.state(), (error) => error === failure);
  offlineModule.create = create;
  await manager.initialize();
  assert.equal(await manager.state(), 'Downloaded');
  await manager.destroy();
});
