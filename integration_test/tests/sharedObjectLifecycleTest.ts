import {
  BufferApi,
  BufferType,
  Player,
  Source,
} from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventBag,
  EventType,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

async function remountPlayerView(player: Player): Promise<void> {
  const world = PlayerTestWorld.shared;
  const reRender = world.onReRender;
  if (!reRender) {
    throw new Error('The player test view is not mounted');
  }
  const previousOnReady = world.onPlayerViewReady;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  // TestablePlayer keys its native view by render count. Observe the replacement
  // view's readiness before asking the world to increment that count.
  const ready = new Promise<void>((resolve, reject) => {
    timeout = setTimeout(
      () =>
        reject(new Error('The replacement player view did not become ready')),
      10000
    );
    world.onPlayerViewReady = (readyPlayer) => {
      previousOnReady(readyPlayer);
      if (readyPlayer === player) {
        resolve();
      }
    };
  });
  try {
    reRender();
    await ready;
  } finally {
    clearTimeout(timeout);
    world.onPlayerViewReady = previousOnReady;
  }
}

export default (spec: TestScope) => {
  spec.describe('SharedObject lifecycle compatibility', () => {
    spec.it(
      'keeps same-ID player and source objects separate and round-trips source metadata',
      async () => {
        const nativeId = 'shared-object-lifecycle-types';
        const buffer = new BufferApi(nativeId);
        await startPlayerTest({ nativeId }, async () => {
          await callPlayer(async (player) => {
            const levels = await buffer.getLevel(BufferType.FORWARD_DURATION);
            expect(typeof levels.audio.level).toBe('number');
            expect(typeof levels.video.level).toBe('number');
            const source = new Source({
              ...Sources.artOfMotionHls,
              nativeId: player.nativeId,
              metadata: { lifecycle: 'initial' },
            });
            try {
              const alias = new Source({
                ...Sources.artOfMotionHls,
                nativeId: source.nativeId,
              });
              expect(alias === source).toBe(false);
              expect(new Player({ nativeId: player.nativeId }) === player).toBe(
                false
              );
              expect(player.isDestroyed).toBe(false);

              await source.initialize();
              expect(await alias.metadata()).toEqual({ lifecycle: 'initial' });
              alias.setMetadata({ lifecycle: 'updated' });
              expect(await source.metadata()).toEqual({ lifecycle: 'updated' });
            } finally {
              source.destroy();
            }
            expect(player.isDestroyed).toBe(false);
            expect(typeof (await player.getVolume())).toBe('number');
          });
        });
      }
    );

    spec.it(
      'loads, plays and seeks through aliases and recreates a destroyed player ID',
      async () => {
        const nativeId = 'shared-object-lifecycle-player';
        let retiredPlayer: Player | undefined;
        for (let generation = 0; generation < 2; generation++) {
          await startPlayerTest({ nativeId }, async () => {
            await callPlayer(async (player) => {
              expect(player !== retiredPlayer).toBe(true);
              // A stale destroy must not retire the current generation.
              retiredPlayer?.destroy();
              expect(new Player({ nativeId }) === player).toBe(false);
            });
            const alias = new Player({ nativeId });
            const source = new Source(Sources.artOfMotionHls);
            try {
              await callPlayerAndExpectEvents(
                (player) => {
                  alias.loadSource(source);
                },
                EventBag(EventType.SourceLoaded, EventType.Ready)
              );
              await callPlayerAndExpectEvent((player) => {
                new Player({ nativeId: player.nativeId }).play();
              }, EventType.Playing);
              await callPlayerAndExpectEvent((player) => {
                player.pause();
              }, EventType.Paused);
              await callPlayerAndExpectEvent((player) => {
                player.seek(12);
              }, EventType.Seeked);
              await callPlayer(async (player) => {
                expect(await player.getDuration()).toBeGreaterThan(12);
                expect(await player.getCurrentTime()).toBeCloseTo(12, 0);
                expect(await source.isAttachedToPlayer()).toBe(true);
                expect(alias.source === source).toBe(true);
                retiredPlayer = player;
              });
              await callPlayerAndExpectEvent((player) => {
                player.destroy();
              }, EventType.Destroy);
            } finally {
              source.destroy();
            }
          });
        }
      }
    );

    spec.it(
      'keeps the player usable after its native view is remounted',
      async () => {
        await startPlayerTest({}, async () => {
          await loadSourceConfig(Sources.artOfMotionHls);
          await callPlayer(async (player) => {
            await remountPlayerView(player);
            expect(player.isDestroyed).toBe(false);
            expect(await player.getDuration()).toBeGreaterThan(0);
            expect(new Player({ nativeId: player.nativeId }) === player).toBe(
              false
            );
          });
          await callPlayerAndExpectEvent((player) => {
            player.play();
          }, EventType.Playing);
        });
      }
    );
  });
};
