const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');

// Exercise the public component with real React effects. Only the host boundary
// and unrelated Player event transport are replaced; this proves JS ordering.
function fixture(t) {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const attached = [];
  let hostProps;
  let closed = 0;
  const view = {
    attachBindings: async (id) => attached.push(id),
    updatePictureInPictureActions: async () => {},
    setIsPictureInPictureEnabled: async () => {},
  };
  const NativePlayerView = React.forwardRef((props, ref) => {
    hostProps = props;
    React.useImperativeHandle(ref, () => view, []);
    return null;
  });
  class FullscreenHandlerBridge {
    setFullscreenHandler() {}
    async destroy() {
      closed++;
    }
  }
  const dependencies = {
    'react': React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-native': { StyleSheet: { create: (x) => x, flatten: (x) => x } },
    'expo-keep-awake': { useKeepAwake() {} },
    './native': { NativePlayerView },
    '../../hooks/useProxy': { useProxy: () => (callback) => callback },
    './usePlayerEventProps': { usePlayerEventProps() {} },
    '../../ui/fullscreenHandlerBridge': {
      FullscreenHandlerBridge,
    },
  };
  const filename = path.resolve(
    __dirname,
    '../src/components/PlayerView/index.tsx'
  );
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', output)(
    (name) => {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
    loaded,
    loaded.exports
  );
  const { PlayerView } = loaded.exports;
  let rendered;
  t.after(async () => {
    if (rendered) await act(() => rendered.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  });
  return {
    view,
    attached,
    get closed() {
      return closed;
    },
    async render(props) {
      await act(() => {
        const element = React.createElement(PlayerView, props);
        if (rendered) rendered.update(element);
        else rendered = create(element);
      });
    },
    async attach() {
      await act(() => hostProps.onBmpViewAttached());
    },
    async unmount() {
      await act(() => rendered.unmount());
      rendered = undefined;
    },
  };
}

function player(nativeId) {
  return { nativeId, native: { nativeId } };
}

test('Player replacement keeps fullscreen handling scoped to the mounted view', async (t) => {
  const f = fixture(t);
  const first = player('first');
  const second = player('second');
  const fullscreenHandler = {};
  await f.render({ player: first, fullscreenHandler });
  await f.attach();
  await f.render({ player: second, fullscreenHandler });

  assert.deepEqual(f.attached, [first.native, second.native]);

  assert.deepEqual(f.attached, [first.native, second.native]);
  assert.equal(
    f.closed,
    0,
    'Player replacement must keep the fullscreen scope'
  );
  await f.unmount();
  assert.equal(f.closed, 1);
});

test('a replacement view ref receives the existing native host', async (t) => {
  const f = fixture(t);
  const first = player('first');
  const previous = { current: null };
  await f.render({ player: first, viewRef: previous });
  await f.attach();

  const next = { current: null };
  await f.render({ player: first, viewRef: next });
  assert.equal(next.current, f.view);
});

test('attaches a valid empty compatibility ID', async (t) => {
  const f = fixture(t);
  const first = player('');
  await f.render({ player: first });
  await f.attach();
  assert.deepEqual(f.attached, [first.native]);
});
