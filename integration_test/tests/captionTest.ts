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
import { CueEnterEvent, CueExitEvent } from 'bitmovin-player-react-native';

function expectCueVtt(
  vtt: CueEnterEvent['vtt'] | CueExitEvent['vtt'],
  eventName: string
) {
  expect(vtt, `${eventName} event should have vtt`).toBeDefined();
  if (!vtt) {
    return;
  }

  expect(
    typeof vtt.line === 'number' || vtt.line === 'auto',
    `${eventName} vtt line should be a number or auto`
  ).toBe(true);
  expect(typeof vtt.snapToLines, `${eventName} snapToLines type`).toBe(
    'boolean'
  );
  expect(
    ['start', 'center', 'end'].includes(vtt.lineAlign ?? ''),
    `${eventName} lineAlign value`
  ).toBe(true);
  expect(
    typeof vtt.position === 'number' || vtt.position === 'auto',
    `${eventName} vtt position should be a number or auto`
  ).toBe(true);
  expect(
    ['line-left', 'center', 'line-right', 'auto'].includes(
      vtt.positionAlign ?? ''
    ),
    `${eventName} positionAlign value`
  ).toBe(true);
  expect(typeof vtt.size, `${eventName} size type`).toBe('number');
  expect(
    ['start', 'center', 'end', 'left', 'right'].includes(vtt.align ?? ''),
    `${eventName} align value`
  ).toBe(true);
  expect(
    ['', 'lr', 'rl'].includes(vtt.vertical ?? ''),
    `${eventName} vertical value`
  ).toBe(true);
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
        expectCueVtt(cueEnterEvent.vtt, 'CueEnter');
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
        expectCueVtt(cueExitEvent.vtt, 'CueExit');
      });
    });

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
