const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Only Expo transport is mocked. These checks prove JS callback forwarding.
function fixture(t) {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-handlers-'));
  t.after(() => {
    for (const file of Object.keys(require.cache)) {
      if (file.startsWith(output + path.sep)) delete require.cache[file];
    }
    fs.rmSync(output, { recursive: true, force: true });
  });
  const source = path.resolve(__dirname, '../src');
  const program = ts.createProgram(
    ['fullscreenHandlerBridge.ts', 'customMessageHandlerBridge.ts'].map(
      (file) => path.join(source, 'ui', file)
    ),
    {
      rootDir: source,
      outDir: output,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      noCheck: true,
      types: [],
    }
  );
  assert.equal(program.emit().emitSkipped, false);
  const expo = path.join(output, 'node_modules/expo-modules-core');
  fs.mkdirSync(expo, { recursive: true });
  fs.writeFileSync(path.join(expo, 'index.js'), 'module.exports = {};');
  const callbacks = new WeakMap();
  require(expo).requireNativeModule = () => ({
    create(callback) {
      const native = {
        setIsFullscreenActive: async () => {},
        sendMessage: async () => {},
        destroy: async () => callbacks.delete(native),
      };
      callbacks.set(native, callback);
      return native;
    },
  });
  return {
    FullscreenHandlerBridge: require(
      path.join(output, 'ui/fullscreenHandlerBridge')
    ).FullscreenHandlerBridge,
    CustomMessageHandlerBridge: require(
      path.join(output, 'ui/customMessageHandlerBridge')
    ).CustomMessageHandlerBridge,
    dispatch: (native, operation, args = []) =>
      callbacks.get(native)(operation, args),
  };
}

test('fullscreen callbacks reach the current JS handler', (t) => {
  const { FullscreenHandlerBridge, dispatch } = fixture(t);
  const bridge = new FullscreenHandlerBridge();
  const handler = {
    isFullscreenActive: false,
    enterFullscreen() {
      this.isFullscreenActive = true;
    },
    exitFullscreen() {
      this.isFullscreenActive = false;
    },
  };
  bridge.setFullscreenHandler(handler);
  assert.equal(dispatch(bridge.native, 'enterFullscreen'), true);
  assert.equal(dispatch(bridge.native, 'exitFullscreen'), false);
  bridge.destroy();
});

test('custom messages preserve synchronous replies and async delivery', (t) => {
  const { CustomMessageHandlerBridge, dispatch } = fixture(t);
  const bridge = new CustomMessageHandlerBridge();
  const received = [];
  bridge.setCustomMessageHandler({
    receivedSynchronousMessage: (message, data) => `${message}:${data}`,
    receivedAsynchronousMessage: (...args) => received.push(args),
  });
  assert.equal(
    dispatch(bridge.native, 'synchronousMessage', ['get', 'value']),
    'get:value'
  );
  dispatch(bridge.native, 'asynchronousMessage', ['notify', 'value']);
  assert.deepEqual(received, [['notify', 'value']]);
  bridge.destroy();
});
