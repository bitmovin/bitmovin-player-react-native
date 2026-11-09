import { Platform } from 'react-native';
import { TestScope } from 'cavy';
import {
  LoadingState,
  PlaylistTransitionEvent,
  ReplayMode,
  SeekEvent,
  Source,
  SourceAddedEvent,
  SourceLoadedEvent,
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
  untilActive,
  waitUntil,
  createPlayer,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';

export default (spec: TestScope) => {
  // TODO(#1161): Run on iOS too, once its bridge supports playlists.
  if (Platform.OS !== 'android') return;

  spec.describe('loading a playlist', () => {
    spec.it(
      'emits SourceAdded for every source before PlayerActive',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);

          const events = await callPlayerAndExpectEvents(
            (player) => {
              player.loadPlaylist({ sources: [first, second] });
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

        await callPlayerAndExpectEvent((player) => {
          player.loadPlaylist({ sources: [first, second] });
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

    spec.it('throws for an empty playlist', async () => {
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          expect(
            getError(() => player.loadPlaylist({ sources: [] })),
            'loadPlaylist should throw'
          ).toBeDefined();
        });
      });
    });

    spec.it('throws for an unknown replay mode', async () => {
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          expect(
            getError(() =>
              player.loadPlaylist({
                sources: [new Source(Sources.artOfMotionHls)],
                options: { replayMode: 'unknown' as ReplayMode },
              })
            ),
            'loadPlaylist should throw'
          ).toBeDefined();
        });
      });
    });

    spec.it('throws for a destroyed source', async () => {
      await startPlayerTest({}, async () => {
        const source = new Source(Sources.artOfMotionHls);
        source.destroy();

        await callPlayer(async (player) => {
          expect(
            getError(() => player.loadPlaylist({ sources: [source] })),
            'loadPlaylist should throw'
          ).toBeDefined();
        });
      });
    });

    spec.it('resolves the active source after overlapping loads', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayer(async (player) => {
          player.loadPlaylist({ sources: [first] });
          player.loadPlaylist({ sources: [second] });
          // The loads are sent in call order, so the second one ends up active.
          expect(
            await untilActive(player, second),
            'Second source is active'
          ).toBeTruthy();
          const sources = await player.playlist.getSources();
          expect(
            sources.map((source) => source.nativeId),
            'Sources of the playlist'
          ).toEqual([second.nativeId]);
        });
      });
    });

    spec.it('preloads all sources when enabled', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent((player) => {
          player.loadPlaylist({
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

    spec.it(
      'delivers SourceLoaded of a preloaded inactive source via Source.on',
      async () => {
        const player = createPlayer();
        try {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          const secondLoaded: SourceLoadedEvent[] = [];
          const playerLoaded: SourceLoadedEvent[] = [];
          second.on('sourceLoaded', (event) => secondLoaded.push(event));
          player.on('sourceLoaded', (event) => playerLoaded.push(event));
          await player.initialize();

          player.loadPlaylist({
            sources: [first, second],
            options: { preloadAllSources: true },
          });

          const isLoaded = await waitUntil(async () => secondLoaded.length > 0);
          expect(isLoaded, 'SourceLoaded of the second source').toBeTruthy();
          expect(secondLoaded[0].source.nativeId).toBe(second.nativeId);
          expect(await second.isActive()).toBeFalsy();
          expect(
            playerLoaded.some(
              (event) => event.source.nativeId === second.nativeId
            ),
            'Player SourceLoaded of the inactive source'
          ).toBeFalsy();
        } finally {
          player.destroy();
        }
      }
    );
  });

  spec.describe('transitioning between playlist sources', () => {
    spec.it(
      'emits PlaylistTransition when seeking to another source',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);

          await callPlayerAndExpectEvent((player) => {
            player.loadPlaylist({ sources: [first, second] });
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

        await callPlayerAndExpectEvent((player) => {
          player.loadPlaylist({ sources: [first, second] });
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

    spec.it(
      'transitions to the next source at the end of a source',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);

          await callPlayerAndExpectEvent((player) => {
            player.loadPlaylist({ sources: [first, second] });
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

        await callPlayerAndExpectEvent((player) => {
          player.loadPlaylist({ sources: [first, second] });
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
        second.destroy();
        third.destroy();
      });
    });

    spec.it(
      'keeps the listeners of a removed source that is added again',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          const secondLoaded: SourceLoadedEvent[] = [];
          second.on('sourceLoaded', (event) => secondLoaded.push(event));

          await callPlayerAndExpectEvent((player) => {
            player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          await callPlayerAndExpectEvent(async (player) => {
            await player.playlist.remove(second);
          }, EventType.SourceRemoved);
          await callPlayerAndExpectEvent(async (player) => {
            await player.playlist.add(second);
          }, EventType.SourceAdded);
          await callPlayer(async (player) => {
            const sources = await player.playlist.getSources();
            expect(sources.map((source) => source.nativeId)).toEqual([
              first.nativeId,
              second.nativeId,
            ]);
            secondLoaded.length = 0;
            await player.playlist.seek(second, 0);
          });

          const isLoaded = await waitUntil(async () => secondLoaded.length > 0);
          expect(isLoaded, 'SourceLoaded of the re-added source').toBeTruthy();
        });
      }
    );

    spec.it(
      'does not destroy the removed sources with the player',
      async () => {
        const player = createPlayer();
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);
        const third = new Source(Sources.artOfMotionHls);
        try {
          await player.initialize();
          player.loadPlaylist({ sources: [first, second, third] });
          expect(await untilActive(player, first), 'Loaded').toBeTruthy();
          await player.playlist.remove(second);
          expect(
            await player.playlist.removeAt(1),
            'Source removed at index 1'
          ).toBe(third);

          player.destroy();

          expect(
            await waitUntil(() => first.isDestroyed),
            'Active source destroyed with the player'
          ).toBeTruthy();
          expect(second.isDestroyed, 'Removed source destroyed').toBeFalsy();
          expect(third.isDestroyed, 'Source removed at index').toBeFalsy();
        } finally {
          player.destroy();
          second.destroy();
          third.destroy();
        }
      }
    );

    spec.it('does not remove the active source', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent((player) => {
          player.loadPlaylist({ sources: [first, second] });
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

        await callPlayerAndExpectEvent((player) => {
          player.loadPlaylist({ sources: [first, second] });
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

const getError = (fn: () => void): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
};
