const {
  installNativeClasses,
  controlFor,
} = require('./helpers/native-class-doubles');
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
    ['fullscreenHandlerBridge.ts', 'customMessageHandler.ts'].map((file) =>
      path.join(source, 'ui', file)
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
  const transport = {
    create(config, callback) {
      if (callback == null) {
        callback = config;
        config = undefined;
      }
      const native = {
        setIsFullscreenActive: async () => {},
        sendMessage: async () => {},
        destroy: async () => callbacks.delete(native),
      };
      callbacks.set(native, { config, callback });
      return native;
    },
  };
  const modules = {
    NativeCallbacksModule: {},
    FullscreenHandlerModule: transport,
    CustomMessageHandlerModule: transport,
  };
  installNativeClasses(modules);
  require(expo).requireNativeModule = (name) => modules[name];
  return {
    FullscreenHandlerBridge: require(
      path.join(output, 'ui/fullscreenHandlerBridge')
    ).FullscreenHandlerBridge,
    CustomMessageHandler: require(path.join(output, 'ui/customMessageHandler'))
      .CustomMessageHandler,
    dispatch: (native, operation, args = []) =>
      callbacks
        .get(native)
        .callback(callbacks.get(native).config?.[operation] ?? operation, args),
  };
}

test('fullscreen callbacks reach the current JS handler', async (t) => {
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
  const native = await controlFor(bridge);
  Object.freeze(bridge);
  assert.equal(dispatch(native, 'enterFullscreen'), true);
  assert.equal(dispatch(native, 'exitFullscreen'), false);
  await bridge.destroy();
});

test('custom messages preserve synchronous replies and async delivery', async (t) => {
  const { CustomMessageHandler, dispatch } = fixture(t);
  const received = [];
  const handler = new CustomMessageHandler({
    onReceivedSynchronousMessage: (message, data) => `${message}:${data}`,
    onReceivedAsynchronousMessage: (...args) => received.push(args),
  });
  const native = await controlFor(handler);
  Object.freeze(handler);
  assert.equal(
    dispatch(native, 'synchronousMessage', ['get', 'value']),
    'get:value'
  );
  dispatch(native, 'asynchronousMessage', ['notify', 'value']);
  assert.deepEqual(received, [['notify', 'value']]);
  await handler.destroy();
});
