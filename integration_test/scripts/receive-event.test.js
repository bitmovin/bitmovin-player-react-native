const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require('typescript');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'receive-event-'));
let receiveEvent;
before(() => {
  const input = path.resolve(__dirname, '../playertesting/receiveEvent.ts');
  const program = ts.createProgram([input], {
    rootDir: path.dirname(input),
    outDir: directory,
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.CommonJS,
    noCheck: true,
    types: [],
  });
  assert.equal(program.emit().emitSkipped, false);
  ({ receiveEvent } = require(path.join(directory, 'receiveEvent.js')));
});
after(() => fs.rmSync(directory, { recursive: true, force: true }));

for (const eventFirst of [false, true]) {
  test(`a pending trigger times out with eventFirst=${eventFirst}`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let notifyStarted;
    const started = new Promise((resolve) => (notifyStarted = resolve));
    let rejectTrigger;
    const trigger = new Promise((_, reject) => (rejectTrigger = reject));
    let received;
    let removed = 0;
    const result = receiveEvent(
      async (listener) => {
        received = listener;
        return { remove: () => removed++ };
      },
      () => {
        if (eventFirst) received('early event');
        notifyStarted();
        return trigger;
      },
      100
    );
    await started;
    t.mock.timers.tick(100);
    await assert.rejects(result, /timed out/);
    assert.equal(removed, 1);
    // The timed-out operation can still reject later without an unhandled rejection.
    rejectTrigger(new Error('Late operation failure'));
    await new Promise(setImmediate);
  });
}

test('an event waits for trigger completion, then clears its subscription and timer', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let complete;
  const operation = new Promise((resolve) => (complete = resolve));
  let received;
  let removed = 0;
  let settled = false;
  const result = receiveEvent(
    async (listener) => {
      received = listener;
      return { remove: () => removed++ };
    },
    () => operation,
    100
  );
  void result.then(() => (settled = true));
  await new Promise(setImmediate);
  received('event');
  await new Promise(setImmediate);
  assert.equal(settled, false);
  complete();
  assert.equal(await result, 'event');
  assert.equal(removed, 1);
  t.mock.timers.tick(100);
});

test('a trigger error after its event remains the original failure', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const failure = new Error('Trigger failed');
  let received;
  let removed = 0;
  const result = receiveEvent(
    async (listener) => {
      received = listener;
      return { remove: () => removed++ };
    },
    () => {
      received('event');
      throw failure;
    },
    100
  );
  await assert.rejects(result, (error) => error === failure);
  assert.equal(removed, 1);
  t.mock.timers.tick(100);
});

test('a late subscription is removed without triggering after the deadline', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let register;
  const registration = new Promise((resolve) => (register = resolve));
  let triggered = false;
  let removed = 0;
  const result = receiveEvent(
    () => registration,
    () => {
      triggered = true;
    },
    100
  );
  t.mock.timers.tick(100);
  await assert.rejects(result, /timed out/);
  register({ remove: () => removed++ });
  await new Promise(setImmediate);
  assert.equal(removed, 1);
  assert.equal(triggered, false);
});

test('a listener error preserves its identity and cleans up a pending trigger', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const failure = new Error('Native listener failed');
  let rejectEvent;
  let rejectTrigger;
  let removed = 0;
  let notifyStarted;
  const started = new Promise((resolve) => (notifyStarted = resolve));
  const trigger = new Promise((_, reject) => (rejectTrigger = reject));
  const result = receiveEvent(
    async (_listener, reject) => {
      rejectEvent = reject;
      return { remove: () => removed++ };
    },
    () => {
      notifyStarted();
      return trigger;
    },
    100
  );
  await started;
  rejectEvent(failure);
  await assert.rejects(result, (error) => error === failure);
  assert.equal(removed, 1);
  t.mock.timers.tick(100);
  rejectTrigger(new Error('Late operation failure'));
  await new Promise(setImmediate);
});
