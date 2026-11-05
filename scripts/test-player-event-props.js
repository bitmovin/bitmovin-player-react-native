const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'player-event-props-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
// Emit the hook's import graph once, without Expo's app build or typecheck. React and the test
// renderer are the real packages; React Native is replaced by the double below.
before(() => {
  const program = ts.createProgram(
    [
      path.resolve(
        __dirname,
        '../src/components/PlayerView/usePlayerEventProps.ts'
      ),
    ],
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
  const modules = path.join(root, 'node_modules');
  fs.mkdirSync(path.join(modules, 'react-native'), { recursive: true });
  fs.writeFileSync(
    path.join(modules, 'react-native', 'index.js'),
    "module.exports = { Platform: { OS: 'android' } };"
  );
  for (const name of ['react', 'react-test-renderer']) {
    fs.symlinkSync(
      path.dirname(require.resolve(`${name}/package.json`)),
      path.join(modules, name)
    );
  }
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// react-test-renderer is deprecated in React 19, but needs no DOM, which this test does not
// have. Hide its deprecation warning, and only that one.
const consoleError = console.error;
console.error = (...args) => {
  if (!String(args[0]).startsWith('react-test-renderer is deprecated')) {
    consoleError(...args);
  }
};

// The player double records the listeners the hook attaches. It does not prove
// that the native player emits the events.
function createPlayer(name) {
  const listeners = new Map();
  const calls = [];
  return {
    name,
    calls,
    on(eventName, listener) {
      calls.push(['on', eventName]);
      listeners.set(eventName, listener);
    },
    off(eventName, listener) {
      calls.push(['off', eventName]);
      if (listeners.get(eventName) === listener) {
        listeners.delete(eventName);
      }
    },
    emit(eventName, event) {
      listeners.get(eventName)?.(event);
    },
    attachedEventNames: () => [...listeners.keys()],
  };
}

function render(player, props) {
  const React = require(path.join(root, 'node_modules/react'));
  const { act, create } = require(
    path.join(root, 'node_modules/react-test-renderer')
  );
  const { usePlayerEventProps } = require(
    path.join(root, 'components/PlayerView/usePlayerEventProps')
  );
  const Host = ({ player: hostPlayer, props: hostProps }) => {
    usePlayerEventProps(hostPlayer, hostProps);
    return null;
  };
  let renderer;
  act(() => {
    renderer = create(React.createElement(Host, { player, props }));
  });
  return {
    update: (nextPlayer, nextProps) =>
      act(() =>
        renderer.update(
          React.createElement(Host, { player: nextPlayer, props: nextProps })
        )
      ),
    unmount: () => act(() => renderer.unmount()),
  };
}

const ready = { name: 'onReady', timestamp: 1 };

test('only attaches the events of the set props', () => {
  const player = createPlayer('player');
  const received = [];
  render(player, { onReady: (event) => received.push(event) });

  player.emit('ready', ready);

  assert.deepEqual(player.calls, [['on', 'ready']]);
  assert.deepEqual(received, [ready]);
});

test('attaches all events while onEvent is set', () => {
  const player = createPlayer('player');
  const received = [];
  const view = render(player, { onEvent: (event) => received.push(event) });

  assert.ok(player.attachedEventNames().includes('ready'));
  assert.ok(player.attachedEventNames().includes('playerActive'));
  assert.ok(player.attachedEventNames().length > 50);
  player.emit('ready', ready);
  assert.deepEqual(received, [ready]);

  view.update(player, {});
  assert.deepEqual(player.attachedEventNames(), []);
});

test('only (un)subscribes the events of set or unset props', () => {
  const player = createPlayer('player');
  const onReady = () => {};
  const onPaused = () => {};
  const view = render(player, { onReady });
  view.update(player, { onReady, onPaused });
  view.update(player, { onPaused });

  assert.deepEqual(player.calls, [
    ['on', 'ready'],
    ['on', 'paused'],
    ['off', 'ready'],
  ]);
});

test('calls a replaced prop without attaching again', () => {
  const player = createPlayer('player');
  const received = [];
  const view = render(player, { onReady: () => received.push('first') });
  view.update(player, { onReady: () => received.push('second') });

  player.emit('ready', ready);

  assert.deepEqual(player.calls, [['on', 'ready']]);
  assert.deepEqual(received, ['second']);
});

test('moves the listeners to a new player', () => {
  const first = createPlayer('first');
  const second = createPlayer('second');
  const received = [];
  const view = render(first, { onReady: () => received.push('ready') });
  view.update(second, { onReady: () => received.push('ready') });

  first.emit('ready', ready);
  second.emit('ready', ready);

  assert.deepEqual(first.calls, [
    ['on', 'ready'],
    ['off', 'ready'],
  ]);
  assert.deepEqual(second.calls, [['on', 'ready']]);
  assert.deepEqual(received, ['ready']);
});

test('detaches all listeners on unmount', () => {
  const player = createPlayer('player');
  const view = render(player, { onReady: () => {}, onPaused: () => {} });

  view.unmount();

  assert.deepEqual(player.attachedEventNames(), []);
});

test('calls onEvent when an event prop throws', (t) => {
  const errors = [];
  t.mock.method(console, 'error', (...args) => errors.push(args));
  const player = createPlayer('player');
  const received = [];
  render(player, {
    onReady: () => {
      throw new Error('prop failed');
    },
    onEvent: (event) => received.push(event),
  });

  player.emit('ready', ready);

  assert.deepEqual(received, [ready]);
  assert.ok(
    errors.some(([message]) => String(message).includes('onReady')),
    'the error of the prop is reported'
  );
});
