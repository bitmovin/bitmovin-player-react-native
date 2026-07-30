import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  expectEvent,
  FilteredEvent,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';
import {
  CueEnterEvent,
  CueExitEvent,
  SideLoadedSubtitleTrack,
  SourceConfig,
  SourceType,
  SubtitleCueLayout,
  SubtitleFormat,
  SubtitleTrack,
} from 'bitmovin-player-react-native';
import { Image, Platform } from 'react-native';
import { testSelectors } from '.';

const positionedSubtitleTrack: SideLoadedSubtitleTrack = {
  identifier: 'positioned-cues',
  url: Image.resolveAssetSource(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../assets/subtitles/positioned_cues.vtt')
  ).uri,
  label: 'Positioned Cues',
  language: 'en',
  format: SubtitleFormat.VTT,
};

const sourceWithInManifestPositionedSubs: SourceConfig = {
  url: 'https://bitmovin-player-eu-west1-ci-input.s3.amazonaws.com/general/hls/sintel-different_attributes-subtitle/master-debug-short.m3u8',
  type: SourceType.HLS,
};

const sourceWithCea608Captions: SourceConfig = {
  url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
  type: SourceType.HLS,
};

function sourceWithSubtitleTrack(
  subtitleTrack: SideLoadedSubtitleTrack
): SourceConfig {
  return {
    url: Sources.artOfMotionHls.url!,
    type: SourceType.HLS,
    subtitleTracks: [subtitleTrack],
  };
}

async function loadSideLoadedTrackAndSeek(
  subtitleTrack: SideLoadedSubtitleTrack,
  seekTime: number
) {
  await loadSourceConfig(sourceWithSubtitleTrack(subtitleTrack));
  await callPlayer(async (player) => {
    await player.setSubtitleTrack(subtitleTrack.identifier);
    player.play();
  });
  await callPlayerAndExpectEvent((player) => {
    player.seek(seekTime);
  }, EventType.Seeked);
}

function expectPositionedCueLayout(
  layout: CueEnterEvent['layout'] | CueExitEvent['layout'],
  eventName: string
) {
  expect(layout, `${eventName} should have a layout field`).toBeDefined();

  const positionedLayout = layout as SubtitleCueLayout;
  expect(
    positionedLayout.writingMode,
    `${eventName} writingMode should be omitted for horizontal cues`
  ).toBeUndefined();
  expect(
    positionedLayout.line?.value,
    `${eventName} line.value should be 85`
  ).toBeCloseTo(85);
  expect(
    positionedLayout.line?.unit,
    `${eventName} line.unit should be percent`
  ).toBe('percent');
  expect(
    positionedLayout.position,
    `${eventName} position should be 50`
  ).toBeCloseTo(50);
  expect(positionedLayout.size, `${eventName} size should be 80`).toBeCloseTo(
    80
  );
  expect(
    positionedLayout.textAlign,
    `${eventName} textAlign should be center`
  ).toBe('center');
}

function expectCueHtml(event: CueEnterEvent | CueExitEvent, eventName: string) {
  expect(event.html, `${eventName} html should be present`).toBeDefined();
  expect(typeof event.html, `${eventName} html should be a string`).toBe(
    'string'
  );
}

export default (spec: TestScope) => {
  spec.describe('caption metadata', () => {
    if (Platform.OS === 'android') {
      const defineAndroidCueGeometryTests = () => {
        spec.it(
          'CueEnter layout field reflects geometry authored in the VTT',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSideLoadedTrackAndSeek(positionedSubtitleTrack, 2);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                EventType.CueEnter
              );

              expectPositionedCueLayout(cueEnterEvent.layout, 'CueEnter');
            });
          }
        );

        spec.it(
          'CueEnter html field is present for a cue with inline styling',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSideLoadedTrackAndSeek(positionedSubtitleTrack, 2);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                EventType.CueEnter
              );

              expectCueHtml(cueEnterEvent, 'CueEnter');
              expect(
                (cueEnterEvent.html as string).length,
                'CueEnter html should be non-empty'
              ).toBeGreaterThan(0);
            });
          }
        );

        spec.it(
          'CueExit carries the same layout and html as its paired CueEnter',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSideLoadedTrackAndSeek(positionedSubtitleTrack, 2);

              await expectEvent(EventType.CueEnter);
              const cueExitEvent: CueExitEvent = await expectEvent(
                EventType.CueExit
              );

              expectPositionedCueLayout(cueExitEvent.layout, 'CueExit');
              expectCueHtml(cueExitEvent, 'CueExit');
            });
          }
        );
      };
      spec.describe(
        'Android cue geometry fields',
        defineAndroidCueGeometryTests,
        testSelectors.cueGeometry
      );
    }

    if (Platform.OS === 'ios') {
      const defineIosCueGeometryTests = () => {
        spec.it(
          'CueEnter carries in-manifest WebVTT layout metadata',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSourceConfig(sourceWithInManifestPositionedSubs);
              await callPlayer(async (player) => {
                const subtitleTracks = await player.getAvailableSubtitles();
                const subtitleTrack =
                  subtitleTracks.find((track) => track.label === 'Debug') ??
                  subtitleTracks.find((track) => track.identifier !== 'off');
                expect(
                  subtitleTrack?.identifier,
                  'Positioned subtitle track should have an identifier'
                ).toBeDefined();
                if (!subtitleTrack?.identifier) {
                  return;
                }
                await player.setSubtitleTrack(subtitleTrack.identifier);
                player.play();
              });
              await callPlayerAndExpectEvent((player) => {
                player.seek(1);
              }, EventType.Seeked);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                FilteredEvent<CueEnterEvent>(
                  EventType.CueEnter,
                  (event) =>
                    event.layout?.line?.value === 10 &&
                    event.layout?.line?.unit === 'percent' &&
                    event.layout?.position === 10 &&
                    event.layout?.textAlign === 'start'
                ),
                30
              );
              expect(
                cueEnterEvent.layout,
                'CueEnter should expose cue layout'
              ).toBeDefined();
              const enterLayout = cueEnterEvent.layout as SubtitleCueLayout;
              expect(
                enterLayout.line?.value,
                'CueEnter line value'
              ).toBeCloseTo(10);
              expect(enterLayout.line?.unit, 'CueEnter line unit').toBe(
                'percent'
              );
              expect(enterLayout.position, 'CueEnter position').toBeCloseTo(10);
              expect(enterLayout.positionAlign, 'CueEnter positionAlign').toBe(
                'line-left'
              );
              expect(
                enterLayout.size,
                'CueEnter should omit default cue-box size'
              ).toBeUndefined();
              expect(enterLayout.textAlign, 'CueEnter textAlign').toBe('start');
              expect(
                enterLayout.writingMode,
                'CueEnter writingMode should be omitted for horizontal cues'
              ).toBeUndefined();
            });
          }
        );
      };
      spec.describe(
        'iOS cue geometry fields',
        defineIosCueGeometryTests,
        testSelectors.cueGeometry
      );

      const defineIosCueMetadataTests = () => {
        spec.it('CueEnter carries CEA-608 grid position metadata', async () => {
          await startPlayerTest({}, async () => {
            await loadSourceConfig(sourceWithCea608Captions);
            await callPlayer(async (player) => {
              const subtitleTracks = await player.getAvailableSubtitles();
              const cea608Track = subtitleTracks.find(
                (track: SubtitleTrack) => track.format === SubtitleFormat.CEA
              );
              expect(
                cea608Track,
                'CEA-608 track should be available'
              ).toBeDefined();
              expect(
                cea608Track?.identifier,
                'CEA-608 track should have an identifier'
              ).toBeDefined();
              if (!cea608Track?.identifier) {
                return;
              }
              await player.setSubtitleTrack(cea608Track.identifier);
              player.play();
            });
            await callPlayerAndExpectEvent((player) => {
              player.seek(10);
            }, EventType.Seeked);

            const cueEnterEvent: CueEnterEvent = await expectEvent(
              EventType.CueEnter,
              30
            );
            const position = cueEnterEvent.cea608Position;
            expect(
              position,
              'CueEnter should expose CEA-608 position'
            ).toBeDefined();
            expect(position?.rows, 'CEA-608 row count').toBe(15);
            expect(position?.columns, 'CEA-608 column count').toBe(32);
            expect(
              position?.rowIndex,
              'CEA-608 row index should be in range'
            ).toBeGreaterThanOrEqual(0);
            expect(
              position?.rowIndex,
              'CEA-608 row index should be below rows'
            ).toBeSmallerThan(15);
            expect(
              position?.columnIndex,
              'CEA-608 column index should be in range'
            ).toBeGreaterThanOrEqual(0);
            expect(
              position?.columnIndex,
              'CEA-608 column index should be below columns'
            ).toBeSmallerThan(32);
          });
        });
      };
      spec.describe(
        'iOS cue metadata fields',
        defineIosCueMetadataTests,
        testSelectors.cueMetadata
      );
    }
  });
};
