import { TestScope } from 'cavy';
import {
  Event,
  Player,
  Source,
  SourceLoadedEvent,
  SourceUnloadedEvent,
} from 'bitmovin-player-react-native';
import {
  createPlayer,
  delay,
  playWhenReady,
  waitUntil,
  withPlayer,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';

/**
 * Runs `fn` with a new player using `nativeId` and destroys it afterwards.
 */
const withPlayerWithNativeId = async (
  nativeId: string,
  fn: (player: Player) => Promise<void>
) => {
  const player = createPlayer({ nativeId });
  try {
    await player.initialize();
    await fn(player);
  } finally {
    await player.destroy();
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

          const source = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'event-source' },
          });
          await player.loadSource(source);

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
          await player.load(Sources.artOfMotionHls);

          expect(
            await waitUntil(() => isReceived),
            'Ready after a throwing listener'
          ).toBeTruthy();
        });
      }
    );

    spec.it('stops delivering events after off', async () => {
      await withPlayer(async (player) => {
        let offCount = 0;
        let keptCount = 0;
        const offListener = () => offCount++;
        player.on('timeChanged', offListener);
        player.on('timeChanged', () => keptCount++);
        await player.initialize();
        await playWhenReady(player, () => player.load(Sources.artOfMotionHls));

        const isPlaying = await waitUntil(
          () => offCount > 0 && keptCount > 0,
          20000
        );
        expect(isPlaying, 'TimeChanged should be received').toBeTruthy();

        player.off('timeChanged', offListener);
        const offCountAfterOff = offCount;
        const keptCountAfterOff = keptCount;
        await delay(2000);

        expect(offCount, 'Listener removed via off').toBe(offCountAfterOff);
        expect(keptCount, 'Remaining listener').toBeGreaterThan(
          keptCountAfterOff
        );
      });
    });

    spec.it(
      'keeps delivering events when another Player with the same nativeId unsubscribes',
      async () => {
        const nativeId = `shared-player-${Date.now()}`;
        const player = createPlayer({ nativeId });
        const samePlayer = createPlayer({ nativeId });
        try {
          let isMuted = false;
          player.on('muted', () => {
            isMuted = true;
          });
          await player.initialize();
          await samePlayer.initialize();
          const noop = () => {};
          samePlayer.on('muted', noop);
          samePlayer.off('muted', noop);
          await playWhenReady(player, () =>
            player.load(Sources.artOfMotionHls)
          );

          await player.mute();
          expect(
            await waitUntil(() => isMuted),
            'Muted after the other Player unsubscribed'
          ).toBeTruthy();
        } finally {
          await player.destroy();
          await samePlayer.destroy();
        }
      }
    );

    spec.it(
      'removes the listeners of another Player with the same nativeId when the player is destroyed',
      async () => {
        const nativeId = `destroyed-player-${Date.now()}`;
        const player = createPlayer({ nativeId });
        const samePlayer = createPlayer({ nativeId });
        let isDestroyed = false;
        let samePlayerReadyCount = 0;
        player.on('destroy', () => {
          isDestroyed = true;
        });
        samePlayer.on('ready', () => samePlayerReadyCount++);
        await player.initialize();
        await player.destroy();
        expect(
          await waitUntil(() => isDestroyed),
          'Destroy should be received'
        ).toBeTruthy();

        // A new player reusing the nativeId must not reach the listeners of the destroyed one. Its initialization
        // runs on the native main queue after the destroy, so the listeners are removed by then.
        await withPlayerWithNativeId(nativeId, async (newPlayer) => {
          await playWhenReady(newPlayer, () =>
            newPlayer.load(Sources.artOfMotionHls)
          );
        });
        expect(samePlayerReadyCount, 'Ready of the new player').toBe(0);
      }
    );

    spec.it('removes all listeners when the player is destroyed', async () => {
      const player = createPlayer();
      const received: Event[] = [];
      const record = (event: Event) => received.push(event);
      player.on('timeChanged', record);
      player.on('destroy', record);
      const source = new Source({
        ...Sources.artOfMotionHls,
        metadata: { label: 'event-source' },
      });
      await source.on('sourceUnloaded', record);
      await player.initialize();
      await playWhenReady(player, () => player.loadSource(source));

      const isPlaying = await waitUntil(
        () => received.some((event) => event.name === 'onTimeChanged'),
        20000
      );
      expect(isPlaying, 'TimeChanged should be received').toBeTruthy();

      await player.destroy();
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
      expect(sourceUnloaded?.name).toBe('onSourceUnloaded');
      const countAfterDestroy = received.length;
      await delay(1000);
      expect(received.length, 'Events after destroy').toBe(countAfterDestroy);
    });

    spec.it(
      'delivers source events via Source.on until the listener is removed',
      async () => {
        await withPlayer(async (player) => {
          const source = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'event-source' },
          });
          const loaded: SourceLoadedEvent[] = [];
          let removedCount = 0;
          let isUnloaded = false;
          const removedListener = () => removedCount++;
          // Registered before the source is initialized.
          await source.on('sourceLoaded', (event) => loaded.push(event));
          const removedSubscription = await source.on(
            'sourceUnloaded',
            removedListener
          );
          await source.on('sourceUnloaded', () => {
            isUnloaded = true;
          });
          await player.initialize();
          await player.loadSource(source);

          expect(
            await waitUntil(() => loaded.length > 0),
            'SourceLoaded should be received'
          ).toBeTruthy();
          expect(
            loaded[0].source.metadata?.label,
            'Source of SourceLoaded'
          ).toBe(source.config?.metadata?.label);

          removedSubscription.remove();
          await player.unload();

          expect(
            await waitUntil(() => isUnloaded),
            'SourceUnloaded should be received'
          ).toBeTruthy();
          expect(removedCount, 'Listener removed via off').toBe(0);
        });
      }
    );

    spec.it('warns when registering a listener after destroying', async () => {
      const player = createPlayer();
      await player.initialize();
      await player.destroy();
      const warnings: string[] = [];
      const warn = console.warn;
      console.warn = (...args: unknown[]) => warnings.push(args.join(' '));
      try {
        player.on('ready', () => {});
      } finally {
        console.warn = warn;
      }
      expect(
        warnings.some((warning) => warning.includes('player was destroyed')),
        'Warning for the destroyed player'
      ).toBeTruthy();
    });

    spec.it(
      'delivers SourceUnloaded through the owned source after unloading',
      async () => {
        await withPlayer(async (player) => {
          const unloaded: SourceUnloadedEvent[] = [];
          let isReady = false;
          player.on('ready', () => {
            isReady = true;
          });
          await player.initialize();
          const source = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'event-source' },
          });
          await source.on('sourceUnloaded', (event) => unloaded.push(event));
          await player.loadSource(source);
          expect(
            await waitUntil(() => isReady),
            'Ready should be received'
          ).toBeTruthy();

          await player.unload();

          expect(
            await waitUntil(() => unloaded.length > 0),
            'SourceUnloaded should be received'
          ).toBeTruthy();
          expect(unloaded[0].name).toBe('onSourceUnloaded');
        });
      }
    );
  });
};
