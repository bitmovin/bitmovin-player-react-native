const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function renderPlayer(world) {
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
