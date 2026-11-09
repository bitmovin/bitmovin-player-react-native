import { Platform } from 'react-native';
import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  createPlayer,
  EventBag,
  EventSequence,
  EventType,
  expectEvents,
  FilteredEvent,
  loadSourceConfig,
  startPlayerTest,
  untilActive,
  waitUntil,
} from '../playertesting';
import { Sources } from './helper/Sources';
import {
  DownloadFinishedEvent,
  HttpRequestType,
  Source,
  SourceConfig,
} from 'bitmovin-player-react-native';
import { expect } from './helper/Expect';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';

function registerLoadingTests(spec: TestScope, vodOnly = false) {
  spec.describe('native player view readiness', () => {
    spec.it(
      'receives loading events when loading directly from the ready callback',
      async () => {
        const world = PlayerTestWorld.shared;
        const acknowledge = world.onPlayerViewReady;
        world.onPlayerViewReady = (player) => {
          acknowledge(player);
          player.load(Sources.artOfMotionHls);
        };
        try {
          await startPlayerTest({}, async () => {
            // Observe before the native mount can acknowledge readiness. This crosses
            // the real Expo bridge; no synthetic readiness event is injected.
            // Ready can arrive before SourceLoaded on iOS.
            await expectEvents(
              EventBag(
                EventType.SourceLoad,
                EventType.SourceLoaded,
                EventType.Ready
              )
            );
          });
        } finally {
          world.onPlayerViewReady = acknowledge;
        }
      }
    );
  });

  if (!vodOnly) {
    spec.describe('PlayerView event props', () => {
      spec.it(
        'deliver PlayerActive when the view is mounted before loading',
        async () => {
          await startPlayerTest({}, async () => {
            await loadSourceConfig(Sources.artOfMotionHls);
            expect(
              PlayerTestWorld.shared.playerActivePropEvents,
              'PlayerActive received by the onPlayerActive prop'
            ).toHaveLength(1);
          });
        }
      );
    });
  }

  function loadingSourceTests(sourceConfig: SourceConfig, label: string) {
    spec.describe(`loading a ${label} source`, () => {
      spec.it('emits ReadyEvent event', async () => {
        await startPlayerTest({}, async () => {
          await callPlayerAndExpectEvent((player) => {
            player.load(sourceConfig);
          }, EventType.Ready);
          await callPlayer(async (player) => {
            const duration = await player.getDuration();
            expect(duration, 'Player duration after loading').toNotBe(0);
            expect(
              duration,
              'Player duration should be a number'
            ).toBeGreaterThan(0);
            expect(typeof duration, 'Duration type').toBe('number');
          });
        });
      });
      spec.it('emits SourceLoad and SourceLoaded events', async () => {
        await startPlayerTest({}, async () => {
          await callPlayerAndExpectEvents(
            (player) => {
              player.load(sourceConfig);
            },
            EventSequence(EventType.SourceLoad, EventType.SourceLoaded)
          );
        });
      });
      spec.it('emits DownloadFinished events', async () => {
        await startPlayerTest({}, async () => {
          await callPlayerAndExpectEvents(
            (player) => {
              player.load(sourceConfig);
            },
            EventBag(
              FilteredEvent<DownloadFinishedEvent>(
                EventType.DownloadFinished,
                (event) =>
                  event.requestType === HttpRequestType.ManifestHlsMaster
              ),
              FilteredEvent<DownloadFinishedEvent>(
                EventType.DownloadFinished,
                (event) =>
                  event.requestType === HttpRequestType.ManifestHlsVariant
              )
            )
          );
        });
      });

      spec.it('validates DownloadFinished event properties', async () => {
        await startPlayerTest({}, async () => {
          const downloadEvent: DownloadFinishedEvent =
            await callPlayerAndExpectEvent((player) => {
              player.load(sourceConfig);
            }, EventType.DownloadFinished);

          expect(
            downloadEvent.requestType,
            'DownloadFinished event should have requestType'
          ).toBeDefined();
          expect(
            downloadEvent.url,
            'DownloadFinished event should have url'
          ).toBeDefined();
          if (downloadEvent.lastRedirectLocation !== undefined) {
            expect(
              typeof downloadEvent.lastRedirectLocation,
              'lastRedirectLocation should be string'
            ).toBe('string');
          }
          expect(
            downloadEvent.httpStatus,
            'DownloadFinished event should have httpStatus'
          ).toBeGreaterThan(0);
          expect(
            downloadEvent.isSuccess,
            'DownloadFinished event should have isSuccess'
          ).toBeDefined();
          expect(
            typeof downloadEvent.isSuccess,
            'isSuccess should be boolean'
          ).toBe('boolean');
          expect(
            downloadEvent.downloadTime,
            'DownloadFinished event should have downloadTime'
          ).toBeGreaterThanOrEqual(0);

          if (downloadEvent.isSuccess) {
            expect(
              downloadEvent.httpStatus,
              'Successful download should have 2xx status'
            ).toBeGreaterThanOrEqual(200);
            expect(
              downloadEvent.httpStatus,
              'Successful download should have 2xx status'
            ).toBeSmallerThan(300);
          }
        });
      });
    });
  }

  loadingSourceTests(Sources.artOfMotionHls, 'VOD');
  if (vodOnly) return;

  spec.describe('getting the active source', () => {
    spec.it(
      'returns the loaded source and nothing after unloading',
      async () => {
        await startPlayerTest({}, async () => {
          const source = new Source(Sources.artOfMotionHls);
          await callPlayerAndExpectEvent((player) => {
            player.loadSource(source);
          }, EventType.Ready);
          await callPlayer(async (player) => {
            expect(await player.getSource(), 'Active source').toBe(source);
          });

          await callPlayerAndExpectEvent((player) => {
            player.unload();
          }, EventType.SourceUnloaded);
          await callPlayer(async (player) => {
            expect(
              await player.getSource(),
              'Active source after unloading'
            ).toBeUndefined();
          });
        });
      }
    );
  });

  spec.describe('reusing the nativeId of a destroyed source', () => {
    spec.it(
      'loads a new source when the destroyed one was still initializing',
      async () => {
        await startPlayerTest({}, async () => {
          const nativeId = 'reused-source';
          const reused = new Source({ ...Sources.artOfMotionHls, nativeId });
          await callPlayerAndExpectEvent((player) => {
            const destroyed = new Source({
              ...Sources.artOfMotionHls,
              nativeId,
            });
            player.loadSource(destroyed);
            destroyed.destroy();
            player.loadSource(reused);
          }, EventType.Ready);

          await callPlayer(async (player) => {
            expect(await player.getSource(), 'Active source').toBe(reused);
          });
        });
      }
    );
  });

  spec.describe('destroying the player', () => {
    spec.it(
      'destroys its created and session sources but not a source of another player',
      async () => {
        const player = createPlayer();
        const otherPlayer = createPlayer();
        const moved = new Source(Sources.artOfMotionHls);
        const session = new Source(Sources.sintel);
        try {
          await player.initialize();
          await otherPlayer.initialize();
          player.loadSource(moved);
          expect(await untilActive(player, moved), 'Loaded').toBeTruthy();
          player.load(Sources.artOfMotionHls);
          let created: Source | undefined;
          expect(
            await waitUntil(async () => {
              created = await player.getSource();
              return created !== undefined && created !== moved;
            }),
            'Created source loaded'
          ).toBeTruthy();
          player.loadSource(session);
          expect(
            await untilActive(player, session),
            'Session source loaded'
          ).toBeTruthy();
          otherPlayer.loadSource(moved);
          expect(
            await untilActive(otherPlayer, moved),
            'Moved to the other player'
          ).toBeTruthy();

          player.destroy();

          expect(
            await waitUntil(
              () => created?.isDestroyed === true && session.isDestroyed
            ),
            'Created and session sources destroyed'
          ).toBeTruthy();
          expect(moved.isDestroyed, 'Moved source destroyed').toBeFalsy();
          expect(
            await otherPlayer.getSource(),
            'Active source of the other player'
          ).toBe(moved);
        } finally {
          player.destroy();
          otherPlayer.destroy();
        }
      }
    );
  });

  loadingSourceTests(Sources.iReplayTestLiveHls, 'live');

  // Only registered on Android, as the source uses Widevine.
  if (Platform.OS === 'android') {
    spec.describe('loading a DRM source', () => {
      spec.it(
        'applies the DRM config of a source that is initialized concurrently',
        async () => {
          await startPlayerTest({}, async () => {
            const config = Sources.widevineDrmWithBrokenLicense;
            let isLicenseRequested = false;
            const source = new Source({
              ...config,
              drmConfig: {
                widevine: {
                  ...config.drmConfig!.widevine!,
                  // Only called if the native source was created with its DRM config.
                  prepareMessage: (message) => {
                    isLicenseRequested = true;
                    return message;
                  },
                },
              },
            });

            await callPlayer(async (player) => {
              void source.initialize();
              player.loadSource(source);
            });

            const deadline = Date.now() + 10000;
            while (!isLicenseRequested && Date.now() < deadline) {
              await new Promise((resolve) => setTimeout(resolve, 250));
            }
            expect(isLicenseRequested, 'License requested').toBeTruthy();
          });
        }
      );
    });
  }
}

export function loadingVodTests(spec: TestScope) {
  registerLoadingTests(spec, true);
}

export default (spec: TestScope) => registerLoadingTests(spec);
