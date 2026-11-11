const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(
  path.join(os.tmpdir(), 'player-command-completion-')
);
const compiled = path.join(root, 'compiled');
after(() => fs.rmSync(root, { recursive: true, force: true }));
before(() => {
  const program = ts.createProgram(
    [path.resolve(__dirname, '../src/player.ts')],
    {
      rootDir: path.resolve(__dirname, '../src'),
      outDir: compiled,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      noCheck: true,
      types: [],
    }
  );
  assert.equal(program.emit().emitSkipped, false);
});

// Only transport and native acceptance are doubled; playback readiness belongs to Cavy.
function fixture(t, methods = {}) {
  const directory = fs.mkdtempSync(path.join(root, 'case-'));
  fs.cpSync(compiled, directory, { recursive: true });
  t.after(() => {
    for (const key of Object.keys(require.cache)) {
      if (key.startsWith(`${directory}${path.sep}`)) delete require.cache[key];
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const doubles = {
    'react-native': "module.exports = { Platform: { OS: 'android' } };",
    'expo-crypto': "module.exports = { randomUUID: () => 'player-id' };",
    'expo-modules-core': `module.exports = {
      nativeModules: {},
      requireNativeModule(name) {
        return new Proxy({}, { get: (_, key) => module.exports.nativeModules[name]?.[key] });
      }
    };`,
  };
  for (const [name, source] of Object.entries(doubles)) {
    const location = path.join(directory, 'node_modules', name);
    fs.mkdirSync(location, { recursive: true });
    fs.writeFileSync(path.join(location, 'index.js'), source);
  }
  const native = { destroy: async () => {}, ...methods };
  const module = {
    initializeWithConfig: async () => native,
    create: async () => native,
    getSharedPlayer: async () => native,
    destroy: () => native.destroy(),
    addListener: () => ({ remove() {} }),
    on: async () => {},
    off: async () => {},
    isGoogleImaEnabled: true,
  };
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).nativeModules.PlayerModule = module;
  const { Player } = require(path.join(directory, 'player'));
  return { Player, module, native };
}

test('play waits for native command acceptance', async (t) => {
  let accept;
  const pending = new Promise((resolve) => (accept = resolve));
  let notifyInvoked;
  const invoked = new Promise((resolve) => (notifyInvoked = resolve));
  const { Player } = fixture(t, {
    play: () => {
      notifyInvoked();
      return pending;
    },
  });
  const player = new Player();
  await player.initialize();
  let completed = false;
  const playing = player.play().then(() => (completed = true));
  await invoked;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(completed, false);
  accept();
  await playing;
  assert.equal(completed, true);
  await player.destroy();
});

test('seek exposes the native command rejection', async (t) => {
  const failure = new Error('Seek rejected');
  const { Player } = fixture(t, {
    seek: async () => {
      throw failure;
    },
  });
  const player = new Player();
  await player.initialize();
  await assert.rejects(player.seek(10), failure);
  await player.destroy();
});

test('destroy waits for an already-started creation', async (t) => {
  let destroyCalls = 0;
  const { Player, module, native } = fixture(t, {
    destroy: async () => {
      destroyCalls++;
    },
  });
  let completeCreation;
  const create = () =>
    new Promise((resolve) => {
      completeCreation = () => resolve(native);
    });
  module.initializeWithConfig = create;
  module.create = create;
  const player = new Player();
  const creation = player.initialize();
  const destruction = player.destroy();
  await Promise.resolve();
  assert.equal(destroyCalls, 0);
  completeCreation();
  await Promise.all([creation, destruction]);
  assert.equal(destroyCalls, 1);
});
