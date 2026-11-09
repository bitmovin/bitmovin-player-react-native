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
let sharedObjectId = 0;
function nativePlayer() {
  return { __expo_shared_object_id__: ++sharedObjectId };
}
function playerWith(native = Promise.resolve(nativePlayer())) {
  return { config: {}, native };
}
const viewConfig = {
  uiViewClassName: 'ProbePlayerView',
  validAttributes: { config: true, player: true },
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
  createPublicInstance: (tag, config, handle) => ({ tag, handle }),
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
const playerViewContext = vm.createContext({
  module: playerViewModule,
  exports: playerViewModule.exports,
  require(name) {
    if (name === 'react' || name === 'react/jsx-runtime') return req(name);
    if (name === 'react-native')
      return { StyleSheet: { create: (x) => x, flatten: (x) => x } };
    if (name === 'expo-keep-awake') return { useKeepAwake() {} };
    if (name === './native') return { NativePlayerView: 'ProbePlayerView' };
    if (name.endsWith('/useProxy')) return { useProxy: () => (x) => x };
    if (name.endsWith('/fullscreenhandlerbridge')) return {};
    if (name.endsWith('/custommessagehandlerbridge')) return {};
    if (name.endsWith('/metadataPlatform')) return {};
    throw new Error('Unexpected PlayerView dependency: ' + name);
  },
});
vm.runInContext(compiled, playerViewContext);
const { PlayerView } = playerViewModule.exports;
// Use the installed Fabric renderer so effects, refs and asynchronous initialization
// run as they do in the app. Only the native mount and acknowledgment are controlled.
async function flush() {
  for (let i = 0; i < 6; i++) {
    scheduler.unstable_flushAllWithoutAsserting();
    await new Promise(setImmediate);
  }
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

function acknowledge(view = committedView) {
  view.props.onBmpPlayerViewReady({ nativeEvent: {} });
}

test('readiness waits for native listeners and follows the current player', async () => {
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
  await flush();
  assert.ok(committedView, 'initialized player renders a native view');
  assert.equal(committedView.props.player, await player.native);
  assert.equal(
    notifications,
    0,
    'JS effects must not announce native readiness'
  );
  acknowledge();
  assert.equal(notifications, 1);
  acknowledge();
  assert.equal(notifications, 1, 'duplicate acknowledgments are ignored');
  render({
    ...props,
    onPlayerViewReady: () => {
      notifications += 10;
    },
  });
  await flush();
  acknowledge();
  assert.equal(
    notifications,
    1,
    'callback identity changes do not repeat readiness'
  );

  const previousView = committedView;
  let finishInitialization;
  const replacement = playerWith(
    new Promise((resolve) => {
      finishInitialization = () => resolve(nativePlayer());
    })
  );
  render({ ...props, player: replacement });
  await flush();
  assert.equal(
    committedView,
    undefined,
    'replacement waits for its own initialization'
  );
  acknowledge(previousView);
  assert.equal(notifications, 1, 'retired player cannot notify a replacement');
  finishInitialization();
  await flush();
  acknowledge(previousView);
  assert.equal(notifications, 1);
  acknowledge();
  assert.equal(
    notifications,
    2,
    'replacement announces its own native readiness'
  );

  // An obsolete initialization must not mount the next player prematurely.
  let finishObsolete;
  let finishCurrent;
  const obsolete = playerWith(
    new Promise((resolve) => {
      finishObsolete = () => resolve(nativePlayer());
    })
  );
  const current = playerWith(
    new Promise((resolve) => {
      finishCurrent = () => resolve(nativePlayer());
    })
  );
  render({ ...props, player: obsolete });
  await flush();
  render({ ...props, player: current });
  await flush();
  finishObsolete();
  await flush();
  assert.equal(committedView, undefined, 'obsolete initialization is ignored');
  finishCurrent();
  await flush();
  assert.equal(committedView.props.player, await current.native);
  acknowledge();
  assert.equal(notifications, 3);
  const retiredView = committedView;
  const silentPlayer = playerWith();
  render({ player: silentPlayer });
  await flush();
  acknowledge(retiredView);
  assert.equal(notifications, 3, 'a retired handler cannot announce readiness');
  acknowledge();
  render({ ...props, player: silentPlayer });
  await flush();
  acknowledge();
  assert.equal(
    notifications,
    3,
    'adding a callback after readiness does not replay it'
  );
  const unmountedView = committedView;
  rendererModule.exports.render(null, 11, null, true, {});
  await flush();
  acknowledge(unmountedView);
  assert.equal(notifications, 3, 'unmounted views cannot announce readiness');
});

test('switching A to B to A announces each attachment once', async () => {
  const first = playerWith();
  const second = playerWith();
  const notifications = [];
  for (const player of [first, second, first]) {
    render({
      player,
      onPlayerViewReady: () => notifications.push(player),
    });
    await flush();
    acknowledge();
    acknowledge();
  }
  assert.deepEqual(notifications, [first, second, first]);
  rendererModule.exports.render(null, 11, null, true, {});
  await flush();
});
