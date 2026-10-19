const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

// Run the real TypeScript handlers in Node; only the Expo boundary is mocked.
function fixture(config, completionFails = false) {
  const listeners = new Map();
  const submissions = [];
  const logs = [];
  const complete = (kind, id, payload) => {
    submissions.push({ kind, id, payload });
    return completionFails && submissions.length === 1
      ? Promise.reject(new Error('native completion failed'))
      : Promise.resolve();
  };
  const bridge = {
    addListener: (name, listener) => {
      listeners.set(name, listener);
      return { remove() {} };
    },
    initializeWithConfig: async () => {},
    setPreprocessedHttpRequest: (id, payload) =>
      complete('Request', id, payload),
    setPreprocessedHttpResponse: (id, payload) =>
      complete('Response', id, payload),
  };
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const { outputText } = ts.transpileModule(
      fs.readFileSync(filename, 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
        fileName: filename,
      }
    );
    const localRequire = (name) => {
      if (name === 'expo-modules-core') {
        return {
          requireNativeModule: (moduleName) => {
            assert.equal(moduleName, 'NetworkModule');
            return bridge;
          },
        };
      }
      if (name === 'expo-crypto') return { randomUUID: () => 'network-id' };
      if (name === '../debug') {
        return { DebugConfig: { log: (...args) => logs.push(args) } };
      }
      const resolved = path.resolve(path.dirname(filename), name);
      return load(
        fs.existsSync(`${resolved}.ts`)
          ? `${resolved}.ts`
          : path.join(resolved, 'index.ts')
      );
    };
    vm.runInThisContext(
      `(function(require, module, exports) {${outputText}\n})`,
      { filename }
    )(localRequire, module, module.exports);
    return module.exports;
  }
  const { Network, HttpRequestType } = load(
    path.resolve(__dirname, '../src/network/index.ts')
  );
  const network = new Network(config);
  return { network, listeners, submissions, logs, HttpRequestType };
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
    for (const completionFails of [false, true]) {
      test(`${kind}: ${behavior}, native completion ${completionFails ? 'rejects' : 'resolves'}`, async () => {
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
        const { network, listeners, submissions, HttpRequestType } = fixture(
          config,
          completionFails
        );
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
        assert.equal(submissions.length, 0);

        assert.doesNotThrow(() => listener(event));
        // Drain callback and completion promises, including rejection handlers.
        await new Promise(setImmediate);
        assert.equal(submissions.length, 1);
        assert.equal(submissions[0].kind, kind);
        assert.equal(submissions[0].id, 'completion-id');
        assert.equal(
          submissions[0].payload,
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
