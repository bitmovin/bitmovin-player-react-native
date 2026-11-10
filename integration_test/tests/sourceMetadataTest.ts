import { Source } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('Source metadata', () => {
    spec.it('preserves metadata set before loading', async () => {
      await startPlayerTest({}, async () => {
        const source = new Source(Sources.artOfMotionHls);
        await source.setMetadata({ tag: 'updated before load' });
        await callPlayerAndExpectEvent(
          (player) => player.loadSource(source),
          EventType.Ready
        );
        expect(await source.metadata()).toEqual({ tag: 'updated before load' });
      });
    });
  });
};
