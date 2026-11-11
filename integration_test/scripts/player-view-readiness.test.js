// Regression coverage for the public PlayerView callback across Fabric mount ordering.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { createRequire } = require('node:module');
const root = path.join(__dirname, '../node_modules');
const req = createRequire(root + '/react/package.json');
const React = req('react');
const ts = req('typescript');
const scheduler = req('scheduler/unstable_mock');
let committedView;
const bindings = new Map();
function playerWith() {
  return {
    config: {},
    on: async () => mockEventSubscription(),
  };
}
const viewConfig = {
  uiViewClassName: 'ProbePlayerView',
  validAttributes: { style: true, isFullscreenRequested: true },
  directEventTypes: {},
  bubblingEventTypes: {},
};
const registry = {
  get: () => viewConfig,
  customBubblingEventTypes: {},
  customDirectEventTypes: {},
};
const privateInterface = {
  ReactNativeViewConfigRegistry: registry,
  ReactFiberErrorDialog: { showErrorDialog: () => true },
  RawEventEmitter: { emit() {} },
  createPublicRootInstance: (tag) => ({ tag }),
  createPublicInstance: (tag, config, handle) => ({
    tag,
    handle,
    attachBindings(player, fullscreen, custom, config) {
      return new Promise((resolve, reject) =>
        bindings.set(tag, {
          player,
          fullscreen,
          custom,
          config,
          resolve,
          reject,
        })
      );
    },
  }),
  createAttributePayload: (props) => props,
  diffAttributePayloads: (old, next) => next,
  deepFreezeAndThrowOnMutationInDev() {},
};
const nativeFabricUIManager = {
  createNode: (tag, name, root, props, handle) => ({
    tag,
    name,
    props,
    handle,
    children: [],
  }),
  cloneNodeWithNewChildren: (n) => ({ ...n, children: [] }),
  cloneNodeWithNewProps: (n, props) => ({ ...n, props }),
  cloneNodeWithNewChildrenAndProps: (n, props) => ({
    ...n,
    props,
    children: [],
  }),
  createChildSet: () => [],
  appendChild: (parent, child) => parent.children.push(child),
  appendChildToSet: (set, child) => set.push(child),
  completeRoot: (tag, children) => {
    committedView = children[0];
  },
  registerEventHandler() {},
  unstable_getCurrentEventPriority: () => 0,
};
const rendererModule = { exports: {} };
const rendererContext = vm.createContext({
  __DEV__: true,
  console,
  setTimeout,
  clearTimeout,
  setImmediate,
  queueMicrotask,
  performance,
  nativeFabricUIManager,
  module: rendererModule,
  exports: rendererModule.exports,
  require(name) {
    if (name === 'react') return React;
    if (name === 'scheduler') return scheduler;
    if (name.endsWith('ReactNativePrivateInitializeCore')) return {};
    if (name.endsWith('ReactNativePrivateInterface')) return privateInterface;
    throw new Error('Unexpected renderer dependency: ' + name);
  },
});
vm.runInContext(
  fs.readFileSync(
    root +
      '/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js',
    'utf8'
  ),
  rendererContext
);
const source = fs.readFileSync(
  path.join(__dirname, '../../src/components/PlayerView/index.tsx'),
  'utf8'
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const playerViewModule = { exports: {} };
const viewWarnings = [];
const playerViewContext = vm.createContext({
  console: { ...console, warn: (...values) => viewWarnings.push(values) },
  module: playerViewModule,
  exports: playerViewModule.exports,
  require(name) {
    if (name === 'react' || name === 'react/jsx-runtime') return req(name);
    if (name === 'react-native')
      return {
        Platform: { OS: 'ios' },
        StyleSheet: { create: (x) => x, flatten: (x) => x },
      };
    if (name === 'expo-keep-awake') return { useKeepAwake() {} };
    if (name === './native') return { NativePlayerView: 'ProbePlayerView' };
    if (name.endsWith('/useProxy')) return { useProxy: () => (x) => x };
    if (name.endsWith('/fullscreenHandlerBridge'))
      return {
        FullscreenHandlerBridge: class {
          setFullscreenHandler(handler) {
            this.handler = handler;
          }
          async destroy() {
            this.destroyed = true;
          }
        },
      };
    if (name.endsWith('/customMessageHandlerBridge')) return {};
    if (name.endsWith('/metadataPlatform')) return {};
    throw new Error('Unexpected PlayerView dependency: ' + name);
  },
});
vm.runInContext(compiled, playerViewContext);
const { PlayerView } = playerViewModule.exports;
// Use the installed Fabric renderer for real effect/ref ordering.
// Only native attachment acceptance and failure are controlled here.
const attachedViews = new Set();
async function flush(attach = true) {
  for (let i = 0; i < 6; i++) {
    scheduler.unstable_flushAllWithoutAsserting();
    if (attach && committedView && !attachedViews.has(committedView.tag)) {
      attachedViews.add(committedView.tag);
      committedView.handle.memoizedProps.onBmpViewAttached?.({
        nativeEvent: {},
      });
    }
    await new Promise(setImmediate);
  }
}

async function mockEventSubscription() {
  return { remove() {} };
}

function render(props) {
  rendererModule.exports.render(
    React.createElement(PlayerView, props),
    11,
    null,
    true,
    {
      onUncaughtError: (error) => {
        throw error;
      },
    }
  );
}

function acknowledge(request = bindings.get(committedView.tag)) {
  request?.resolve();
}

test.afterEach(async () => {
  rendererModule.exports.render(null, 11, null, true, {});
  await flush();
  bindings.clear();
  viewWarnings.length = 0;
});

test('readiness waits for native attachment and is announced once', async () => {
  let notifications = 0;
  const viewRef = { current: null };
  const player = playerWith();
  const props = {
    player,
    viewRef,
    onPlayerViewReady: () => {
      assert.ok(viewRef.current, 'the public ref is available in the callback');
      notifications++;
    },
  };
  render(props);
  await flush(false);
  assert.equal(
    bindings.size,
    0,
    'layout/ref availability does not prove platform attachment'
  );
  await flush();
  assert.ok(
    committedView,
    'the native host mounts without a JS initialization stage'
  );
  assert.equal(bindings.get(committedView.tag).player, player);
  for (const prop of ['player', 'fullscreenHandler', 'customMessageHandler'])
    assert.equal(Object.hasOwn(committedView.props, prop), false);
  assert.equal(
    notifications,
    0,
    'JS effects cannot announce native acceptance'
  );
  acknowledge();
  await flush();
  acknowledge();
  await flush();
  assert.equal(notifications, 1, 'duplicate acknowledgments are ignored');

  render({
    ...props,
    config: {},
    onPlayerViewReady: () => (notifications += 10),
  });
  await flush();
  acknowledge();
  await flush();
  assert.equal(
    notifications,
    1,
    'callback/config changes do not repeat readiness'
  );

  const silent = playerWith();
  render({ player: silent });
  await flush();
  acknowledge();
  await flush();
  render({ ...props, player: silent });
  await flush();
  acknowledge();
  await flush();
  assert.equal(
    notifications,
    1,
    'adding a callback after acceptance does not replay it'
  );

  render({ ...props, player: playerWith() });
  await flush();
  const pending = bindings.get(committedView.tag);
  rendererModule.exports.render(null, 11, null, true, {});
  await flush();
  acknowledge(pending);
  await flush();
  assert.equal(notifications, 1, 'unmounted views cannot announce readiness');
});

test('A to B to A keeps the host and ignores superseded native acknowledgments', async () => {
  const first = playerWith();
  const second = playerWith();
  const fullscreenHandler = {};
  const notifications = [];
  const propsFor = (player) => ({
    player,
    fullscreenHandler,
    onPlayerViewReady: () => notifications.push(player),
  });
  render(propsFor(first));
  await flush();
  const tag = committedView.tag;
  const obsoleteFirst = bindings.get(tag);
  const bridge = obsoleteFirst.fullscreen;
  render(propsFor(second));
  await flush();
  const obsoleteSecond = bindings.get(tag);
  render(propsFor(first));
  await flush();
  const current = bindings.get(tag);
  assert.equal(
    committedView.tag,
    tag,
    'Player changes preserve the native host'
  );
  assert.equal(current.player, first);
  assert.equal(current.fullscreen, bridge);
  assert.equal(bridge.destroyed, undefined);

  acknowledge(obsoleteFirst);
  acknowledge(obsoleteSecond);
  await flush();
  assert.deepEqual(
    notifications,
    [],
    'only the current attachment can announce readiness'
  );
  acknowledge(current);
  await flush();
  assert.deepEqual(notifications, [first]);
  for (const player of [second, first]) {
    render(propsFor(player));
    await flush();
    assert.equal(committedView.tag, tag);
    acknowledge();
    await flush();
    acknowledge();
    await flush();
  }
  assert.deepEqual(notifications, [first, second, first]);
});

test('failed native attachment reports no readiness or unhandled rejection', async () => {
  const error = new Error('SDK Player creation failed');
  const player = playerWith();
  player.getDuration = async () => {
    throw error;
  };
  let notifications = 0;
  render({ player, onPlayerViewReady: () => notifications++ });
  await flush();
  assert.ok(committedView, 'native host exists before its SDK attachment');
  bindings.get(committedView.tag).reject(error);
  await flush();
  assert.equal(notifications, 0);
  assert.equal(viewWarnings.length, 1);
  assert.equal(viewWarnings[0][1], error);
  await assert.rejects(player.getDuration(), error);
  const subscription = await player.on('ready', () => {});
  subscription.remove();
});
