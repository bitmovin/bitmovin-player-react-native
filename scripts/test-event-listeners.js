const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'event-listeners-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
// Emit the listeners' import graph once, without Expo's app build or typecheck.
// It only has type imports of Expo, so no Expo doubles are needed.
before(() => {
  const program = ts.createProgram(
    [path.resolve(__dirname, '../src/utils/eventListeners.ts')],
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
});

// The native module double only records the submitted calls. It does not prove
// that native attaches or detaches a listener.
function fixture() {
  const { EventListeners } = require(path.join(root, 'utils/eventListeners'));
  const calls = [];
  const nativeModule = {
    on: async (nativeId, eventName) => calls.push(['on', nativeId, eventName]),
    off: async (nativeId, eventName) =>
      calls.push(['off', nativeId, eventName]),
  };
  let moduleListener;
  const listeners = new EventListeners(
    'player-id',
    nativeModule,
    (listener) => {
      moduleListener = listener;
      return { remove: () => (moduleListener = undefined) };
    }
  );
  const emit = (payload) => moduleListener?.(payload);
  return { listeners, calls, emit };
}

test('attaches the native listeners registered before attachNative once', () => {
  const { listeners, calls } = fixture();
  listeners.on('ready', () => {});
  listeners.on('ready', () => {});
  listeners.on('playing', () => {});
  assert.deepEqual(calls, []);

  listeners.attachNative();
  // Overlapping initializations of the same instance call attachNative again.
  listeners.attachNative();

  assert.deepEqual(calls, [
    ['on', 'player-id', 'ready'],
    ['on', 'player-id', 'playing'],
  ]);
});

test('keeps the native listeners in sync after attachNative was called twice', () => {
  const { listeners, calls } = fixture();
  const listener = () => {};
  listeners.on('ready', listener);
  listeners.attachNative();
  listeners.attachNative();

  listeners.off('ready', listener);
  listeners.on('ready', listener);

  assert.deepEqual(calls, [
    ['on', 'player-id', 'ready'],
    ['off', 'player-id', 'ready'],
    ['on', 'player-id', 'ready'],
  ]);
});

test('attaches the native listeners again after removeAll', () => {
  const { listeners, calls } = fixture();
  listeners.attachNative();
  listeners.removeAll();
  listeners.on('ready', () => {});
  assert.deepEqual(calls, []);

  listeners.attachNative();

  assert.deepEqual(calls, [['on', 'player-id', 'ready']]);
});

test('dispatches events by the event name they were attached for', () => {
  const { listeners, emit } = fixture();
  const received = [];
  listeners.on('sourceAdded', (event) => received.push(['sourceAdded', event]));
  listeners.on('ready', (event) => received.push(['ready', event]));
  // The native name does not need to match the event name, e.g. iOS's
  // `onSourceAddedEvent`.
  const event = { name: 'onSourceAddedEvent', timestamp: 1 };

  emit({ nativeId: 'other-player', eventName: 'sourceAdded', event });
  emit({ nativeId: 'player-id', eventName: 'sourceAdded', event });

  assert.deepEqual(received, [['sourceAdded', event]]);
});
