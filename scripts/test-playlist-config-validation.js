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
});

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
const source = (nativeId, isDestroyed = false) => ({ nativeId, isDestroyed });

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

test('throws for a destroyed source and names it', () => {
  const { validatePlaylistConfig } = load();
  assert.throws(
    () => validatePlaylistConfig({ sources: [source('a'), source('b', true)] }),
    /Source b was destroyed/
  );
});
