import { TestScope } from 'cavy';
import {
  LoadingState,
  PlaylistTransitionEvent,
  SeekEvent,
  Source,
  SourceAddedEvent,
  SourceRemovedEvent,
} from 'bitmovin-player-react-native';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventSequence,
  EventType,
  FilteredEvent,
  PlainEvent,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';

const waitUntil = async (
  condition: () => Promise<boolean>,
  timeoutMs: number = 10000
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
};

export default (spec: TestScope) => {
  spec.describe('loading a playlist', () => {
    spec.it(
      'emits SourceAdded for every source before PlayerActive',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);

          const events = await callPlayerAndExpectEvents(
            async (player) => {
              await player.loadPlaylist({ sources: [first, second] });
            },
            EventSequence(
              FilteredEvent<SourceAddedEvent>(
                EventType.SourceAdded,
                (event) => event.index === 0
              ),
              FilteredEvent<SourceAddedEvent>(
                EventType.SourceAdded,
                (event) => event.index === 1
              ),
              PlainEvent(EventType.PlayerActive)
            )
          );

          const [firstAdded, secondAdded] = events as SourceAddedEvent[];
          expect(firstAdded.source.nativeId).toBe(first.nativeId);
          expect(secondAdded.source.nativeId).toBe(second.nativeId);
        });
      }
    );

    spec.it('exposes the sources and the active source', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        await callPlayer(async (player) => {
          const sources = await player.playlist.getSources();
          expect(sources).toHaveLength(2);
          expect(sources[0]).toBe(first);
          expect(sources[1]).toBe(second);
          expect(await player.getSource()).toBe(first);
        });
      });
    });

    spec.it('rejects an empty playlist', async () => {
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          let error: unknown;
          try {
            await player.loadPlaylist({ sources: [] });
          } catch (e) {
            error = e;
          }
          expect(error, 'loadPlaylist should reject').toBeDefined();
        });
      });
    });

    spec.it('preloads all sources when enabled', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({
            sources: [first, second],
            options: { preloadAllSources: true },
          });
        }, EventType.Ready);

        const isLoaded = await waitUntil(
          async () => (await second.loadingState()) === LoadingState.LOADED
        );
        expect(isLoaded, 'Second source should be preloaded').toBeTruthy();
        expect(await second.isActive()).toBeFalsy();
      });
    });
  });

  spec.describe('transitioning between playlist sources', () => {
    spec.it(
      'emits PlaylistTransition when seeking to another source',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);

          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          const transition =
            await callPlayerAndExpectEvent<PlaylistTransitionEvent>(
              async (player) => {
                await player.playlist.seek(second, 0);
              },
              EventType.PlaylistTransition
            );
          expect(transition.from.nativeId).toBe(first.nativeId);
          expect(transition.to.nativeId).toBe(second.nativeId);

          await callPlayer(async (player) => {
            expect(await player.getSource()).toBe(second);
          });
        });
      }
    );

    spec.it('emits Seek with the positions of both sources', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        const seek = await callPlayerAndExpectEvent<SeekEvent>(
          async (player) => {
            await player.playlist.seek(second, 10);
          },
          EventType.Seek
        );
        expect(seek.from.source.nativeId).toBe(first.nativeId);
        expect(seek.to.source.nativeId).toBe(second.nativeId);
      });
    });

    spec.it('emits PlaylistTransition when seeking to a target', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({
            sources: [first, second],
            options: { preloadAllSources: true },
          });
        }, EventType.Ready);
        await waitUntil(
          async () => (await second.loadingState()) === LoadingState.LOADED
        );

        await callPlayerAndExpectEvent<PlaylistTransitionEvent>(
          async (player) => {
            await player.playlist.seekTo(second, { offset: 10 });
          },
          FilteredEvent<PlaylistTransitionEvent>(
            EventType.PlaylistTransition,
            (event) => event.to.nativeId === second.nativeId
          )
        );
      });
    });

    spec.it(
      'transitions to the next source at the end of a source',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);

          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          const duration = await first.duration();
          await callPlayerAndExpectEvent<PlaylistTransitionEvent>(
            (player) => {
              player.seek(duration - 2);
              player.play();
            },
            FilteredEvent<PlaylistTransitionEvent>(
              EventType.PlaylistTransition,
              (event) => event.to.nativeId === second.nativeId
            ),
            30
          );
        });
      }
    );
  });

  spec.describe('modifying a playlist', () => {
    spec.it('emits SourceAdded and SourceRemoved', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);
        const third = new Source(Sources.artOfMotionHls);

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        const added = await callPlayerAndExpectEvent<SourceAddedEvent>(
          async (player) => {
            await player.playlist.add(third, 1);
          },
          EventType.SourceAdded
        );
        expect(added.index).toBe(1);
        expect(added.source.nativeId).toBe(third.nativeId);

        await callPlayer(async (player) => {
          const sources = await player.playlist.getSources();
          expect(sources).toHaveLength(3);
          expect(sources[1]).toBe(third);
        });

        const removed = await callPlayerAndExpectEvent<SourceRemovedEvent>(
          async (player) => {
            await player.playlist.remove(third);
          },
          EventType.SourceRemoved
        );
        expect(removed.index).toBe(1);
        expect(removed.source.nativeId).toBe(third.nativeId);

        await callPlayerAndExpectEvent<SourceRemovedEvent>(
          async (player) => {
            await player.playlist.removeAt(1);
          },
          FilteredEvent<SourceRemovedEvent>(
            EventType.SourceRemoved,
            (event) => event.source.nativeId === second.nativeId
          )
        );

        await callPlayer(async (player) => {
          const sources = await player.playlist.getSources();
          expect(sources).toHaveLength(1);
          expect(sources[0]).toBe(first);
        });
      });
    });

    spec.it('does not remove the active source', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        await callPlayerAndExpectEvent(async (player) => {
          await player.playlist.remove(first);
        }, EventType.PlayerWarning);

        await callPlayer(async (player) => {
          const sources = await player.playlist.getSources();
          expect(sources).toHaveLength(2);
        });
      });
    });
  });

  spec.describe('unloading a playlist', () => {
    spec.it('removes all sources and becomes inactive', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        await callPlayerAndExpectEvents(
          (player) => {
            player.unload();
          },
          EventSequence(
            EventType.SourceRemoved,
            EventType.SourceRemoved,
            EventType.PlayerInactive
          )
        );

        await callPlayer(async (player) => {
          expect(await player.playlist.getSources()).toHaveLength(0);
          expect(await player.getSource()).toBeUndefined();
        });
      });
    });
  });
};
