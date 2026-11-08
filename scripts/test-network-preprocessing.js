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
  let callback;
  let destroyed = false;
  const native = {
    destroy: async () => {
      destroyed = true;
    },
  };
  const bridge = {
    create: (serialized, handler) => {
      assert.equal(Object.hasOwn(serialized, 'nativeId'), false);
      callback = handler;
      return native;
    },
  };
  require(
    path.join(directory, 'node_modules/expo-modules-core')
  ).requireNativeModule = (name) => {
    if (name === 'NetworkModule') return bridge;
    assert.equal(name, 'NativeCallbacksModule');
    return {};
  };
  const { Network, HttpRequestType } = require(path.join(directory, 'network'));
  const helpers = require(path.join(directory, 'nativeCallbacks.js'));
  const network = new Network(config);
  t.after(() => network.destroy());
  const invoke = (kind, type, payload) => {
    callback(`preprocessHttp${kind}`, [type, payload], {
      resolve: (result) => {
        const operation = { kind, payload: result };
        attempts.push(operation);
        // This fixture models completion before the synchronous resolve failure.
        completions.push(operation);
        if (rejectAfterCompletion) throw nativeError;
      },
    });
  };
  return {
    network,
    invoke,
    attempts,
    completions,
    HttpRequestType,
    helpers,
    isDestroyed: () => destroyed,
  };
}

test('network configuration owners do not generate compatibility IDs', async (t) => {
  const { network } = fixture(t, {});
  assert.equal('nativeId' in network, false);
  await network.initialize();
  assert.equal('nativeId' in network, false);
});

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
        const { network, invoke, attempts, completions, HttpRequestType } =
          fixture(t, config, rejectAfterCompletion);
        await network.initialize();
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

test('direct callbacks settle synchronous values before returning and normalize failures', async (t) => {
  const { helpers } = fixture(t, {});
  const values = [];
  const completion = { resolve: (value) => values.push(value) };
  const callback = helpers.nativeCallback({
    value: () => 42,
    absent: () => undefined,
    throws: () => {
      throw new Error('failure');
    },
    rejects: () => Promise.reject(new Error('failure')),
  });
  callback('value', [], completion);
  assert.deepEqual(values, [42]);
  callback('absent', [], completion);
  callback('throws', [], completion);
  callback('missing', [], completion);
  assert.deepEqual(values, [42, null, null, null]);
  callback('rejects', [], completion);
  await new Promise(setImmediate);
  assert.deepEqual(values, [42, null, null, null, null]);
});

test('configuration serialization removes compatibility labels while preserving arbitrary data', (t) => {
  const { helpers } = fixture(t, {});
  const metadata = {
    nativeId: 'metadata-value',
    networkConfig: { nativeId: 'data-value' },
  };
  const config = {
    nativeId: 'player',
    networkConfig: { preprocessHttpRequest: () => {} },
    playbackConfig: { decoderConfig: {} },
    sourceConfig: {
      nativeId: 'source',
      drmConfig: {},
      metadata,
    },
    metadata,
    customData: { nativeId: 'custom-data' },
    headers: { nativeId: 'header' },
  };
  assert.deepEqual(helpers.serializeNativeConfig(config), {
    networkConfig: { preprocessHttpRequest: true },
    playbackConfig: { decoderConfig: {} },
    sourceConfig: { drmConfig: {}, metadata },
    metadata,
    customData: { nativeId: 'custom-data' },
    headers: { nativeId: 'header' },
  });
  assert.equal(config.nativeId, 'player');
});

test('synchronous callbacks return scalars and structured values without a completion object', (t) => {
  const { helpers } = fixture(t, {});
  const structured = [{ name: 'decoder', isSoftware: false }];
  const callback = helpers.nativeCallback({
    decision: () => false,
    text: () => 'prepared',
    structured: () => structured,
    absent: () => undefined,
    throws: () => {
      throw new Error('synchronous failure');
    },
  });
  assert.equal(callback('decision', []), false);
  assert.equal(callback('text', []), 'prepared');
  assert.equal(callback('structured', []), structured);
  assert.equal(callback('absent', []), null);
  assert.equal(callback('throws', []), null);
});

test('synchronous callbacks fall back for promises and consume rejected notifications', async (t) => {
  const { helpers } = fixture(t, {});
  const callback = helpers.nativeCallback({
    resolves: () => Promise.resolve(false),
    rejects: () => Promise.reject(new Error('asynchronous failure')),
  });
  assert.equal(callback('resolves', []), null);
  assert.equal(callback('rejects', []), null);
  await new Promise(setImmediate);
});
