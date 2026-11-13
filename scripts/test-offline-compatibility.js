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
      target: ts.ScriptTarget.ESNext,
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
  class SharedOfflineEvents {
    listeners = new Set();
    addListener(_name, listener) {
      this.listeners.add(listener);
      return { remove: () => this.listeners.delete(listener) };
    }
    emit(event) {
      for (const listener of this.listeners) listener(event);
    }
  }
  class SharedOfflineContentManager {
    constructor(config, events) {
      this.config = config;
      this.events = events;
      owners.push(this);
    }
    emit(event) {
      this.events.emit(event);
    }
    state() {
      return Promise.resolve('Downloaded');
    }
    destroy() {
      return Promise.resolve();
    }
  }
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).requireNativeModule = () => ({
    SharedOfflineEvents,
    SharedOfflineContentManager,
  });
  const { OfflineContentManager } = require(
    path.join(directory, 'offline/offlineContentManager.js')
  );
  return { OfflineContentManager, config, owners };
}

test('offline aliases share the native manager', async (t) => {
  const { OfflineContentManager, config, owners } = fixture(t);
  const manager = new OfflineContentManager(config);
  const alias = new OfflineContentManager(config);
  assert.equal(await alias.state(), 'Downloaded');
  assert.equal(owners.length, 1);
  assert.equal(owners[0].config, manager.config);
  assert.equal(config.nativeId, 'public-label');
  assert.equal(manager, alias);
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

test('offline operation failures reach callers', async (t) => {
  const { OfflineContentManager, config, owners } = fixture(t);
  const manager = new OfflineContentManager(config);
  const failure = new Error('SDK manager operation failed');
  owners[0].state = async () => {
    throw failure;
  };
  await assert.rejects(manager.state(), (error) => error === failure);
  await manager.destroy();
});
