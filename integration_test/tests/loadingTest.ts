import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventSequence,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('loading a source', () => {
    spec.it('emits ReadyEvent event', async () => {
      await startPlayerTest({}, async () => {
        await callPlayerAndExpectEvent((player) => {
          player.load(Sources.artOfMotionHls);
        }, EventType.Ready);
      });
    });
    spec.it('emits SourceLoad and SourceLoaded events', async () => {
      await startPlayerTest({}, async () => {
        await callPlayerAndExpectEvents((player) => {
          player.load(Sources.artOfMotionHls);
        }, EventSequence(EventType.SourceLoad, EventType.SourceLoaded));
      });
    });
  });
  spec.describe('unloading the player', () => {
    spec.it('emits SourceUnloaded event', async () => {
      await startPlayerTest({}, async () => {
        await callPlayerAndExpectEvent((player) => {
          player.load(Sources.artOfMotionHls);
        }, EventType.Ready);
        await callPlayerAndExpectEvent((player) => {
          player.unload();
        }, EventType.SourceUnloaded);
      });
    });
  });
};
