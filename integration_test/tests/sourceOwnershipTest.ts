import { Source } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('Source ownership', () => {
    spec.it(
      'preserves distinct original sources through load, add and queries',
      async () => {
        await startPlayerTest({}, async () => {
          const firstConfig = { ...Sources.artOfMotionHls, title: 'first' };
          const secondConfig = { ...Sources.artOfMotionHls, title: 'second' };
          const first = new Source(firstConfig);
          const second = new Source(secondConfig);
          await callPlayerAndExpectEvent(async (player) => {
            await player.loadSource(first);
          }, EventType.Ready);

          await callPlayer(async (player) => {
            expect(await player.getSource()).toBe(first);
            await player.playlist.add(second);
            const sources = await player.playlist.getSources();
            expect(sources).toHaveLength(2);
            expect(sources[0]).toBe(first);
            expect(sources[1]).toBe(second);
            expect(sources[0].config).toBe(firstConfig);
            expect(sources[1].config).toBe(secondConfig);
            await player.playlist.seek(second, 0);
            expect(await player.getSource()).toBe(second);
          });
        });
      }
    );
  });
};
