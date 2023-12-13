import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
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
