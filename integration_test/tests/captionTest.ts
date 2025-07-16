import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventSequence,
  EventType,
  expectEvents,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';

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
  });
};
