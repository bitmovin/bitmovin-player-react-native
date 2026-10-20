const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'network-preprocessing-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
const compiled = path.join(root, 'compiled');
// Emit the handler's import graph once, without Expo's app build or typecheck.
// Node resolves and loads the emitted CommonJS files normally.
before(() => {
  const program = ts.createProgram(
    [path.resolve(__dirname, '../src/network/index.ts')],
    {
      rootDir: path.resolve(__dirname, '../src'),
      outDir: compiled,
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

// Each case gets separate Node module state and explicit Expo boundary doubles.
function fixture(t, config, rejectAfterCompletion = false) {
  const directory = fs.mkdtempSync(path.join(root, 'case-'));
  t.after(() => {
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(`${directory}${path.sep}`)) {
        delete require.cache[filename];
      }
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  fs.cpSync(compiled, directory, { recursive: true });
  for (const name of ['expo-modules-core', 'expo-crypto']) {
    const packageDirectory = path.join(directory, 'node_modules', name);
    fs.mkdirSync(packageDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(packageDirectory, 'index.js'),
      'module.exports = {};'
    );
  }
  const listeners = new Map();
  const attempts = [];
  const completions = [];
  const logs = [];
  const nativeError = new Error('native rejected after completing operation');
  const complete = (kind, id, payload) => {
    const operation = { kind, id, payload };
    attempts.push(operation);
    // Model native completion BEFORE rejection. A pre-completion failure (e.g.
    // Android invalid Base64 conversion) can still leave native work pending.
    completions.push(operation);
    return rejectAfterCompletion
      ? Promise.reject(nativeError)
      : Promise.resolve();
  };
  const bridge = {
    addListener: (name, listener) => {
      listeners.set(name, listener);
      return { remove: () => listeners.delete(name) };
    },
    initializeWithConfig: async () => {},
    destroy: async () => {},
    setPreprocessedHttpRequest: (id, payload) =>
      complete('Request', id, payload),
    setPreprocessedHttpResponse: (id, payload) =>
      complete('Response', id, payload),
  };
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).requireNativeModule = (name) => {
    if (name === 'NetworkModule') return bridge;
    assert.equal(name, 'DebugModule');
    return { setDebugLoggingEnabled: async () => {} };
  };
  require(path.join(directory, 'node_modules/expo-crypto')).randomUUID = () =>
    'network-id';
  const { DebugConfig } = require(path.join(directory, 'debug.js'));
  t.mock.method(DebugConfig, 'log', (...args) => logs.push(args));
  const { Network, HttpRequestType } = require(path.join(directory, 'network'));
  const network = new Network(config);
  t.after(() => network.destroy());
  return {
    network,
    listeners,
    attempts,
    completions,
    logs,
    nativeError,
    HttpRequestType,
  };
}

const request = {
  url: 'https://example.com/manifest.mpd',
  method: 'GET',
  headers: { Authorization: 'original' },
  body: 'cmVxdWVzdA==',
};
const response = {
  url: request.url,
  headers: { 'Content-Type': 'application/dash+xml' },
  body: 'cmVzcG9uc2U=',
  status: 200,
  request,
};

for (const [kind, original] of [
  ['Request', request],
  ['Response', response],
]) {
  for (const behavior of [
    'success',
    'throw',
    'reject',
    'missing',
    'no config',
  ]) {
    for (const rejectAfterCompletion of [false, true]) {
      test(`${kind}: ${behavior}, native ${rejectAfterCompletion ? 'rejects after completion' : 'resolves'}`, async (t) => {
        const transformed = { ...original, headers: { Changed: 'yes' } };
        const callbackCalls = [];
        const config =
          behavior === 'no config'
            ? undefined
            : behavior === 'missing'
              ? {}
              : {
                  [`preprocessHttp${kind}`]: function (type, payload) {
                    callbackCalls.push({ receiver: this, type, payload });
                    if (behavior === 'throw') throw new Error('callback threw');
                    if (behavior === 'reject') {
                      return Promise.reject(new Error('callback rejected'));
                    }
                    return Promise.resolve(transformed);
                  },
                };
        const {
          network,
          listeners,
          attempts,
          completions,
          logs,
          nativeError,
          HttpRequestType,
        } = fixture(t, config, rejectAfterCompletion);
        await network.initialize();
        const event = {
          nativeId: network.nativeId,
          [`${kind.toLowerCase()}Id`]: 'completion-id',
          type: HttpRequestType.ManifestDash,
          [kind.toLowerCase()]: original,
        };
        const listener = listeners.get(`onPreprocessHttp${kind}`);
        listener({ ...event, nativeId: 'another-network' });
        await new Promise(setImmediate);
        assert.equal(callbackCalls.length, 0);
        assert.equal(attempts.length, 0);
        assert.equal(completions.length, 0);

        assert.doesNotThrow(() => listener(event));
        // Drain callback and completion promises, including rejection handlers.
        await new Promise(setImmediate);
        assert.equal(attempts.length, 1);
        assert.equal(completions.length, 1);
        assert.equal(completions[0].kind, kind);
        assert.equal(completions[0].id, 'completion-id');
        assert.equal(
          completions[0].payload,
          behavior === 'success' ? transformed : original
        );
        const failureLogs = logs.filter(([message]) =>
          message.startsWith('Failed to complete HTTP')
        );
        assert.deepEqual(
          failureLogs,
          rejectAfterCompletion
            ? [
                [
                  `Failed to complete HTTP ${kind.toLowerCase()} preprocessing:`,
                  nativeError,
                ],
              ]
            : []
        );
        if (behavior !== 'missing' && behavior !== 'no config') {
          assert.equal(callbackCalls.length, 1);
          assert.equal(callbackCalls[0].receiver, config);
          assert.equal(callbackCalls[0].type, HttpRequestType.ManifestDash);
          assert.equal(callbackCalls[0].payload, original);
        }
      });
    }
  }
}
