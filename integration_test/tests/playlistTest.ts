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
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);

          const events = await callPlayerAndExpectEvents(
            (player) => {
              return player.loadPlaylist({ sources: [first, second] });
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
          return player.loadPlaylist({ sources: [first, second] });
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
      'throws for an empty playlist and keeps the current session',
      async () => {
        await startPlayerTest({}, async () => {
          const source = new Source(Sources.artOfMotionHls);
          await callPlayerAndExpectEvent((player) => {
            return player.loadPlaylist({ sources: [source] });
          }, EventType.Ready);

          await callPlayer(async (player) => {
            expect(
              getError(() => player.loadPlaylist({ sources: [] })),
              'loadPlaylist should throw'
            ).toBeDefined();
            expect(await player.getSource()).toBe(source);
          });
        });
      }
    );

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

    spec.it('throws for a DASH source on iOS', async () => {
      // The iOS SDK only supports HLS, progressive and movpkg sources in a playlist.
      if (Platform.OS !== 'ios') {
        console.warn('Skipping the iOS playlist source type test on Android');
        return;
      }
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          expect(
            getError(() =>
              player.loadPlaylist({
                sources: [
                  new Source(Sources.artOfMotionHls),
                  new Source(Sources.artOfMotionDash),
                ],
              })
            ),
            'loadPlaylist should throw'
          ).toBeDefined();
          expect(await player.getSource(), 'Active source').toBeUndefined();
        });
      });
    });

    spec.it('throws for a source listed twice', async () => {
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          const source = new Source(Sources.artOfMotionHls);
          expect(
            getError(() => player.loadPlaylist({ sources: [source, source] })),
            'loadPlaylist should throw'
          ).toBeDefined();
          expect(await player.getSource(), 'Active source').toBeUndefined();
        });
      });
    });

    spec.it(
      'does not load a source attached to another player on iOS',
      async () => {
        // Loading a source attached to another player crashes the iOS SDK, so the bridge rejects it.
        if (Platform.OS !== 'ios') {
          console.warn(
            'Skipping the iOS attached playlist source test on Android'
          );
          return;
        }
        await startPlayerTest({}, async () => {
          const source = new Source(Sources.artOfMotionHls);

          await callPlayerAndExpectEvent((player) => {
            return player.loadPlaylist({ sources: [source] });
          }, EventType.Ready);

          const otherPlayer = createPlayer();
          try {
            await otherPlayer.initialize();
            void otherPlayer.loadPlaylist({ sources: [source] });
            await untilPlaylistLoadIsSent(source);
            // Native handles calls in order, so this reflects the rejected load.
            expect(
              await otherPlayer.getSource(),
              'Active source of the other player'
            ).toBeUndefined();

            await callPlayer(async (player) => {
              expect(await player.getSource(), 'Active source').toBe(source);
              expect(await source.isActive(), 'Source is active').toBeTruthy();
            });
          } finally {
            void otherPlayer.destroy();
          }
          expect(
            source.isDestroyed,
            'Source destroyed with the other player'
          ).toBeFalsy();
        });
      }
    );

    spec.it('resolves the active source after overlapping loads', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayer(async (player) => {
          void player.loadPlaylist({ sources: [first] });
          void player.loadPlaylist({ sources: [second] });
          // The loads are sent in call order, so the second one ends up active.
          const isSecondActive = await waitUntil(
            async () => (await player.getSource()) === second
          );
          expect(isSecondActive, 'Second source is active').toBeTruthy();
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
          return player.loadPlaylist({
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

          void player.loadPlaylist({
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
          void player.destroy();
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
            return player.loadPlaylist({ sources: [first, second] });
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
          return player.loadPlaylist({ sources: [first, second] });
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
            return player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          const duration = await first.duration();
          await callPlayerAndExpectEvent<PlaylistTransitionEvent>(
            (player) => {
              void player.seek(duration - 2);
              void player.play();
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
          return player.loadPlaylist({ sources: [first, second] });
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

        await callPlayerAndExpectEvent((player) => {
          return player.loadPlaylist({ sources: [first, second] });
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

    spec.it(
      'keeps the listeners of a removed source that is added again',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          const secondLoaded: SourceLoadedEvent[] = [];
          second.on('sourceLoaded', (event) => secondLoaded.push(event));

          await callPlayerAndExpectEvent((player) => {
            return player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          await callPlayerAndExpectEvent(async (player) => {
            await player.playlist.remove(second);
          }, EventType.SourceRemoved);
          // The removed source stays initialized, so adding it again reuses its native source.
          await callPlayerAndExpectEvent(async (player) => {
            await player.playlist.add(second);
          }, EventType.SourceAdded);
          await callPlayer(async (player) => {
            const sources = await player.playlist.getSources();
            expect(sources.map((source) => source.nativeId)).toEqual([
              first.nativeId,
              second.nativeId,
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
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          await callPlayerAndExpectEvent((player) => {
            return player.loadPlaylist({ sources: [first, second] });
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

    spec.it(
      'resolves a source that is removed and loaded again at the same time',
      async () => {
        const player = createPlayer();
        try {
          await player.initialize();
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          void player.loadPlaylist({ sources: [first, second] });
          expect(await untilActive(player, first), 'Loaded').toBeTruthy();

          const removal = player.playlist.remove(second);
          void player.loadPlaylist({ sources: [second] });
          await removal;

          expect(
            await untilActive(player, second),
            'Loaded source resolved'
          ).toBeTruthy();
          const sources = await player.playlist.getSources();
          expect(sources, 'Sources of the playlist').toHaveLength(1);
          expect(sources[0], 'Source of the playlist').toBe(second);
          void player.destroy();
          expect(second.isDestroyed, 'Loaded source destroyed').toBeTruthy();
        } finally {
          void player.destroy();
        }
      }
    );

    spec.it(
      'resolves a source that is removed by index and loaded again at the same time',
      async () => {
        const player = createPlayer();
        try {
          await player.initialize();
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          void player.loadPlaylist({ sources: [first, second] });
          expect(await untilActive(player, first), 'Loaded').toBeTruthy();

          const removal = player.playlist.removeAt(1);
          void player.loadSource(second);
          await removal;

          expect(
            await untilActive(player, second),
            'Loaded source resolved'
          ).toBeTruthy();
          void player.destroy();
          expect(second.isDestroyed, 'Loaded source destroyed').toBeTruthy();
        } finally {
          void player.destroy();
        }
      }
    );

    spec.it('rejects adding a DASH source on iOS', async () => {
      // The iOS SDK only supports HLS, progressive and movpkg sources in a playlist.
      if (Platform.OS !== 'ios') {
        console.warn(
          'Skipping the iOS playlist add source type test on Android'
        );
        return;
      }
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent((player) => {
          return player.loadPlaylist({ sources: [first, second] });
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

    spec.it('rejects adding an attached source on iOS', async () => {
      // The iOS SDK only logs a warning for a source that is already part of the playlist.
      if (Platform.OS !== 'ios') {
        console.warn(
          'Skipping the iOS playlist add attached source test on Android'
        );
        return;
      }
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent((player) => {
          return player.loadPlaylist({ sources: [first, second] });
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
  });

  spec.describe('unloading a playlist', () => {
    spec.it('removes all sources and becomes inactive', async () => {
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent((player) => {
          return player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        await callPlayerAndExpectEvents(
          (player) => {
            return player.unload();
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
      'destroys its sources, but not the ones removed from its playlist',
      async () => {
        const playerA = createPlayer();
        const playerB = createPlayer();
        try {
          await playerA.initialize();
          await playerB.initialize();
          const kept = new Source(Sources.artOfMotionHls);
          const removed = new Source(Sources.sintel);
          void playerA.loadPlaylist({ sources: [kept, removed] });
          expect(await untilActive(playerA, kept), 'Loaded in A').toBeTruthy();
          await playerA.playlist.remove(removed);

          void playerA.destroy();

          expect(kept.isDestroyed, 'Source of A').toBeTruthy();
          expect(removed.isDestroyed, 'Source removed from A').toBeFalsy();
          void playerB.loadPlaylist({ sources: [removed] });
          expect(
            await untilActive(playerB, removed),
            'Removed source loaded into B'
          ).toBeTruthy();
          expect(await removed.isActive(), 'Removed source').toBeTruthy();
        } finally {
          void playerA.destroy();
          void playerB.destroy();
        }
      }
    );

    spec.it(
      'does not destroy a source loaded into another player since',
      async () => {
        const playerA = createPlayer();
        const playerB = createPlayer();
        try {
          await playerA.initialize();
          await playerB.initialize();
          const moved = new Source(Sources.artOfMotionHls);
          const next = new Source(Sources.sintel);
          void playerA.loadSource(moved);
          expect(await untilActive(playerA, moved), 'Loaded in A').toBeTruthy();
          void playerA.loadSource(next);
          expect(
            await untilActive(playerA, next),
            'Next source loaded in A'
          ).toBeTruthy();
          void playerB.loadSource(moved);
          expect(await untilActive(playerB, moved), 'Moved to B').toBeTruthy();

          void playerA.destroy();

          expect(next.isDestroyed, 'Source of A').toBeTruthy();
          expect(moved.isDestroyed, 'Source moved to B').toBeFalsy();
          expect(await moved.isActive(), 'Source moved to B').toBeTruthy();
        } finally {
          void playerA.destroy();
          void playerB.destroy();
        }
      }
    );

    spec.it(
      'does not destroy a source of another player whose load or add failed',
      async () => {
        const playerA = createPlayer();
        const playerB = createPlayer();
        try {
          await playerA.initialize();
          await playerB.initialize();
          const shared = new Source(Sources.artOfMotionHls);
          void playerA.loadPlaylist({ sources: [shared] });
          expect(
            await untilActive(playerA, shared),
            'Loaded in A'
          ).toBeTruthy();
          const own = new Source(Sources.sintel);
          void playerB.loadPlaylist({ sources: [own] });
          expect(await untilActive(playerB, own), 'Loaded in B').toBeTruthy();

          let addError: unknown;
          try {
            await playerB.playlist.add(shared);
          } catch (error) {
            addError = error;
          }
          expect(addError, 'Adding the source of A to B').toBeDefined();
          void playerB.loadSource(shared);
          void playerB.loadPlaylist({ sources: [shared] });
          // Native runs the loads in call order, so once this one is active, the rejected loads completed. It
          // also checks that the rejected loads left B able to load.
          const later = new Source(Sources.sintel);
          void playerB.loadPlaylist({ sources: [later] });
          expect(
            await untilActive(playerB, later),
            'Later source loaded in B'
          ).toBeTruthy();

          void playerB.destroy();

          expect(own.isDestroyed, 'Source of B').toBeTruthy();
          expect(shared.isDestroyed, 'Source of A').toBeFalsy();
          expect(await shared.isActive(), 'Source of A').toBeTruthy();
        } finally {
          void playerA.destroy();
          void playerB.destroy();
        }
      }
    );

    spec.it(
      'destroys a source whose load was pending when the player was destroyed',
      async () => {
        const player = createPlayer();
        await player.initialize();
        const source = new Source(Sources.artOfMotionHls);
        void player.loadSource(source);

        void player.destroy();

        expect(
          await waitUntil(() => source.isDestroyed),
          'Source destroyed'
        ).toBeTruthy();
      }
    );
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

/**
 * Waits until `loadPlaylist` sent its native load for a playlist containing `source`: the load is sent once the
 * shared initialization of the sources completed, and pending promise callbacks run before the next macrotask.
 */
const untilPlaylistLoadIsSent = async (source: Source) => {
  await source.initialize();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Waits until `source` is the active source of `player`, e.g. after loading it.
 */
const untilActive = (player: Player, source: Source) =>
  waitUntil(async () => (await player.getSource()) === source);
