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
  TimelineReferencePoint,
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

    spec.it('rejects an unknown replay mode', async () => {
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          let error: unknown;
          try {
            await player.loadPlaylist({
              sources: [new Source(Sources.artOfMotionHls)],
              options: { replayMode: 'unknown' as ReplayMode },
            });
          } catch (e) {
            error = e;
          }
          expect(error, 'loadPlaylist should reject').toBeDefined();
        });
      });
    });

    spec.it('rejects a DASH source on iOS', async () => {
      // The iOS SDK only supports HLS, progressive and movpkg sources in a playlist.
      if (Platform.OS !== 'ios') {
        console.warn('Skipping the iOS playlist source type test on Android');
        return;
      }
      await startPlayerTest({}, async () => {
        await callPlayer(async (player) => {
          let error: unknown;
          try {
            await player.loadPlaylist({
              sources: [
                new Source(Sources.artOfMotionHls),
                new Source(Sources.artOfMotionDash),
              ],
            });
          } catch (e) {
            error = e;
          }
          expect(error, 'loadPlaylist should reject').toBeDefined();
          expect(await player.getSource(), 'Active source').toBeUndefined();
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

          await player.loadPlaylist({
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
      // Seeking to a seek target is only supported on Android.
      if (Platform.OS !== 'android') {
        console.warn(
          'Skipping PlaylistApi.seekTo test on non-Android platform'
        );
        return;
      }
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
      'rejects seeking to a target with an unknown timeline reference point',
      async () => {
        // Seeking to a seek target is only supported on Android.
        if (Platform.OS !== 'android') {
          console.warn(
            'Skipping PlaylistApi.seekTo test on non-Android platform'
          );
          return;
        }
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);

          await callPlayerAndExpectEvent(async (player) => {
            await player.loadPlaylist({ sources: [first, second] });
          }, EventType.Ready);

          await callPlayer(async (player) => {
            let error: unknown;
            try {
              await player.playlist.seekTo(second, {
                offset: 0,
                startOffsetTimelineReference:
                  'unknown' as TimelineReferencePoint,
              });
            } catch (e) {
              error = e;
            }
            expect(error, 'seekTo should reject').toBeDefined();
          });
        });
      }
    );

    spec.it('rejects seeking to a target on iOS', async () => {
      if (Platform.OS !== 'ios') {
        console.warn('Skipping the iOS PlaylistApi.seekTo test on Android');
        return;
      }
      await startPlayerTest({}, async () => {
        const first = new Source(Sources.artOfMotionHls);
        const second = new Source(Sources.sintel);

        await callPlayerAndExpectEvent(async (player) => {
          await player.loadPlaylist({ sources: [first, second] });
        }, EventType.Ready);

        await callPlayer(async (player) => {
          let error: unknown;
          try {
            await player.playlist.seekTo(second, { offset: 10 });
          } catch (e) {
            error = e;
          }
          expect(error, 'seekTo should reject').toBeDefined();
          expect(await player.getSource(), 'Active source').toBe(first);
        });
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
