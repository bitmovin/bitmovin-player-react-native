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

        const cueEnterEvent = await expectEvent(EventType.CueEnter);
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
      });
    });
  });
};
