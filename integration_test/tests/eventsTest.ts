import { TestScope } from 'cavy';
import {
  Event,
  Player,
  Source,
  SourceAddedEvent,
  SourceLoadedEvent,
  SourceUnloadedEvent,
} from 'bitmovin-player-react-native';
import { loadSourceConfig, startPlayerTest } from '../playertesting';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';

const waitUntil = async (
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 10000
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Loads via `load` and starts playback once the player is ready, as `play` has no effect before.
 */
const playWhenReady = async (player: Player, load: () => void) => {
  let isReady = false;
  const subscription = player.on('ready', () => {
    isReady = true;
  });
  load();
  const ready = await waitUntil(() => isReady);
  subscription.remove();
  expect(ready, 'Ready should be received').toBeTruthy();
  player.play();
};

/**
 * Runs `fn` with a player that is not attached to any `PlayerView`.
 */
const withPlayer = async (fn: (player: Player) => Promise<void>) => {
  const player = new Player();
  try {
    await fn(player);
  } finally {
    player.destroy();
  }
};

export default (spec: TestScope) => {
  spec.describe('player events without a PlayerView', () => {
    spec.it(
      'delivers SourceAdded and PlayerActive to listeners registered before loading',
      async () => {
        await withPlayer(async (player) => {
          const received: Event[] = [];
          const record = (event: Event) => received.push(event);
          player.on('sourceAdded', record);
          player.on('playerActive', record);
          player.on('ready', record);
          await player.initialize();

          const source = new Source(Sources.artOfMotionHls);
          player.loadSource(source);

          const isReady = await waitUntil(() =>
            received.some((event) => event.name === 'onReady')
          );
          expect(isReady, 'Ready should be received').toBeTruthy();
          const names = received.map((event) => event.name);
          expect(names.slice(0, 2)).toEqual([
            'onSourceAdded',
            'onPlayerActive',
          ]);
          const sourceAdded = received[0] as SourceAddedEvent;
          expect(sourceAdded.source.nativeId).toBe(source.nativeId);
        });
      }
    );

    spec.it('stops delivering events after off and remove', async () => {
      await withPlayer(async (player) => {
        let removedCount = 0;
        let offCount = 0;
        let keptCount = 0;
        const offListener = () => offCount++;
        const subscription = player.on('timeChanged', () => removedCount++);
        player.on('timeChanged', offListener);
        player.on('timeChanged', () => keptCount++);
        await player.initialize();
        await playWhenReady(player, () => player.load(Sources.artOfMotionHls));

        const isPlaying = await waitUntil(
          () => removedCount > 0 && offCount > 0 && keptCount > 0,
          20000
        );
        expect(isPlaying, 'TimeChanged should be received').toBeTruthy();

        subscription.remove();
        player.off('timeChanged', offListener);
        const removedCountAfterRemove = removedCount;
        const offCountAfterOff = offCount;
        const keptCountAfterRemove = keptCount;
        await delay(2000);

        expect(removedCount, 'Removed listener').toBe(removedCountAfterRemove);
        expect(offCount, 'Listener removed via off').toBe(offCountAfterOff);
        expect(keptCount, 'Remaining listener').toBeGreaterThan(
          keptCountAfterRemove
        );
      });
    });

    spec.it('removes all listeners when the player is destroyed', async () => {
      const player = new Player();
      const received: Event[] = [];
      const record = (event: Event) => received.push(event);
      player.on('timeChanged', record);
      player.on('destroy', record);
      const source = new Source(Sources.artOfMotionHls);
      source.on('sourceUnloaded', record);
      await player.initialize();
      await playWhenReady(player, () => player.loadSource(source));

      const isPlaying = await waitUntil(
        () => received.some((event) => event.name === 'onTimeChanged'),
        20000
      );
      expect(isPlaying, 'TimeChanged should be received').toBeTruthy();

      player.destroy();
      const isDestroyed = await waitUntil(() =>
        received.some((event) => event.name === 'onDestroy')
      );
      expect(isDestroyed, 'Destroy should be received').toBeTruthy();
      // The source of the session still receives its final `sourceUnloaded` before it is released.
      const isSourceUnloaded = await waitUntil(() =>
        received.some((event) => event.name === 'onSourceUnloaded')
      );
      expect(
        isSourceUnloaded,
        'SourceUnloaded should be received'
      ).toBeTruthy();
      const sourceUnloaded = received.find(
        (event) => event.name === 'onSourceUnloaded'
      ) as SourceUnloadedEvent | undefined;
      expect(sourceUnloaded?.source.nativeId).toBe(source.nativeId);
      const countAfterDestroy = received.length;
      await delay(1000);
      expect(received.length, 'Events after destroy').toBe(countAfterDestroy);
    });
  });

  spec.describe('source events', () => {
    spec.it(
      'delivers SourceLoaded of a preloaded inactive playlist source',
      async () => {
        await withPlayer(async (player) => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          const secondLoaded: SourceLoadedEvent[] = [];
          const playerLoaded: SourceLoadedEvent[] = [];
          second.on('sourceLoaded', (event) => secondLoaded.push(event));
          player.on('sourceLoaded', (event) => playerLoaded.push(event));
          await player.initialize();

          await player.loadPlaylist({
            sources: [first, second],
            options: { preloadAllSources: true },
          });

          const isLoaded = await waitUntil(() => secondLoaded.length > 0);
          expect(isLoaded, 'SourceLoaded of the second source').toBeTruthy();
          expect(secondLoaded[0].source.nativeId).toBe(second.nativeId);
          expect(await second.isActive()).toBeFalsy();
          expect(
            playerLoaded.some(
              (event) => event.source.nativeId === second.nativeId
            ),
            'Player SourceLoaded of the inactive source'
          ).toBeFalsy();
        });
      }
    );
  });

  spec.describe('PlayerView event props', () => {
    spec.it(
      'deliver PlayerActive when the view is mounted before loading',
      async () => {
        await startPlayerTest({}, async () => {
          await loadSourceConfig(Sources.artOfMotionHls);
          expect(PlayerTestWorld.shared.playerActivePropEvents).toHaveLength(1);
        });
      }
    );
  });
};
