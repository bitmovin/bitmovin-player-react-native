import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  expectEvent,
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
} from 'bitmovin-player-react-native';
import { Image, Platform } from 'react-native';

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

const regionSubtitleTrack: SideLoadedSubtitleTrack = {
  identifier: 'region-cues',
  url: Image.resolveAssetSource(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../assets/subtitles/region.vtt')
  ).uri,
  label: 'Region Cues',
  language: 'en',
  format: SubtitleFormat.VTT,
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
    player.setSubtitleTrack(subtitleTrack.identifier);
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
    (positionedLayout.line as any)?.value,
    `${eventName} line.value should be 85`
  ).toBeCloseTo(85);
  expect(
    (positionedLayout.line as any)?.unit,
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

function expectCueRegionMetadata(
  event: CueEnterEvent | CueExitEvent,
  eventName: string
) {
  expect(
    event.region,
    `${eventName} should expose region metadata`
  ).toBeDefined();
  expect(event.region?.id, `${eventName} region id`).toBe('region-test');
  expect(event.region?.style, `${eventName} region style`).toBeDefined();
  expect(
    (event as CueEnterEvent & CueExitEvent & { regionStyle?: string })
      .regionStyle,
    `${eventName} should not expose legacy top-level regionStyle`
  ).toBeUndefined();
}

export default (spec: TestScope) => {
  spec.describe('caption metadata', () => {
    if (Platform.OS === 'android') {
      spec.describe('Android cue geometry fields', () => {
        spec.it(
          'CueEnter layout field reflects geometry authored in the VTT',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSideLoadedTrackAndSeek(positionedSubtitleTrack, 2);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                EventType.CueEnter
              );

              expectPositionedCueLayout(cueEnterEvent.layout, 'CueEnter');
              expect(
                cueEnterEvent.layout?.writingMode,
                'writingMode should be horizontal'
              ).toBe('horizontal');
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
              expect(
                cueExitEvent.layout?.writingMode,
                'writingMode should be horizontal'
              ).toBe('horizontal');
              expectCueHtml(cueExitEvent, 'CueExit');
            });
          }
        );
      });
    }

    if (Platform.OS === 'ios') {
      spec.describe('iOS cue metadata fields', () => {
        spec.it(
          'CueEnter and CueExit carry positioned WebVTT layout and html',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSideLoadedTrackAndSeek(positionedSubtitleTrack, 2);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                EventType.CueEnter
              );
              expectPositionedCueLayout(cueEnterEvent.layout, 'CueEnter');
              expect(
                cueEnterEvent.layout?.writingMode,
                'CueEnter writingMode should be omitted for horizontal cues'
              ).toBeUndefined();
              expectCueHtml(cueEnterEvent, 'CueEnter');

              const cueExitEvent: CueExitEvent = await expectEvent(
                EventType.CueExit
              );
              expectPositionedCueLayout(cueExitEvent.layout, 'CueExit');
              expect(
                cueExitEvent.layout?.writingMode,
                'CueExit writingMode should be omitted for horizontal cues'
              ).toBeUndefined();
              expectCueHtml(cueExitEvent, 'CueExit');
            });
          }
        );

        spec.it('CueEnter and CueExit carry WebVTT region metadata', async () => {
          await startPlayerTest({}, async () => {
            await loadSideLoadedTrackAndSeek(regionSubtitleTrack, 1);

            const cueEnterEvent: CueEnterEvent = await expectEvent(
              EventType.CueEnter
            );
            expectCueRegionMetadata(cueEnterEvent, 'CueEnter');

            const cueExitEvent: CueExitEvent = await expectEvent(
              EventType.CueExit
            );
            expectCueRegionMetadata(cueExitEvent, 'CueExit');
          });
        });
      });
    }
  });
};
