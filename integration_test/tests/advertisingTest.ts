import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventSequence,
  EventType,
  expectEvent,
  expectEvents,
  FilteredEvent,
  loadSourceConfig,
  RepeatedEvent,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import {
  AdItem,
  AdSourceType,
  AdvertisingConfig,
  PlaybackConfig,
  TimeChangedEvent,
} from 'bitmovin-player-react-native';
import { AdTags } from './helper/Ads';
import { expect } from './helper/Expect';
import { Platform } from 'react-native';

type SupportedTestPlatform = 'ios' | 'android';

const currentPlatform = Platform.OS as SupportedTestPlatform;

function isEnabledForCurrentPlatform(
  enabledOn?: SupportedTestPlatform[]
): boolean {
  if (enabledOn === undefined) {
    return true;
  }

  return enabledOn.includes(currentPlatform);
}

type AdScenario = {
  name: string;
  adItems: AdItem[];
  expectManifestLoaded: boolean;
  expectManifestLoadedAfterSeekByPlatform?: Partial<
    Record<SupportedTestPlatform, boolean>
  >;
  enabledOn?: SupportedTestPlatform[];
};

export default (spec: TestScope) => {
  function commonAdvertisingTests(scenario: AdScenario) {
    const {
      name,
      adItems,
      expectManifestLoaded,
      expectManifestLoadedAfterSeekByPlatform,
    } = scenario;
    const expectManifestLoadedAfterSeek =
      expectManifestLoadedAfterSeekByPlatform?.[currentPlatform] ?? false;

    spec.describe(`scheduling ${name} ads via AdvertisingConfig`, () => {
      spec.it('emits AdScheduled events', async () => {
        const advertisingConfig = {
          schedule: adItems,
        } as AdvertisingConfig;
        await startPlayerTest({ advertisingConfig }, async () => {
          await callPlayerAndExpectEvents(
            (player) => {
              player.load(Sources.artOfMotionHls);
            },
            RepeatedEvent(EventType.AdScheduled, adItems.length)
          );
        });
      });
    });
    spec.describe(`scheduling ${name} ads via scheduleAd API`, () => {
      spec.it('emits AdScheduled events', async () => {
        await startPlayerTest({}, async () => {
          await loadSourceConfig(Sources.artOfMotionHls);
          await callPlayerAndExpectEvents(
            (player) => {
              adItems.forEach((adItem) => player.scheduleAd(adItem));
            },
            RepeatedEvent(EventType.AdScheduled, adItems.length)
          );
        });
      });
    });
    spec.describe(`playing ${name} ads`, () => {
      spec.it('emits Ad events', async () => {
        const advertisingConfig = {
          schedule: adItems,
        } as AdvertisingConfig;
        await startPlayerTest({ advertisingConfig }, async () => {
          await callPlayer(async (player) => {
            player.load(Sources.artOfMotionHls);
            player.play();
          });
          if (expectManifestLoaded) {
            await expectEvent(EventType.AdManifestLoaded, 20);
          }
          await expectEvents(
            EventSequence(
              EventType.AdBreakStarted,
              EventType.AdStarted,
              EventType.AdQuartile,
              EventType.AdQuartile,
              EventType.AdQuartile,
              EventType.AdFinished,
              EventType.AdBreakFinished
            ),
            18
          );
          await callPlayerAndExpectEvent((player) => {
            player.seek(13);
          }, EventType.Seeked);
          if (expectManifestLoadedAfterSeek) {
            await expectEvent(EventType.AdManifestLoaded, 20);
          }
          await expectEvents(
            EventSequence(
              EventType.AdBreakStarted,
              EventType.AdStarted,
              EventType.AdQuartile,
              EventType.AdQuartile,
              EventType.AdQuartile,
              EventType.AdFinished,
              EventType.AdBreakFinished
            ),
            15
          );
          await callPlayerAndExpectEvent(async (player) => {
            const duration = await player.getDuration();
            player.seek(duration - 5);
          }, EventType.Seeked);
          if (expectManifestLoadedAfterSeek) {
            await expectEvent(EventType.AdManifestLoaded, 20);
          }
          await expectEvents(
            EventSequence(
              EventType.AdBreakStarted,
              EventType.AdStarted,
              EventType.AdQuartile,
              EventType.AdQuartile,
              EventType.AdQuartile,
              EventType.AdFinished,
              EventType.AdBreakFinished
            ),
            18
          );
        });
      });
    });

    spec.describe(
      `filtering ${name} ads scheduled ads via shouldLoadAdItem`,
      () => {
        spec.it('does not play preroll when filtered', async () => {
          const advertisingConfig: AdvertisingConfig = {
            schedule: [
              {
                sources: [
                  { tag: AdTags.vastSkippable, type: AdSourceType.IMA },
                ],
                position: 'pre',
              },
            ],
            shouldLoadAdItem: () => false,
          };
          const playbackConfig: PlaybackConfig = {
            isAutoplayEnabled: true,
          };
          await startPlayerTest(
            { playbackConfig, advertisingConfig },
            async () => {
              await callPlayerAndExpectEvent(
                (player) => {
                  player.load(Sources.artOfMotionHls);
                },
                FilteredEvent<TimeChangedEvent>(
                  EventType.TimeChanged,
                  (event) => event.currentTime > 0.25
                )
              );
              await callPlayer(async (player) => {
                expect(await player.isAd()).toBeFalsy();
              });
            }
          );
        });
      }
    );
  }

  const adScenarios: AdScenario[] = [
    {
      name: 'IMA VMAP',
      adItems: [
        { sources: [{ tag: AdTags.vmapPreMidPost, type: AdSourceType.IMA }] },
      ],
      expectManifestLoaded: true,
    },
    {
      name: 'IMA VAST',
      adItems: [
        {
          sources: [{ tag: AdTags.vastSkippable, type: AdSourceType.IMA }],
          position: 'pre',
        },
        {
          sources: [{ tag: AdTags.vast1, type: AdSourceType.IMA }],
          position: '15',
        },
        {
          sources: [{ tag: AdTags.vast2, type: AdSourceType.IMA }],
          position: 'post',
        },
      ],
      expectManifestLoaded: true,
      expectManifestLoadedAfterSeekByPlatform: {
        android: true,
      },
    },
    {
      name: 'Progressive',
      adItems: [
        {
          sources: [
            { tag: AdTags.progressive, type: AdSourceType.PROGRESSIVE },
          ],
          position: 'pre',
        },
        {
          sources: [
            { tag: AdTags.progressive, type: AdSourceType.PROGRESSIVE },
          ],
          position: '15',
        },
        {
          sources: [
            { tag: AdTags.progressive, type: AdSourceType.PROGRESSIVE },
          ],
          position: 'post',
        },
      ],
      expectManifestLoaded: false,
    },
    {
      name: 'BITMOVIN VAST',
      adItems: [
        {
          sources: [{ tag: AdTags.vastSkippable, type: AdSourceType.BITMOVIN }],
          position: 'pre',
        },
        {
          sources: [{ tag: AdTags.vast1, type: AdSourceType.BITMOVIN }],
          position: '15',
        },
        {
          sources: [{ tag: AdTags.vast2, type: AdSourceType.BITMOVIN }],
          position: 'post',
        },
      ],
      expectManifestLoaded: false,
    },
    {
      name: 'BITMOVIN VMAP',
      adItems: [
        {
          sources: [
            { tag: AdTags.vmapPreMidPost, type: AdSourceType.BITMOVIN },
          ],
        },
      ],
      expectManifestLoaded: false,
      enabledOn: ['android'],
    },
  ];

  adScenarios
    .filter(({ enabledOn }) => isEnabledForCurrentPlatform(enabledOn))
    .forEach(commonAdvertisingTests);

  type AdErrorScenario = {
    adItem: AdItem;
    label: string;
    enabledOn?: SupportedTestPlatform[];
  };

  function advertisingErrorTests(scenario: AdErrorScenario) {
    const { adItem, label } = scenario;
    spec.describe(`scheduling erroneous ${label} ad`, () => {
      spec.it('emits AdError events', async () => {
        await startPlayerTest({}, async () => {
          await loadSourceConfig(Sources.artOfMotionHls);
          await callPlayerAndExpectEvent((player) => {
            player.scheduleAd(adItem);
            player.play();
          }, EventType.AdError);
        });
      });
    });
  }

  const adErrorScenarios: AdErrorScenario[] = [
    {
      adItem: { sources: [{ tag: AdTags.error, type: AdSourceType.IMA }] },
      label: 'IMA',
      enabledOn: ['ios', 'android'],
    },
    {
      // AdError event is not emitted on Android when progressive ad playback fails.
      adItem: {
        sources: [{ tag: AdTags.error, type: AdSourceType.PROGRESSIVE }],
      },
      label: 'progressive',
      enabledOn: ['ios'],
    },
    {
      adItem: { sources: [{ tag: AdTags.error, type: AdSourceType.BITMOVIN }] },
      label: 'BITMOVIN',
      enabledOn: ['ios', 'android'],
    },
  ];

  adErrorScenarios
    .filter(({ enabledOn }) => isEnabledForCurrentPlatform(enabledOn))
    .forEach(advertisingErrorTests);
};
