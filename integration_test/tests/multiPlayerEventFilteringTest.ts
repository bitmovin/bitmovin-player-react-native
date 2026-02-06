import { TestScope } from 'cavy';
import {
  EventType,
  expectNoEventFor,
  callPlayerAndExpectEventFor,
  callPlayerAndExpectEventOnView,
  startMultiPlayerTest,
  swapMultiPlayerViews,
} from '../playertesting';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('multi-player event routing', () => {
    spec.it('keeps events scoped to each player view', async () => {
      await startMultiPlayerTest({}, {}, async () => {
        const loadOnView = async (
          viewKey: 'A' | 'B',
          playerKey: 'A' | 'B',
          source: typeof Sources.artOfMotionHls
        ) => {
          const otherView = viewKey === 'A' ? 'B' : 'A';
          // Ensure the other view does not receive Ready during this load.
          const expectNoCrossTalk = expectNoEventFor(
            otherView,
            EventType.Ready,
            2
          );
          await callPlayerAndExpectEventOnView(
            viewKey,
            playerKey,
            (player) => {
              // Trigger Ready on the view currently hosting this player.
              player.load(source);
            },
            EventType.Ready,
            10
          );
          await expectNoCrossTalk;
        };

        // Baseline: each view only receives events from its own player.
        await loadOnView('A', 'A', Sources.artOfMotionHls);
        await loadOnView('B', 'B', Sources.sintel);

        // Baseline: play events are scoped to the correct view.
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

        // Swap the players between the two views to cover re-attach routing.
        await swapMultiPlayerViews();

        // After swap: events must follow the view, not the original player key.
        await loadOnView('A', 'B', Sources.artOfMotionHls);
        await loadOnView('B', 'A', Sources.sintel);

        // After swap: play events should still be scoped to the hosting view.
        await callPlayerAndExpectEventOnView(
          'A',
          'B',
          (player) => {
            player.play();
          },
          EventType.Playing
        );
        await callPlayerAndExpectEventOnView(
          'B',
          'A',
          (player) => {
            player.play();
          },
          EventType.Playing
        );
      });
    });
  });
};
