import { TestScope } from 'cavy';
import {
  Event,
  Player,
  Source,
  SourceUnloadedEvent,
} from 'bitmovin-player-react-native';
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
      'delivers PlayerActive to listeners registered before loading',
      async () => {
        await withPlayer(async (player) => {
          const received: Event[] = [];
          const record = (event: Event) => received.push(event);
          player.on('playerActive', record);
          player.on('ready', record);
          await player.initialize();

          const source = new Source(Sources.artOfMotionHls);
          player.loadSource(source);

          const isReady = await waitUntil(() =>
            received.some((event) => event.name === 'onReady')
          );
          expect(isReady, 'Ready should be received').toBeTruthy();
          expect(received[0].name).toBe('onPlayerActive');
        });
      }
    );

    spec.it(
      'delivers events to the other listeners when a listener throws',
      async () => {
        await withPlayer(async (player) => {
          let isReceived = false;
          player.on('ready', () => {
            throw new Error('Expected test error');
          });
          player.on('ready', () => {
            isReceived = true;
          });
          await player.initialize();
          player.load(Sources.artOfMotionHls);

          expect(
            await waitUntil(() => isReceived),
            'Ready after a throwing listener'
          ).toBeTruthy();
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
      const countAfterDestroy = received.length;
      await delay(1000);
      expect(received.length, 'Events after destroy').toBe(countAfterDestroy);
    });

    spec.it('provides the unloaded source in sourceUnloaded', async () => {
      await withPlayer(async (player) => {
        const unloaded: SourceUnloadedEvent[] = [];
        let isReady = false;
        player.on('ready', () => {
          isReady = true;
        });
        player.on('sourceUnloaded', (event) => unloaded.push(event));
        await player.initialize();
        const source = new Source(Sources.artOfMotionHls);
        player.loadSource(source);
        expect(
          await waitUntil(() => isReady),
          'Ready should be received'
        ).toBeTruthy();

        player.unload();

        expect(
          await waitUntil(() => unloaded.length > 0),
          'SourceUnloaded should be received'
        ).toBeTruthy();
        expect(unloaded[0].source.nativeId).toBe(source.nativeId);
      });
    });
  });
};
