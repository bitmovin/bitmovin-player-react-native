import { TestScope } from 'cavy';
import {
  DynamicRange,
  VideoPlaybackQualityChangedEvent,
  type VideoColorInfo,
} from 'bitmovin-player-react-native';
import {
  callPlayer,
  EventType,
  expectEvent,
  loadSourceConfig,
  playFor,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';

const dynamicRangeValues = Object.values(DynamicRange);

const expectDefined = <T>(value: T | null | undefined, message: string): T => {
  if (value == null) {
    throw new Error(message);
  }
  return value;
};

const expectValidDynamicRange = (
  dynamicRange: DynamicRange | undefined,
  message: string
): void => {
  const definedDynamicRange = expectDefined(
    dynamicRange,
    `${message}: dynamicRange is missing`
  );
  if (!dynamicRangeValues.includes(definedDynamicRange)) {
    throw new Error(
      `${message}: unexpected dynamicRange ${definedDynamicRange}`
    );
  }
};

const expectValidColorInfo = (
  colorInfo: VideoColorInfo | undefined,
  message: string
): void => {
  const definedColorInfo = expectDefined(
    colorInfo,
    `${message}: colorInfo is missing`
  );
  expectValidDynamicRange(
    definedColorInfo.dynamicRange,
    `${message}.dynamicRange`
  );
};

export default (spec: TestScope) => {
  spec.describe('loading a source with video qualities', () => {
    spec.it(
      'exposes colorInfo.dynamicRange on available video qualities',
      async () => {
        await startPlayerTest({}, async () => {
          // This source may report `DynamicRange.Unknown` when no dynamic range
          // metadata is available, which is still a valid exposed dynamic range.
          // NOTE: The `HDR -> 'hdr'` mapping is not exercised here because no HDR
          // test asset is currently available in the test suite.
          await loadSourceConfig(Sources.artOfMotionHls);
          await callPlayer(async (player) => {
            const qualities = await player.getAvailableVideoQualities();
            if (qualities.length === 0) {
              throw new Error('Expected at least one available video quality');
            }
            qualities.forEach((quality) => {
              expectValidColorInfo(
                quality.colorInfo,
                `VideoQuality ${quality.id}.colorInfo`
              );
            });
          });
        });
      }
    );
    spec.it(
      'exposes colorInfo.dynamicRange on the active video quality',
      async () => {
        await startPlayerTest({}, async () => {
          await loadSourceConfig(Sources.artOfMotionHls);
          // Start playback so that an active video quality is guaranteed to be
          // resolved before reading it.
          await playFor(1);
          await callPlayer(async (player) => {
            const quality = expectDefined(
              await player.getVideoQuality(),
              'Expected an active video quality'
            );
            expectValidColorInfo(
              quality.colorInfo,
              'Active video quality.colorInfo'
            );
          });
        });
      }
    );
    spec.it(
      'exposes colorInfo.dynamicRange on VideoPlaybackQualityChangedEvent',
      async () => {
        await startPlayerTest({}, async () => {
          const eventPromise = expectEvent<VideoPlaybackQualityChangedEvent>(
            EventType.VideoPlaybackQualityChanged,
            20
          );
          await loadSourceConfig(Sources.artOfMotionHls);
          const event = await eventPromise;
          expectValidColorInfo(
            event.newVideoQuality.colorInfo,
            'VideoPlaybackQualityChangedEvent.newVideoQuality.colorInfo'
          );
        });
      }
    );
  });
};
