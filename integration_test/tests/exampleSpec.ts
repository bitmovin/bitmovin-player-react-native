import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvents,
  EventSequence,
  EventType,
  expectEvents,
  loadSourceConfig,
  RepeatedEvent,
  startPlayerTest,
} from '../playertesting';
import { SourceType } from 'bitmovin-player-react-native';
export default (spec: TestScope) => {
  spec.describe('calling play when a source is loaded', () => {
    spec.it('emits a Play and Playing event', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig({
          url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
          type: SourceType.HLS,
        });
        await callPlayerAndExpectEvents((player) => {
          player.play();
        }, EventSequence(EventType.Play, EventType.Playing));
      });
    });
  });
  spec.describe('playing a source', () => {
    spec.it('emits TimeChanged events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig({
          url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
          type: SourceType.HLS,
        });
        await callPlayerAndExpectEvents((player) => {
          player.play();
        }, EventSequence(EventType.Play, EventType.Playing));
        await expectEvents(RepeatedEvent(EventType.TimeChanged, 5));
      });
    });
  });
};
