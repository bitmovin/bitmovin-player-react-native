import { Platform } from 'react-native';
import { TestScope } from 'cavy';
import {
  LoadingState,
  Player,
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
  waitUntil,
  createPlayer,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';

export default (spec: TestScope) => {
  spec.describe('loading a playlist', () => {
    spec.it(
      'emits SourceAdded for every source before PlayerActive',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { label: 'second' },
          });

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
          expect(firstAdded.source.metadata?.label).toBe(
            first.config?.metadata?.label
          );
          expect(secondAdded.source.metadata?.label).toBe(
            second.config?.metadata?.label
          );
        });
      }
    );

    spec.it('exposes the sources and the active source', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source({
          ...Sources.artOfMotionHls,
          metadata: { label: 'first' },
        });
        const second = new Source({
          ...Sources.sintel,
          metadata: { label: 'second' },
        });

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

    spec.it(
      'rejects for an empty playlist and keeps the current session',
      async () => {
        await startPlayerTest({}, async () => {
          const source = new Source(Sources.artOfMotionHls);
          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [source] });
          }, EventType.Ready);

          await callPlayer(async (player) => {
            expect(
              await getError(() => player.loadPlaylist({ sources: [] })),
              'loadPlaylist should reject'
            ).toBeDefined();
            expect(await player.getSource()).toBe(source);
          });
        });
      }
    );

    spec.it('rejects for an unknown replay mode', async () => {
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          expect(
            await getError(() =>
              player.loadPlaylist({
                sources: [new Source(Sources.artOfMotionHls)],
                options: { replayMode: 'unknown' as ReplayMode },
              })
            ),
            'loadPlaylist should reject'
          ).toBeDefined();
        });
      });
    });

    if (Platform.OS === 'ios') {
      spec.it('rejects for a DASH source on iOS', async () => {
        // The iOS SDK only supports HLS, progressive and movpkg sources in a playlist.

        await startPlayerTest({}, async () => {
          await callPlayer(async (player) => {
            expect(
              await getError(() =>
                player.loadPlaylist({
                  sources: [
                    new Source(Sources.artOfMotionHls),
                    new Source(Sources.artOfMotionDash),
                  ],
                })
              ),
              'loadPlaylist should reject'
            ).toBeDefined();
            expect(await player.getSource(), 'Active source').toBeUndefined();
          });
        });
      });
    }

    spec.it('rejects for a source listed twice', async () => {
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          const source = new Source(Sources.artOfMotionHls);
          expect(
            await getError(() =>
              player.loadPlaylist({ sources: [source, source] })
            ),
            'loadPlaylist should reject'
          ).toBeDefined();
          expect(await player.getSource(), 'Active source').toBeUndefined();
        });
      });
    });

    if (Platform.OS === 'ios') {
      spec.it(
        'does not load a source attached to another player on iOS',
        async () => {
          // Loading a source attached to another player crashes the iOS SDK, so the bridge rejects it.

          await startPlayerTest({}, async () => {
            const source = new Source(Sources.artOfMotionHls);

            await callPlayerAndExpectEvent(async (player) => {
              await player.loadPlaylist({ sources: [source] });
            }, EventType.Ready);

            const otherPlayer = createPlayer();
            try {
              await otherPlayer.initialize();
              expect(
                await getError(() =>
                  otherPlayer.loadPlaylist({ sources: [source] })
                ),
                'Foreign attached source rejects'
              ).toBeDefined();
              // Native handles calls in order, so this reflects the rejected load.
              expect(
                await otherPlayer.getSource(),
                'Active source of the other player'
              ).toBeUndefined();

              await callPlayer(async (player) => {
                expect(await player.getSource(), 'Active source').toBe(source);
                expect(
                  await source.isActive(),
                  'Source is active'
                ).toBeTruthy();
              });
            } finally {
              await otherPlayer.destroy();
            }
          });
        }
      );
    }

    spec.it('resolves the active source after overlapping loads', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source({
          ...Sources.artOfMotionHls,
          metadata: { label: 'first' },
        });
        const second = new Source({
          ...Sources.sintel,
          metadata: { label: 'second' },
        });

        await callPlayer(async (player) => {
          await Promise.all([
            player.loadPlaylist({ sources: [first] }),
            player.loadPlaylist({ sources: [second] }),
          ]);
          // The loads are sent in call order, so the second one ends up active.
          const isSecondActive = await waitUntil(
            async () => (await player.getSource()) === second
          );
          expect(isSecondActive, 'Second source is active').toBeTruthy();
          const sources = await player.playlist.getSources();
          expect(
            sources.map((source) => source.config?.metadata?.label),
            'Sources of the playlist'
          ).toEqual([second.config?.metadata?.label]);
        });
      });
    });

    spec.it('preloads all sources when enabled', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source({
          ...Sources.artOfMotionHls,
          metadata: { label: 'first' },
        });
        const second = new Source({
          ...Sources.sintel,
          metadata: { label: 'second' },
        });

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

    spec.it(
      'delivers SourceLoaded of a preloaded inactive source via Source.on',
      async () => {
        const player = createPlayer();
        try {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { label: 'second' },
          });
          const secondLoaded: SourceLoadedEvent[] = [];
          const playerLoaded: SourceLoadedEvent[] = [];
          await second.on('sourceLoaded', (event) => secondLoaded.push(event));
          player.on('sourceLoaded', (event) => playerLoaded.push(event));
          await player.initialize();

          await player.loadPlaylist({
            sources: [first, second],
            options: { preloadAllSources: true },
          });

          const isLoaded = await waitUntil(async () => secondLoaded.length > 0);
          expect(isLoaded, 'SourceLoaded of the second source').toBeTruthy();
          expect(secondLoaded[0].source.metadata?.label).toBe(
            second.config?.metadata?.label
          );
          expect(await second.isActive()).toBeFalsy();
          expect(
            playerLoaded.some(
              (event) =>
                event.source.metadata?.label === second.config?.metadata?.label
            ),
            'Player SourceLoaded of the inactive source'
          ).toBeFalsy();
        } finally {
          await player.destroy();
        }
      }
    );
  });

  spec.describe('transitioning between playlist sources', () => {
    spec.it(
      'emits PlaylistTransition when seeking to another source',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { label: 'second' },
          });

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
          expect(transition.from.metadata?.label).toBe(
            first.config?.metadata?.label
          );
          expect(transition.to.metadata?.label).toBe(
            second.config?.metadata?.label
          );

          await callPlayer(async (player) => {
            expect(await player.getSource()).toBe(second);
          });
        });
      }
    );

    spec.it('emits Seek with the positions of both sources', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source({
          ...Sources.artOfMotionHls,
          metadata: { label: 'first' },
        });
        const second = new Source({
          ...Sources.sintel,
          metadata: { label: 'second' },
        });

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        const seek = await callPlayerAndExpectEvent<SeekEvent>(
          async (player) => {
            await player.playlist.seek(second, 10);
          },
          EventType.Seek
        );
        expect(seek.from.source.metadata?.label).toBe(
          first.config?.metadata?.label
        );
        expect(seek.to.source.metadata?.label).toBe(
          second.config?.metadata?.label
        );
      });
    });

    spec.it(
      'transitions to the next source at the end of a source',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { label: 'second' },
          });

          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          const duration = await first.duration();
          await callPlayerAndExpectEvent<PlaylistTransitionEvent>(
            async (player) => {
              await player.seek(duration - 2);
              await player.play();
            },
            FilteredEvent<PlaylistTransitionEvent>(
              EventType.PlaylistTransition,
              (event) =>
                event.to.metadata?.label === second.config?.metadata?.label
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
        const first = new Source({
          ...Sources.artOfMotionHls,
          metadata: { label: 'first' },
        });
        const second = new Source({
          ...Sources.sintel,
          metadata: { label: 'second' },
        });
        const third = new Source({
          ...Sources.artOfMotionHls,
          metadata: { label: 'third' },
        });

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
        expect(added.source.metadata?.label).toBe(
          third.config?.metadata?.label
        );

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
        expect(removed.source.metadata?.label).toBe(
          third.config?.metadata?.label
        );

        await callPlayerAndExpectEvent<SourceRemovedEvent>(
          async (player) => {
            await player.playlist.removeAt(1);
          },
          FilteredEvent<SourceRemovedEvent>(
            EventType.SourceRemoved,
            (event) =>
              event.source.metadata?.label === second.config?.metadata?.label
          )
        );

        await callPlayer(async (player) => {
          const sources = await player.playlist.getSources();
          expect(sources).toHaveLength(1);
          expect(sources[0]).toBe(first);
        });
      });
    });

    spec.it(
      'keeps the listeners of a removed source that is added again',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { label: 'second' },
          });
          const secondLoaded: SourceLoadedEvent[] = [];
          await second.on('sourceLoaded', (event) => secondLoaded.push(event));

          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          await callPlayerAndExpectEvent(async (player) => {
            await player.playlist.remove(second);
          }, EventType.SourceRemoved);
          // The source keeps its native object and listeners while it is removed from the playlist.
          await callPlayerAndExpectEvent(async (player) => {
            await player.playlist.add(second);
          }, EventType.SourceAdded);
          await callPlayer(async (player) => {
            const sources = await player.playlist.getSources();
            expect(
              sources.map((source) => source.config?.metadata?.label)
            ).toEqual([
              first.config?.metadata?.label,
              second.config?.metadata?.label,
            ]);
            // Only count the events of the re-added source from here on.
            secondLoaded.length = 0;
            await player.playlist.seek(second, 0);
          });

          const isLoaded = await waitUntil(async () => secondLoaded.length > 0);
          expect(isLoaded, 'SourceLoaded of the re-added source').toBeTruthy();
        });
      }
    );

    spec.it(
      'resolves a source that is removed and added again at the same time',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { label: 'second' },
          });
          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          await callPlayer(async (player) => {
            await Promise.all([
              player.playlist.remove(second),
              player.playlist.add(second),
            ]);
            const isReAdded = await waitUntil(async () => {
              const sources = await player.playlist.getSources();
              return sources.length === 2;
            });
            expect(isReAdded, 'Both sources in the playlist').toBeTruthy();
            const sources = await player.playlist.getSources();
            expect(sources[1], 'Re-added source').toBe(second);
          });
        });
      }
    );

    spec.it('does not remove the active source', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source({
          ...Sources.artOfMotionHls,
          metadata: { label: 'first' },
        });
        const second = new Source({
          ...Sources.sintel,
          metadata: { label: 'second' },
        });

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        // Both SDKs keep the active source, but they report the rejected removal differently:
        // Android emits PlayerWarning, while the iOS SDK only logs a warning ("Removing the currently
        // active source is not supported.") because PlayerWarningEvent is deprecated there. The log
        // is not observable from JS, so iOS only checks that the source was not removed.
        if (Platform.OS === 'android') {
          await callPlayerAndExpectEvent(async (player) => {
            await player.playlist.remove(first);
          }, EventType.PlayerWarning);
        } else {
          await callPlayer(async (player) => {
            await player.playlist.remove(first);
          });
        }

        await callPlayer(async (player) => {
          const sources = await player.playlist.getSources();
          expect(sources).toHaveLength(2);
        });
      });
    });

    if (Platform.OS === 'ios') {
      spec.it('rejects adding a DASH source on iOS', async () => {
        // The iOS SDK only supports HLS, progressive and movpkg sources in a playlist.

        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { label: 'second' },
          });

          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          await callPlayer(async (player) => {
            let error: unknown;
            try {
              await player.playlist.add(new Source(Sources.artOfMotionDash));
            } catch (e) {
              error = e;
            }
            expect(error, 'add should reject').toBeDefined();
            const sources = await player.playlist.getSources();
            expect(sources).toHaveLength(2);
            expect(sources[0]).toBe(first);
            expect(sources[1]).toBe(second);
          });
        });
      });
    }

    if (Platform.OS === 'ios') {
      spec.it('rejects adding an attached source on iOS', async () => {
        // The iOS SDK only logs a warning for a source that is already part of the playlist.

        await startPlayerTest({}, async () => {
          const first = new Source({
            ...Sources.artOfMotionHls,
            metadata: { label: 'first' },
          });
          const second = new Source({
            ...Sources.sintel,
            metadata: { label: 'second' },
          });

          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          await callPlayer(async (player) => {
            let error: unknown;
            try {
              await player.playlist.add(second);
            } catch (e) {
              error = e;
            }
            expect(error, 'add should reject').toBeDefined();
            const sources = await player.playlist.getSources();
            expect(sources).toHaveLength(2);
            expect(sources[0]).toBe(first);
            expect(sources[1]).toBe(second);
          });
        });
      });
    }
  });

  spec.describe('unloading a playlist', () => {
    spec.it('removes all sources and becomes inactive', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source({
          ...Sources.artOfMotionHls,
          metadata: { label: 'first' },
        });
        const second = new Source({
          ...Sources.sintel,
          metadata: { label: 'second' },
        });

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        await callPlayerAndExpectEvents(
          async (player) => {
            await player.unload();
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

  spec.describe('destroying a player', () => {
    spec.it(
      'leaves the source of another player intact, and its own sources can be loaded again',
      async () => {
        const playerA = createPlayer();
        const playerB = createPlayer();
        try {
          await playerA.initialize();
          await playerB.initialize();
          const moved = new Source(Sources.artOfMotionHls);
          const current = new Source(Sources.sintel);
          await playerA.loadPlaylist({ sources: [moved] });
          expect(await untilActive(playerA, moved), 'Loaded in A').toBeTruthy();
          await playerA.loadPlaylist({ sources: [current] });
          expect(
            await untilActive(playerA, current),
            'Replaced in A'
          ).toBeTruthy();
          await playerB.loadPlaylist({ sources: [moved] });
          expect(await untilActive(playerB, moved), 'Moved to B').toBeTruthy();

          await playerA.destroy();

          expect(await playerB.getSource()).toBe(moved);
          await playerB.loadPlaylist({ sources: [current] });
          expect(
            await untilActive(playerB, current),
            'Reloaded source'
          ).toBeTruthy();
          expect(await current.isActive(), 'Reloaded source').toBeTruthy();
        } finally {
          await playerA.destroy();
          await playerB.destroy();
        }
      }
    );
  });
};

const getError = async (fn: () => void | Promise<void>): Promise<unknown> => {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  return undefined;
};

const untilActive = (player: Player, source: Source) =>
  waitUntil(async () => (await player.getSource()) === source);
