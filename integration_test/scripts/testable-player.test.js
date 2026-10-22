const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function renderPlayer(world, logs = []) {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/TestablePlayer.tsx'),
    'utf8'
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  });
  let playerProps;
  const react = {
    createElement(type, props) {
      if (type === 'PlayerView') playerProps = props;
      return {};
    },
    useState: () => [0, () => {}],
  };
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    console: { info: (...args) => logs.push(args) },
    require(name) {
      if (name === 'react') return react;
      if (name === 'cavy') {
        return { useCavy: () => () => {}, wrap: (component) => component };
      }
      if (name === 'react-native') {
        return { StyleSheet: { create: (styles) => styles }, Text: 'Text' };
      }
      if (name === 'bitmovin-player-react-native') {
        return { PlayerView: 'PlayerView' };
      }
      if (name === 'react-native-safe-area-context') {
        return { SafeAreaView: 'SafeAreaView' };
      }
      return {};
    },
  });
  exports.default({ playerTestWorld: world });
  return playerProps;
}

test('observes enriched metadata callbacks exactly once and retains other events', () => {
  const events = [];
  const props = renderPlayer({
    player: {},
    onEvent: (event) => events.push(event),
  });
  const raw = { name: 'onMetadata', metadata: [{ type: 'ID3' }] };
  const enriched = { ...raw, metadata: [{ type: 'ID3', platform: 'ios' }] };
  props.onEvent(raw);
  assert.equal(events.length, 0, 'raw metadata must not satisfy assertions');
  props.onMetadata(enriched);
  const parsed = { name: 'onMetadataParsed', metadata: enriched.metadata };
  props.onEvent(parsed);
  props.onMetadataParsed(parsed);
  const ready = { name: 'onReady' };
  props.onEvent(ready);
  assert.deepEqual(events, [enriched, parsed, ready]);
});

test('ad diagnostics retain timing and identity without private event payloads', () => {
  const logs = [];
  const props = renderPlayer(
    { player: { nativeId: 'test-player' }, onEvent: () => {} },
    logs
  );
  props.onEvent({
    name: 'onAdStarted',
    duration: 10,
    clickThroughUrl: 'private-url',
    message: 'private-message',
    data: { licenseKey: 'private-key' },
  });
  assert.equal(logs.length, 1);
  const record = JSON.parse(logs[0][1]);
  assert.equal(record.playerId, 'test-player');
  assert.equal(record.event, 'onAdStarted');
  assert.equal(record.duration, 10);
  assert.equal(typeof record.observedAt, 'number');
  assert.ok(!JSON.stringify(logs).includes('private-'));
  props.onEvent({ name: 'onTimeChanged', currentTime: 1 });
  assert.equal(logs.length, 1, 'high-frequency progress events stay quiet');
});

test('ignores queued events from a player retired by the next test', () => {
  const events = [];
  const world = { player: {}, onEvent: (event) => events.push(event) };
  const previous = renderPlayer(world);
  world.player = {};
  const current = renderPlayer(world);
  const ready = { name: 'onReady' };
  previous.onEvent(ready);
  previous.onMetadata({ name: 'onMetadata' });
  assert.equal(events.length, 0);
  current.onEvent(ready);
  assert.deepEqual(events, [ready]);
  world.player = undefined;
  current.onEvent(ready);
  assert.deepEqual(events, [ready]);
});

test('acknowledges the rendered player and ignores stale view readiness', () => {
  const readyPlayers = [];
  const world = {
    player: {},
    onPlayerViewReady: (player) => readyPlayers.push(player),
  };
  const oldPlayer = world.player;
  const previous = renderPlayer(world);
  world.player = {};
  const current = renderPlayer(world);
  previous.onPlayerViewReady();
  assert.deepEqual(readyPlayers, []);
  current.onPlayerViewReady();
  assert.deepEqual(readyPlayers, [world.player]);
  assert.notEqual(readyPlayers[0], oldPlayer);
  world.player = undefined;
  current.onPlayerViewReady();
  assert.equal(readyPlayers.length, 1);
});
