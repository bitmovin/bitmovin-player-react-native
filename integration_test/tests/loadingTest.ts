import { Platform } from 'react-native';
import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventBag,
  EventSequence,
  EventType,
  expectEvents,
  FilteredEvent,
  startPlayerTest,
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

  loadingSourceTests(Sources.iReplayTestLiveHls, 'live');

  spec.describe('loading a DRM source', () => {
    spec.it(
      'applies the DRM config of a source that is initialized concurrently',
      async () => {
        // Gate to Android since the source uses Widevine.
        if (Platform.OS !== 'android') {
          console.warn('Skipping Widevine DRM test on non-Android platform');
          return;
        }

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

export function loadingVodTests(spec: TestScope) {
  registerLoadingTests(spec, true);
}

export default (spec: TestScope) => registerLoadingTests(spec);
