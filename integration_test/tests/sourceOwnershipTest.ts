import { Platform } from 'react-native';
import {
  Player,
  Source,
  type SourceConfig,
  type SourceLoadedEvent,
} from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  FilteredEvent,
  startPlayerTest,
} from '../playertesting';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';

export default (spec: TestScope) => {
  spec.describe('Source ownership', () => {
    spec.it(
      'rejects loading another player source before unloading',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { item: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { item: 'second' },
          });
          await callPlayerAndExpectEvent(
            (player) => player.loadSource(first),
            EventType.Ready
          );
          const other = new Player({
            licenseKey: PlayerTestWorld.defaultLicenseKey,
          });
          try {
            await other.loadSource(second);
            expect(await second.isAttachedToPlayer()).toBeTruthy();
            await callPlayer(async (player) => {
              const error = await player.loadSource(second).then(
                () => undefined,
                (error) => error
              );
              expect(error).toBeDefined();
              expect(await (await player.getSource())?.metadata()).toEqual({
                item: 'first',
              });
            });
          } finally {
            await other.destroy();
          }
          await callPlayerAndExpectEvent(
            (player) => player.loadSource(first),
            EventType.Ready
          );
        });
      }
    );

    spec.it(
      'rejects a source attached to another player before unloading',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { item: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { item: 'second' },
          });
          await callPlayerAndExpectEvent(
            (player) => player.loadPlaylist({ sources: [first] }),
            EventType.Ready
          );
          const other = new Player({
            licenseKey: PlayerTestWorld.defaultLicenseKey,
          });
          try {
            await other.loadSource(second);
            expect(await second.isAttachedToPlayer()).toBeTruthy();
            await callPlayer(async (player) => {
              const error = await player
                .loadPlaylist({ sources: [second] })
                .then(
                  () => undefined,
                  (error) => error
                );
              expect(error).toBeDefined();
              expect(await (await player.getSource())?.metadata()).toEqual({
                item: 'first',
              });
            });
          } finally {
            await other.destroy();
          }
          await callPlayerAndExpectEvent(
            (player) => player.loadPlaylist({ sources: [first] }),
            EventType.Ready
          );
        });
      }
    );

    spec.it('resolves the last of overlapping playlist loads', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source({
          ...Sources.artOfMotionHls,
          metadata: { item: 'second' },
        });
        await callPlayerAndExpectEvent(
          async (player) => {
            await Promise.all([
              player.loadPlaylist({ sources: [first] }),
              player.loadPlaylist({ sources: [second] }),
            ]);
          },
          FilteredEvent<SourceLoadedEvent>(
            EventType.SourceLoaded,
            (event) => event.source.metadata?.item === 'second'
          )
        );
        await callPlayer(async (player) => {
          expect(await player.getSource()).toBe(second);
          const sources = await player.playlist.getSources();
          expect(sources).toHaveLength(1);
          expect(sources[0]).toBe(second);
        });
      });
    });

    spec.it('resolves a source removed and added concurrently', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);
        await callPlayerAndExpectEvent(
          (player) => player.loadPlaylist({ sources: [first, second] }),
          EventType.Ready
        );
        await callPlayer(async (player) => {
          await Promise.all([
            player.playlist.remove(second),
            player.playlist.add(second),
          ]);
          const sources = await player.playlist.getSources();
          expect(sources).toHaveLength(2);
          expect(sources[0]).toBe(first);
          expect(sources[1]).toBe(second);
        });
      });
    });

    spec.it(
      'resolves a source removed and reloaded as a playlist concurrently',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          await callPlayerAndExpectEvent(
            (player) => player.loadPlaylist({ sources: [first, second] }),
            EventType.Ready
          );
          await callPlayerAndExpectEvent(async (player) => {
            await Promise.all([
              player.playlist.remove(second),
              player.loadPlaylist({ sources: [second] }),
            ]);
          }, EventType.Ready);
          await callPlayer(async (player) => {
            const sources = await player.playlist.getSources();
            expect(sources).toHaveLength(1);
            expect(sources[0]).toBe(second);
            expect(await player.getSource()).toBe(second);
          });
        });
      }
    );

    spec.it(
      'resolves a source removed by index and loaded concurrently',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          await callPlayerAndExpectEvent(
            (player) => player.loadPlaylist({ sources: [first, second] }),
            EventType.Ready
          );
          await callPlayerAndExpectEvent(async (player) => {
            await Promise.all([
              player.playlist.removeAt(1),
              player.loadSource(second),
            ]);
          }, EventType.Ready);
          await callPlayer(async (player) => {
            expect(await player.getSource()).toBe(second);
          });
        });
      }
    );

    if (Platform.OS === 'android') {
      spec.it(
        'rejects malformed Source config with an invalid-argument error',
        async () => {
          // JavaScript callers do not have the TypeScript requirement for `type`.
          const source = new Source({
            url: Sources.artOfMotionHls.url,
          } as SourceConfig);
          let failure: unknown;
          try {
            await source.initialize();
          } catch (error) {
            failure = error;
          }
          expect(failure, 'Malformed source config rejects').toBeDefined();
          expect(
            (failure as { code: string }).code,
            'Invalid-argument error code'
          ).toBe('ERR_INVALID_ARGUMENT');
        }
      );
    }
    if (Platform.OS === 'ios') {
      spec.it(
        'rejects unsupported source loading without replacing playback',
        async () => {
          await startPlayerTest({}, async () => {
            const current = new Source(Sources.artOfMotionHls);
            await callPlayerAndExpectEvent(
              (player) => player.loadSource(current),
              EventType.Ready
            );
            await callPlayer(async (player) => {
              let rejection;
              try {
                await player.loadSource(new Source(Sources.artOfMotionDash));
              } catch (error) {
                rejection = error;
              }
              expect(rejection, 'Unsupported source rejects').toBeDefined();
              expect(
                await player.getSource(),
                'Existing source remains active'
              ).toBe(current);
            });
          });
        }
      );
    }
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
          });
          await callPlayerAndExpectEvent(
            (player) => player.playlist.seek(second, 0),
            EventType.PlaylistTransition
          );
          await callPlayer(async (player) => {
            expect(await player.getSource()).toBe(second);
          });
        });
      }
    );
  });
};
