const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function createWorld() {
  const logs = [];
  const timers = new Map();
  const timerDelays = new Map();
  const modules = new Map();
  const players = [];
  class Player {
    constructor(config) {
      this.nativeId = config.nativeId;
      this.isDestroyed = false;
      players.push(this);
    }
    async initialize() {}
    destroy() {
      this.isDestroyed = true;
    }
  }
  let nextTimer = 0;
  const context = vm.createContext({
    __DEV__: true,
    console: { info: (...args) => logs.push(args) },
    setTimeout(callback, delay) {
      const handle = ++nextTimer;
      timers.set(handle, callback);
      timerDelays.set(handle, delay);
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
      if (name === 'bitmovin-player-react-native') return { Player };
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
    logs,
    world: new PlayerTestWorld(),
    FilteredEvent,
    EventSequence,
    timers,
    players,
    expireTimers(delay) {
      for (const [handle, callback] of timers) {
        if (delay !== undefined && timerDelays.get(handle) !== delay) continue;
        timers.delete(handle);
        callback();
      }
    },
  };
}

test('traces matching and pending source events without fulfilling them twice', async () => {
  const harness = createWorld();
  const event = { name: 'onSourceLoad', timestamp: 12345 };
  const running = harness.world.expectEventsCalling(
    ['onSourceLoad', 'onSourceLoaded'],
    10,
    async () => {
      harness.world.onEvent(event);
      harness.expireTimers(10000);
    }
  );
  await assert.rejects(running, /Expectation was not met/);
  const records = harness.logs
    .filter(([tag]) => tag === '[PRN_LOAD_TRACE]')
    .map(([, json]) => JSON.parse(json));
  const match = records.find((r) => r.stage === 'js.expectation.event');
  const timeout = records.find((r) => r.stage === 'js.expectation.timeout');
  assert.ok(match, 'missing expectation decision trace');
  assert.equal(match.matched, true);
  assert.equal(match.eventTimestamp, event.timestamp);
  assert.deepEqual(match.pending, ['onSourceLoaded']);
  assert.ok(timeout, 'missing timeout trace');
  assert.equal(timeout.expectationId, match.expectationId);
  assert.deepEqual(timeout.pending, ['onSourceLoaded']);
  assert.equal(harness.timers.size, 0);
});

test('waits for matching view readiness and receives synchronous source events', async () => {
  const harness = createWorld();
  let called = false;
  harness.world.onReRender = () => {};
  const running = harness.world.startPlayerTest({}, async () => {
    await harness.world.callPlayerAndExpectEvents(
      () => {
        called = true;
        harness.world.onEvent({ name: 'onSourceLoad' });
        harness.world.onEvent({ name: 'onSourceLoaded' });
      },
      ['onSourceLoad', 'onSourceLoaded'],
      10
    );
  });
  await new Promise(setImmediate);
  harness.expireTimers(150);
  await new Promise(setImmediate);
  assert.equal(called, false, 'load must wait for the mounted view');
  harness.world.onPlayerViewReady(harness.players[0]);
  await running;
  assert.equal(called, true);
  assert.match(harness.players[0].nativeId, /^player-/);
  assert.equal(harness.players[0].isDestroyed, true);
  assert.equal(harness.timers.size, 0);
});

test('ignores readiness from a retired player', async () => {
  const harness = createWorld();
  harness.world.onReRender = () => {};
  await harness.world.startPlayerTest({}, async () => {});
  let called = false;
  const running = harness.world.startPlayerTest({}, async () => {
    await harness.world.callPlayer(async () => {
      called = true;
    });
  });
  await new Promise(setImmediate);
  harness.world.onPlayerViewReady(harness.players[0]);
  await new Promise(setImmediate);
  assert.equal(called, false);
  harness.world.onPlayerViewReady(harness.players[1]);
  await running;
  assert.equal(called, true);
  assert.equal(harness.timers.size, 0);
});

test('accepts readiness during the render request before the first action', async () => {
  const harness = createWorld();
  harness.world.onReRender = () => {
    if (harness.world.player) {
      harness.world.onPlayerViewReady(harness.world.player);
    }
  };
  let called = false;
  await harness.world.startPlayerTest({}, async () => {
    await harness.world.callPlayer(async () => {
      called = true;
    });
  });
  assert.equal(called, true);
  assert.equal(harness.timers.size, 0);
});

test('reports missing view readiness separately and cleans up the player', async () => {
  const harness = createWorld();
  harness.world.onReRender = () => {};
  let called = false;
  const running = harness.world.startPlayerTest({}, async () => {
    await harness.world.callPlayer(async () => {
      called = true;
    });
  });
  const rejected = assert.rejects(running, /Player view was not ready/);
  await new Promise(setImmediate);
  harness.expireTimers();
  await rejected;
  assert.equal(called, false);
  assert.equal(harness.players[0].isDestroyed, true);
  assert.equal(harness.world.player, undefined);
  assert.equal(harness.timers.size, 0);
});

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
