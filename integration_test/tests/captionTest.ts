import { TestScope } from 'cavy';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventSequence,
  EventType,
  expectEvent,
  expectEvents,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';
import positionedWebVttAssetId from '../assets/subtitles/positioned.vtt';
import regionWebVttAssetId from '../assets/subtitles/region.vtt';
import {
  CueEnterEvent,
  CueExitEvent,
  SourceConfig,
  SubtitleFormat,
} from 'bitmovin-player-react-native';

const positionedWebVttLabel = 'Positioned WebVTT';
const positionedWebVttAsset = Asset.fromModule(positionedWebVttAssetId);
const regionWebVttLabel = 'Region WebVTT';
const regionWebVttAsset = Asset.fromModule(regionWebVttAssetId);

function sourceWithWebVttTrack(url: string, label: string): SourceConfig {
  return {
    ...Sources.sintel,
    subtitleTracks: [
      {
        url,
        label,
        language: 'en',
        format: SubtitleFormat.VTT,
      },
    ],
  };
}

function expectCueLayoutIfPresent(
  layout: CueEnterEvent['layout'] | CueExitEvent['layout'],
  eventName: string
) {
  if (!layout) {
    return;
  }

  if (layout.line !== undefined) {
    if (layout.line.value !== 'auto') {
      expect(typeof layout.line.value, `${eventName} line value type`).toBe(
        'number'
      );
      expect(
        ['line', 'percent'].includes(layout.line.unit),
        `${eventName} line unit value`
      ).toBe(true);
    }
  }
  if (layout.lineAlign !== undefined) {
    expect(
      ['start', 'center', 'end'].includes(layout.lineAlign),
      `${eventName} lineAlign value`
    ).toBe(true);
  }
  if (layout.position !== undefined) {
    expect(
      typeof layout.position === 'number' || layout.position === 'auto',
      `${eventName} layout position should be a number or auto`
    ).toBe(true);
  }
  if (layout.positionAlign !== undefined) {
    expect(
      ['line-left', 'center', 'line-right', 'auto'].includes(
        layout.positionAlign
      ),
      `${eventName} positionAlign value`
    ).toBe(true);
  }
  if (layout.size !== undefined) {
    expect(typeof layout.size, `${eventName} size type`).toBe('number');
  }
  if (layout.textAlign !== undefined) {
    expect(
      ['start', 'center', 'end', 'left', 'right'].includes(layout.textAlign),
      `${eventName} textAlign value`
    ).toBe(true);
  }
  if (layout.writingMode !== undefined) {
    expect(
      ['horizontal', 'vertical-lr', 'vertical-rl'].includes(layout.writingMode),
      `${eventName} writingMode value`
    ).toBe(true);
  }
}

function expectCueRegionIfPresent(
  region: CueEnterEvent['region'] | CueExitEvent['region'],
  eventName: string
) {
  if (region?.id !== undefined) {
    expect(typeof region.id, `${eventName} region id type`).toBe('string');
  }
  if (region?.style !== undefined) {
    expect(typeof region.style, `${eventName} region style type`).toBe(
      'string'
    );
  }
}

function expectPositionedWebVttGeometry(
  layout: CueEnterEvent['layout'] | CueExitEvent['layout'],
  eventName: string
) {
  expect(layout, `${eventName} should expose cue layout`).toBeDefined();
  const line = layout?.line;
  expect(line, `${eventName} layout line`).toBeDefined();
  expect(line?.value, `${eventName} layout line`).toBeCloseTo(20);
  if (line?.value !== 'auto') {
    expect(line?.unit, `${eventName} layout line unit`).toBe('percent');
  }
  expect(layout?.position, `${eventName} layout position`).toBeCloseTo(30);
  expect(layout?.positionAlign, `${eventName} layout positionAlign`).toBe(
    'line-left'
  );
  expect(layout?.size, `${eventName} layout size`).toBeCloseTo(40);
  expect(layout?.textAlign, `${eventName} layout textAlign`).toBe('start');
}

async function getAssetUri(asset: Asset, description: string): Promise<string> {
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  expect(uri, `${description} asset URI should be available`).toBeDefined();
  return uri;
}

export default (spec: TestScope) => {
  spec.describe('playing captions', () => {
    spec.it('emits CueEnter and CueExit events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.sintel);
        await callPlayer(async (player) => {
          const subtitleTrack = (await player.getAvailableSubtitles())[1];
          player.setSubtitleTrack(subtitleTrack.identifier);
          player.play();
        });
        await callPlayerAndExpectEvent((player) => {
          player.seek(105);
        }, EventType.Seeked);
        await expectEvents(
          EventSequence(
            EventType.CueEnter,
            EventType.CueExit,
            EventType.CueEnter,
            EventType.CueExit,
            EventType.CueEnter,
            EventType.CueExit
          ),
          30
        );
      });
    });

    spec.it('validates subtitle track properties', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.sintel);
        await callPlayer(async (player) => {
          const subtitleTracks = await player.getAvailableSubtitles();
          expect(
            subtitleTracks,
            'Available subtitles should be an array'
          ).toBeInstanceOf(Array);
          expect(
            subtitleTracks.length,
            'Should have at least 2 subtitle tracks'
          ).toBeGreaterThan(1);

          const subtitleTrack = subtitleTracks[1];
          expect(
            subtitleTrack.identifier,
            'Subtitle track should have identifier'
          ).toBeDefined();
          expect(
            typeof subtitleTrack.identifier,
            'Subtitle track identifier should be string'
          ).toBe('string');
          expect(
            subtitleTrack.label,
            'Subtitle track should have label'
          ).toBeDefined();
          expect(
            typeof subtitleTrack.label,
            'Subtitle track label should be string'
          ).toBe('string');
          expect(
            subtitleTrack.language,
            'Subtitle track should have language'
          ).toBeDefined();
          expect(
            typeof subtitleTrack.language,
            'Subtitle track language should be string'
          ).toBe('string');
          expect(
            subtitleTrack.isDefault,
            'Subtitle track should have isDefault'
          ).toBeDefined();
          expect(
            typeof subtitleTrack.isDefault,
            'Subtitle track isDefault should be boolean'
          ).toBe('boolean');
        });
      });
    });

    spec.it('validates CueEnter event properties', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.sintel);
        await callPlayer(async (player) => {
          const subtitleTrack = (await player.getAvailableSubtitles())[1];
          player.setSubtitleTrack(subtitleTrack.identifier);
          player.play();
        });
        await callPlayerAndExpectEvent((player) => {
          player.seek(105);
        }, EventType.Seeked);

        const cueEnterEvent: CueEnterEvent = await expectEvent(
          EventType.CueEnter
        );
        expect(
          cueEnterEvent.name,
          'CueEnter event should have name'
        ).toBeDefined();
        expect(
          cueEnterEvent.name,
          'CueEnter event name should be onCueEnter'
        ).toBe('onCueEnter');
        expect(
          cueEnterEvent.timestamp,
          'CueEnter event should have timestamp'
        ).toBeDefined();
        expect(
          typeof cueEnterEvent.timestamp,
          'timestamp should be a number'
        ).toBe('number');
        expect(
          cueEnterEvent.timestamp,
          'timestamp should be > 0'
        ).toBeGreaterThan(0);

        // Validate CueEnter event-specific fields
        expect(
          cueEnterEvent.start,
          'CueEnter event should have start'
        ).toBeDefined();
        expect(typeof cueEnterEvent.start, 'start should be a number').toBe(
          'number'
        );
        expect(
          cueEnterEvent.start,
          'start should be >= 0'
        ).toBeGreaterThanOrEqual(0);

        expect(
          cueEnterEvent.end,
          'CueEnter event should have end'
        ).toBeDefined();
        expect(typeof cueEnterEvent.end, 'end should be a number').toBe(
          'number'
        );
        expect(cueEnterEvent.end, 'end should be >= 0').toBeGreaterThanOrEqual(
          0
        );
        expect(typeof cueEnterEvent.text, 'text should be a string').toBe(
          'string'
        );
        expectCueLayoutIfPresent(cueEnterEvent.layout, 'CueEnter');
        expectCueRegionIfPresent(cueEnterEvent.region, 'CueEnter');
      });
    });

    spec.it('validates CueExit event properties', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.sintel);
        await callPlayer(async (player) => {
          const subtitleTrack = (await player.getAvailableSubtitles())[1];
          player.setSubtitleTrack(subtitleTrack.identifier);
          player.play();
        });
        await callPlayerAndExpectEvent((player) => {
          player.seek(105);
        }, EventType.Seeked);

        // Wait for CueEnter first, then CueExit
        await expectEvent(EventType.CueEnter);
        const cueExitEvent: CueExitEvent = await expectEvent(EventType.CueExit);
        expect(
          cueExitEvent.name,
          'CueExit event should have name'
        ).toBeDefined();
        expect(
          cueExitEvent.name,
          'CueExit event name should be onCueExit'
        ).toBe('onCueExit');
        expect(
          cueExitEvent.timestamp,
          'CueExit event should have timestamp'
        ).toBeDefined();
        expect(
          typeof cueExitEvent.timestamp,
          'timestamp should be a number'
        ).toBe('number');
        expect(
          cueExitEvent.timestamp,
          'timestamp should be > 0'
        ).toBeGreaterThan(0);

        // Validate CueExit event-specific fields
        expect(
          cueExitEvent.start,
          'CueExit event should have start'
        ).toBeDefined();
        expect(typeof cueExitEvent.start, 'start should be a number').toBe(
          'number'
        );
        expect(
          cueExitEvent.start,
          'start should be >= 0'
        ).toBeGreaterThanOrEqual(0);

        expect(typeof cueExitEvent.end, 'end should be a number').toBe(
          'number'
        );
        expect(cueExitEvent.end, 'end should be >= 0').toBeGreaterThanOrEqual(
          0
        );
        expect(typeof cueExitEvent.text, 'text should be a string').toBe(
          'string'
        );
        expectCueLayoutIfPresent(cueExitEvent.layout, 'CueExit');
        expectCueRegionIfPresent(cueExitEvent.region, 'CueExit');
      });
    });

    spec.it(
      'emits VTT cue geometry for positioned WebVTT subtitles on Android',
      async () => {
        if (Platform.OS !== 'android') {
          return;
        }

        await startPlayerTest({}, async () => {
          await loadSourceConfig(
            sourceWithWebVttTrack(
              await getAssetUri(positionedWebVttAsset, positionedWebVttLabel),
              positionedWebVttLabel
            )
          );
          await callPlayer(async (player) => {
            const subtitleTrack = (await player.getAvailableSubtitles()).find(
              (track) => track.label === positionedWebVttLabel
            );
            expect(
              subtitleTrack,
              'Positioned WebVTT track should be available'
            ).toBeDefined();

            void player.setSubtitleTrack(subtitleTrack!.identifier);
            void player.play();
          });

          const cueEnterEvent: CueEnterEvent = await expectEvent(
            EventType.CueEnter,
            30
          );
          expectPositionedWebVttGeometry(cueEnterEvent.layout, 'CueEnter');

          const cueExitEvent: CueExitEvent = await expectEvent(
            EventType.CueExit,
            15
          );
          expectPositionedWebVttGeometry(cueExitEvent.layout, 'CueExit');
        });
      }
    );

    spec.it(
      'emits region metadata on iOS',
      async () => {
        if (Platform.OS !== 'ios') {
          return;
        }

        await startPlayerTest({}, async () => {
          await loadSourceConfig(
            sourceWithWebVttTrack(
              await getAssetUri(regionWebVttAsset, regionWebVttLabel),
              regionWebVttLabel
            )
          );
          await callPlayer(async (player) => {
            const subtitleTrack = (await player.getAvailableSubtitles()).find(
              (track) => track.label === regionWebVttLabel
            );
            expect(
              subtitleTrack,
              'Region WebVTT track should be available'
            ).toBeDefined();

            void player.setSubtitleTrack(subtitleTrack!.identifier);
            void player.play();
          });

          const cueEnterEvent: CueEnterEvent = await expectEvent(
            EventType.CueEnter,
            30
          );
          expect(
            cueEnterEvent.region,
            'CueEnter should expose region metadata'
          ).toBeDefined();
          expect(cueEnterEvent.region?.id, 'CueEnter region id').toBe(
            'region-test'
          );
          expect(
            cueEnterEvent.region?.style,
            'CueEnter region style'
          ).toBeDefined();
          expect(
            typeof cueEnterEvent.region?.style,
            'CueEnter region style type'
          ).toBe('string');
          expect(
            (cueEnterEvent as CueEnterEvent & { regionStyle?: string })
              .regionStyle,
            'CueEnter should not expose legacy top-level regionStyle'
          ).toBeUndefined();
        });
      }
    );

    spec.it(
      'disables subtitles when calling setSubtitleTrack with undefined',
      async () => {
        await startPlayerTest({}, async () => {
          await loadSourceConfig(Sources.sintel);

          const initialSelectedSubtitle = await callPlayer((player) =>
            player.getSubtitleTrack()
          );

          const subtitleTracks = await callPlayer((player) =>
            player.getAvailableSubtitles()
          );
          const subtitleTrack = subtitleTracks.find(
            (track) => track.identifier !== initialSelectedSubtitle?.identifier
          )!;
          expect(subtitleTrack).toNotBeNull();

          await callPlayerAndExpectEvent((player) => {
            player.setSubtitleTrack(subtitleTrack.identifier);
          }, EventType.SubtitleChanged);

          const selectedSubtitle = await callPlayer((player) =>
            player.getSubtitleTrack()
          );
          expect(
            selectedSubtitle,
            'Subtitle track should be selected before disabling'
          ).toNotBeNull();
          expect(
            selectedSubtitle?.identifier,
            'Selected subtitle identifier should match the requested track'
          ).toBe(subtitleTrack.identifier);

          await callPlayerAndExpectEvent((player) => {
            player.setSubtitleTrack(undefined);
          }, EventType.SubtitleChanged);
          const disabledSubtitle = await callPlayer((player) =>
            player.getSubtitleTrack()
          );
          expect(
            disabledSubtitle,
            'Subtitles should be disabled after passing undefined'
          ).toBeNull();
        });
      }
    );
  });
};
