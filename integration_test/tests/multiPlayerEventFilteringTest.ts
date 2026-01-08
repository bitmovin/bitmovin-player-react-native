import { TestScope } from 'cavy';
import {
  EventType,
  expectEventFor,
  expectNoEventFor,
  loadSourceConfigFor,
  callPlayerAndExpectEventFor,
  startMultiPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('multi-player event routing', () => {
    spec.it('keeps events scoped to each player view', async () => {
      await startMultiPlayerTest({}, {}, async () => {
        await loadSourceConfigFor('A', Sources.artOfMotionHls);
        await expectNoEventFor('B', EventType.Ready, 2);

        await loadSourceConfigFor('B', Sources.sintel);

        await callPlayerAndExpectEventFor(
          'A',
          (player) => {
            player.play();
          },
          EventType.Playing
        );
        await callPlayerAndExpectEventFor(
          'B',
          (player) => {
            player.play();
          },
          EventType.Playing
        );
      });
    });
  });
};
