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
    [
      path.resolve(__dirname, '../src/network/index.ts'),
      path.resolve(__dirname, '../src/nativeCallbacks.ts'),
    ],
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
  for (const name of ['expo-modules-core']) {
    const packageDirectory = path.join(directory, 'node_modules', name);
    fs.mkdirSync(packageDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(packageDirectory, 'index.js'),
      'module.exports = {};'
    );
  }
  const attempts = [];
  const completions = [];
  const nativeError = new Error('native threw after completing operation');
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).requireNativeModule = (name) => {
    assert.equal(name, 'NativeCallbacksModule');
    return {};
  };
  const { HttpRequestType } = require(path.join(directory, 'network'));
  const helpers = require(path.join(directory, 'nativeCallbacks.js'));
  const callback = helpers.configurationCallback({ networkConfig: config });
  const invoke = (kind, type, payload) => {
    callback(
      `networkConfig.preprocessHttp${kind}`,
      [type, payload],
      {
        resolve: (result) => {
          const operation = { kind, payload: result };
          attempts.push(operation);
          // This fixture models completion before the synchronous resolve failure.
          completions.push(operation);
          if (rejectAfterCompletion) throw nativeError;
        },
      },
      false,
      1
    );
  };
  return {
    invoke,
    attempts,
    completions,
    HttpRequestType,
    helpers,
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
      test(`${kind}: ${behavior}, native ${rejectAfterCompletion ? 'throws after completion' : 'resolves'}`, async (t) => {
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
        const { invoke, attempts, completions, HttpRequestType } = fixture(
          t,
          config,
          rejectAfterCompletion
        );
        assert.doesNotThrow(() =>
          invoke(kind, HttpRequestType.ManifestDash, original)
        );
        await new Promise(setImmediate);
        assert.equal(attempts.length, 1);
        assert.equal(completions.length, 1);
        assert.equal(completions[0].kind, kind);
        assert.equal(
          completions[0].payload,
          behavior === 'success' ? transformed : original
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

test('configuration paths route newly added nested callbacks without registration', (t) => {
  const { helpers } = fixture(t, {});
  const config = { provider: { choose: () => false } };
  const callback = helpers.configurationCallback(config);
  assert.equal(callback('provider.choose', []), false);
  config.provider.choose = () => true;
  assert.equal(callback('provider.choose', []), true);
});

test('mutation callbacks preserve settings changes and partial returned settings', (t) => {
  const { helpers } = fixture(t, {});
  const callback = helpers.configurationCallback(
    {
      ima: {
        beforeInitialization(settings) {
          settings.language = 'de';
          return { playerType: 'custom' };
        },
      },
    },
    { capture: 'ima' }
  );
  assert.deepEqual(
    callback(
      'ima.beforeInitialization',
      [{ language: 'en', autoPlay: false }],
      undefined,
      true
    ),
    {
      language: 'de',
      autoPlay: false,
      playerType: 'custom',
    }
  );
});

test('synchronous decisions fall back for unexpected promises and consume rejection', async (t) => {
  const { helpers } = fixture(t, {});
  const callback = helpers.configurationCallback({
    decision: () => Promise.reject(new Error('unexpected async decision')),
  });
  assert.equal(callback('decision', []), null);
  await new Promise(setImmediate);
});

test('configuration labels are removed without stripping content metadata', (t) => {
  const { helpers } = fixture(t, {});
  const metadata = { nativeId: 'user-data' };
  assert.deepEqual(
    helpers.serializeNativeConfig({
      nativeId: 'binding-label',
      sourceConfig: { nativeId: 'source-label', metadata },
      networkConfig: { preprocessHttpRequest: () => {} },
    }),
    {
      sourceConfig: { metadata },
      networkConfig: { preprocessHttpRequest: true },
    }
  );
});
