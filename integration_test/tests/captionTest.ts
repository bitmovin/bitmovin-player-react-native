import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventSequence,
  EventType,
  expectEvent,
  expectEvents,
  FilteredEvent,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';
import {
  CueEnterEvent,
  CueExitEvent,
  SubtitleTrack,
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

const sourceWithPositionedSubs: SourceConfig = {
  url: Sources.artOfMotionHls.url!,
  type: SourceType.HLS,
  subtitleTracks: [positionedSubtitleTrack],
};

const sourceWithInManifestPositionedSubs: SourceConfig = {
  url: 'https://bitmovin-player-eu-west1-ci-input.s3.amazonaws.com/general/hls/sintel-different_attributes-subtitle/master-debug-short.m3u8',
  type: SourceType.HLS,
};

const sourceWithCea608Captions: SourceConfig = {
  url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
  type: SourceType.HLS,
};

export default (spec: TestScope) => {
  spec.describe('playing captions', () => {
    spec.it('emits CueEnter and CueExit events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.sintel);
        await callPlayer(async (player) => {
          const subtitleTrack = (await player.getAvailableSubtitles())[1];
          await player.setSubtitleTrack(subtitleTrack.identifier);
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
          await player.setSubtitleTrack(subtitleTrack.identifier);
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
          await player.setSubtitleTrack(subtitleTrack.identifier);
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
              await loadSourceConfig(sourceWithPositionedSubs);
              await callPlayer(async (player) => {
                await player.setSubtitleTrack('positioned-cues');
                player.play();
              });
              await callPlayerAndExpectEvent((player) => {
                player.seek(2);
              }, EventType.Seeked);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                EventType.CueEnter
              );

              expect(
                cueEnterEvent.layout,
                'CueEnter should have a layout field'
              ).toBeDefined();

              const layout = cueEnterEvent.layout as SubtitleCueLayout;

              expect(
                layout.writingMode,
                'writingMode should be omitted for horizontal cues'
              ).toBeUndefined();

              // line:85% in the VTT → { value: 85, unit: 'percent' }
              expect(layout.line?.value, 'line.value should be 85').toBe(85);
              expect(layout.line?.unit, 'line.unit should be percent').toBe(
                'percent'
              );

              // position:50% → 50
              expect(layout.position, 'position should be 50').toBe(50);

              // size:80% → 80
              expect(layout.size, 'size should be 80').toBe(80);

              // align:center → textAlign center
              expect(layout.textAlign, 'textAlign should be center').toBe(
                'center'
              );
            });
          }
        );

        spec.it(
          'CueEnter html field is present for a cue with inline styling',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSourceConfig(sourceWithPositionedSubs);
              await callPlayer(async (player) => {
                await player.setSubtitleTrack('positioned-cues');
                player.play();
              });
              await callPlayerAndExpectEvent((player) => {
                player.seek(2);
              }, EventType.Seeked);

              const cueEnterEvent: CueEnterEvent = await expectEvent(
                EventType.CueEnter
              );

              // The VTT cue contains <b>...</b> so Bitmovin SDK populates html
              expect(
                cueEnterEvent.html,
                'html should be present for a cue with inline tags'
              ).toBeDefined();
              expect(typeof cueEnterEvent.html, 'html should be a string').toBe(
                'string'
              );
              expect(
                (cueEnterEvent.html as string).length,
                'html should be non-empty'
              ).toBeGreaterThan(0);
            });
          }
        );

        spec.it(
          'CueExit carries the same layout and html as its paired CueEnter',
          async () => {
            await startPlayerTest({}, async () => {
              await loadSourceConfig(sourceWithPositionedSubs);
              await callPlayer(async (player) => {
                await player.setSubtitleTrack('positioned-cues');
                player.play();
              });
              await callPlayerAndExpectEvent((player) => {
                player.seek(2);
              }, EventType.Seeked);

              await expectEvent(EventType.CueEnter);
              const cueExitEvent: CueExitEvent = await expectEvent(
                EventType.CueExit
              );

              expect(
                cueExitEvent.layout,
                'CueExit should have a layout field'
              ).toBeDefined();

              const layout = cueExitEvent.layout as SubtitleCueLayout;
              expect(
                layout.writingMode,
                'writingMode should be omitted for horizontal cues'
              ).toBeUndefined();
              expect(layout.line?.value, 'line.value should be 85').toBe(85);
              expect(layout.position, 'position should be 50').toBe(50);

              expect(
                cueExitEvent.html,
                'CueExit html should be present'
              ).toBeDefined();
              expect(typeof cueExitEvent.html, 'html should be a string').toBe(
                'string'
              );
            });
          }
        );
      });
    }

    if (Platform.OS === 'ios') {
      spec.describe('iOS cue metadata fields', () => {
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

          await callPlayerAndExpectEvent(async (player) => {
            await player.setSubtitleTrack(subtitleTrack.identifier);
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

          await callPlayerAndExpectEvent(async (player) => {
            await player.setSubtitleTrack(undefined);
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
