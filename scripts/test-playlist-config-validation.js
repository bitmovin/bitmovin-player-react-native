const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'playlist-config-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
// Emit the validation's import graph once, without Expo's app build or typecheck.
before(() => {
  const program = ts.createProgram(
    [path.resolve(__dirname, '../src/playlist/validatePlaylistConfig.ts')],
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
  // Each test sets the platform it needs.
  const reactNative = path.join(root, 'node_modules', 'react-native');
  fs.mkdirSync(reactNative, { recursive: true });
  fs.writeFileSync(
    path.join(reactNative, 'index.js'),
    "module.exports = { Platform: { OS: 'android' } };"
  );
});

const setPlatform = (os) => {
  require(path.join(root, 'node_modules', 'react-native')).Platform.OS = os;
};

const load = () => {
  const { validatePlaylistConfig } = require(
    path.join(root, 'playlist', 'validatePlaylistConfig.js')
  );
  const { ReplayMode } = require(
    path.join(root, 'playlist', 'playlistConfig.js')
  );
  return { validatePlaylistConfig, ReplayMode };
};

// Source doubles only carry what the validation reads.
const source = (nativeId, options = {}) => ({
  nativeId,
  isDestroyed: options.isDestroyed ?? false,
  // `type` can be set to `undefined` explicitly, for a config without a type.
  config: { type: 'type' in options ? options.type : 'hls' },
});

test('accepts a playlist with sources and a known replay mode', () => {
  const { validatePlaylistConfig, ReplayMode } = load();
  validatePlaylistConfig({ sources: [source('a'), source('b')] });
  for (const replayMode of Object.values(ReplayMode)) {
    validatePlaylistConfig({ sources: [source('a')], options: { replayMode } });
  }
});

test('throws for a playlist without sources', () => {
  const { validatePlaylistConfig } = load();
  assert.throws(
    () => validatePlaylistConfig({ sources: [] }),
    /Playlist config has no sources/
  );
});

test('throws for an unknown replay mode', () => {
  const { validatePlaylistConfig } = load();
  assert.throws(
    () =>
      validatePlaylistConfig({
        sources: [source('a')],
        options: { replayMode: 'unknown' },
      }),
    /Unknown replay mode: unknown/
  );
});

test('throws for a source listed more than once and names it', () => {
  const { validatePlaylistConfig } = load();
  const duplicate = source('b');
  assert.throws(
    () =>
      validatePlaylistConfig({ sources: [source('a'), duplicate, duplicate] }),
    /A source is part of the playlist more than once/
  );
});

test('throws for a source type that iOS cannot play in a playlist', () => {
  const { validatePlaylistConfig } = load();
  setPlatform('ios');
  try {
    validatePlaylistConfig({
      sources: [source('a'), source('b', { type: 'progressive' })],
    });
    for (const type of ['dash', 'none', undefined]) {
      assert.throws(
        () =>
          validatePlaylistConfig({
            sources: [source('a'), source('b', { type })],
          }),
        /Only HLS and progressive sources are supported in an iOS playlist/
      );
    }
  } finally {
    setPlatform('android');
  }
});

test('accepts every source type on Android', () => {
  const { validatePlaylistConfig } = load();
  validatePlaylistConfig({
    sources: [source('a', { type: 'dash' }), source('b', { type: undefined })],
  });
});
