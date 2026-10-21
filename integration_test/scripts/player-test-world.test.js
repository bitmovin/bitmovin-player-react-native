const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function createWorld() {
  const timers = new Map();
  const modules = new Map();
  let nextTimer = 0;
  const context = vm.createContext({
    setTimeout(callback) {
      const handle = ++nextTimer;
      timers.set(handle, callback);
      return handle;
    },
    clearTimeout(handle) {
      timers.delete(handle);
    },
  });

  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    modules.set(file, exports);
    const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    });
    const execute = vm.runInContext(
      `(function (exports, require) { ${outputText}\n})`,
      context,
      { filename: file }
    );
    execute(exports, (name) => {
      if (name === 'react-native-uuid') return { v4: randomUUID };
      if (name === 'bitmovin-player-react-native') return {};
      assert.ok(name.startsWith('.'), `Unexpected import: ${name}`);
      return load(path.resolve(path.dirname(file), `${name}.ts`));
    });
    return exports;
  }

  const directory = path.resolve(__dirname, '../playertesting');
  const PlayerTestWorld = load(`${directory}/PlayerTestWorld.ts`).default;
  const { FilteredEvent } = load(
    `${directory}/expectations/SingleEventExpectation.ts`
  );
  const { EventSequence } = load(
    `${directory}/expectations/MultipleEventsExpectation.ts`
  );
  return {
    world: new PlayerTestWorld(),
    FilteredEvent,
    EventSequence,
    timers,
    expireTimers() {
      for (const [handle, callback] of timers) {
        timers.delete(handle);
        callback();
      }
    },
  };
}

for (const multiple of [false, true]) {
  const label = multiple ? 'event sequence' : 'single event';
  const method = multiple ? 'expectEventsCalling' : 'expectEventCalling';

  for (const asynchronous of [false, true]) {
    test(`${label}: cleans up when the trigger ${asynchronous ? 'rejects' : 'throws'}`, async () => {
      const harness = createWorld();
      let observedEvents = 0;
      const event = harness.FilteredEvent('onSubtitleChanged', () => {
        observedEvents++;
        return true;
      });
      const expectation = multiple ? harness.EventSequence(event) : event;
      const actionError = new Error('subtitle action failed');
      const trigger = asynchronous
        ? async () => {
            await Promise.resolve();
            throw actionError;
          }
        : () => {
            throw actionError;
          };

      await assert.rejects(
        harness.world[method](expectation, 1, trigger),
        (error) => error === actionError
      );
      harness.world.onEvent({ name: 'onSubtitleChanged' });
      assert.equal(observedEvents, 0, 'failed trigger left an active listener');
      assert.equal(harness.timers.size, 0, 'failed trigger left a timeout');
      harness.expireTimers();
      await new Promise(setImmediate);
    });
  }

  test(`${label}: preserves the action error after the expectation times out`, async () => {
    const harness = createWorld();
    const actionError = new Error('slow action failed');
    const expectation = multiple ? ['onSubtitleChanged'] : 'onSubtitleChanged';
    await assert.rejects(
      harness.world[method](expectation, 1, async () => {
        harness.expireTimers();
        await new Promise(setImmediate);
        throw actionError;
      }),
      (error) => error === actionError
    );
    assert.equal(harness.timers.size, 0);
  });

  test(`${label}: still receives events emitted by the trigger`, async () => {
    const harness = createWorld();
    const event = { name: 'onSubtitleChanged' };
    const expectation = multiple ? [event.name] : event.name;
    const result = await harness.world[method](expectation, 1, async () => {
      harness.world.onEvent(event);
    });
    assert.equal(multiple ? result[0] : result, event);
    assert.equal(harness.timers.size, 0);
  });

  test(`${label}: still rejects when the event never arrives`, async () => {
    const harness = createWorld();
    const expectation = multiple ? ['onSubtitleChanged'] : 'onSubtitleChanged';
    await assert.rejects(
      harness.world[method](expectation, 1, async () => harness.expireTimers()),
      /Expectation was not met:.*onSubtitleChanged/
    );
    assert.equal(harness.timers.size, 0);
  });
}
