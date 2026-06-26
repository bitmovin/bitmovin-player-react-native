import { TestScope } from 'cavy';
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
import {
  CueEnterEvent,
  CueExitEvent,
  SideLoadedSubtitleTrack,
  SourceConfig,
  SourceType,
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

function expectPositionedCueLayout(
  layout: CueEnterEvent['layout'] | CueExitEvent['layout'],
  eventName: string
) {
  expect(layout, `${eventName} should have a layout field`).toBeDefined();

  const line = layout?.line;
  expect(line, `${eventName} line should be present`).toBeDefined();
  expect(line?.value, `${eventName} line.value should be 85`).toBeCloseTo(85);
  expect(line?.unit, `${eventName} line.unit should be percent`).toBe(
    'percent'
  );
  expect(
    layout?.position,
    `${eventName} position should be 50`
  ).toBeCloseTo(50);
  expect(layout?.size, `${eventName} size should be 80`).toBeCloseTo(80);
  expect(layout?.textAlign, `${eventName} textAlign should be center`).toBe(
    'center'
  );
  expect(
    layout?.writingMode,
    `${eventName} writingMode should be omitted for horizontal cues`
  ).toBeUndefined();
}

function expectCueHtml(
  event: CueEnterEvent | CueExitEvent,
  eventName: string
) {
  expect(event.html, `${eventName} html should be present`).toBeDefined();
  expect(typeof event.html, `${eventName} html should be a string`).toBe(
    'string'
  );
  expect(
    (event.html as string).length,
    `${eventName} html should be non-empty`
  ).toBeGreaterThan(0);
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
  expect(typeof event.region?.style, `${eventName} region style type`).toBe(
    'string'
  );
  expect(
    (event as CueEnterEvent & CueExitEvent & { regionStyle?: string })
      .regionStyle,
    `${eventName} should not expose legacy top-level regionStyle`
  ).toBeUndefined();
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
      });
    });

    if (Platform.OS === 'android') {
      spec.describe('Android cue geometry fields', () => {
        spec.it(
          'CueEnter layout field reflects geometry authored in the VTT',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSourceConfig(
                sourceWithSubtitleTrack(positionedSubtitleTrack)
              );
              await callPlayer(async (player) => {
                player.setSubtitleTrack('positioned-cues');
                player.play();
              });
              await callPlayerAndExpectEvent((player) => {
                player.seek(2);
              }, EventType.Seeked);

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
              await loadSourceConfig(
                sourceWithSubtitleTrack(positionedSubtitleTrack)
              );
              await callPlayer(async (player) => {
                player.setSubtitleTrack('positioned-cues');
                player.play();
              });
              await callPlayerAndExpectEvent((player) => {
                player.seek(2);
              }, EventType.Seeked);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                EventType.CueEnter
              );

              expectCueHtml(cueEnterEvent, 'CueEnter');
            });
          }
        );

        spec.it(
          'CueExit carries the same layout and html as its paired CueEnter',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSourceConfig(
                sourceWithSubtitleTrack(positionedSubtitleTrack)
              );
              await callPlayer(async (player) => {
                player.setSubtitleTrack('positioned-cues');
                player.play();
              });
              await callPlayerAndExpectEvent((player) => {
                player.seek(2);
              }, EventType.Seeked);

              await expectEvent(EventType.CueEnter);
              const cueExitEvent: CueExitEvent = await expectEvent(
                EventType.CueExit
              );

              expectPositionedCueLayout(cueExitEvent.layout, 'CueExit');
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
              await loadSourceConfig(
                sourceWithSubtitleTrack(positionedSubtitleTrack)
              );
              await callPlayer(async (player) => {
                player.setSubtitleTrack('positioned-cues');
                player.play();
              });
              await callPlayerAndExpectEvent((player) => {
                player.seek(2);
              }, EventType.Seeked);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                EventType.CueEnter
              );
              expectPositionedCueLayout(cueEnterEvent.layout, 'CueEnter');
              expectCueHtml(cueEnterEvent, 'CueEnter');

              const cueExitEvent: CueExitEvent = await expectEvent(
                EventType.CueExit
              );
              expectPositionedCueLayout(cueExitEvent.layout, 'CueExit');
              expectCueHtml(cueExitEvent, 'CueExit');
            });
          }
        );

        spec.it('CueEnter and CueExit carry WebVTT region metadata', async () => {
          await startPlayerTest({}, async () => {
            await loadSourceConfig(sourceWithSubtitleTrack(regionSubtitleTrack));
            await callPlayer(async (player) => {
              player.setSubtitleTrack('region-cues');
              player.play();
            });
            await callPlayerAndExpectEvent((player) => {
              player.seek(1);
            }, EventType.Seeked);

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
