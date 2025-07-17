import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventSequence,
  EventType,
  expectEvents,
  loadSourceConfig,
  playFor,
  RepeatedEvent,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('calling play when a source is loaded', () => {
    spec.it('emits a Play and Playing events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayerAndExpectEvents(
          (player) => {
            player.play();
          },
          EventSequence(EventType.Play, EventType.Playing)
        );
      });
    });
  });
  spec.describe('calling pause when a source is loaded', () => {
    spec.it('emits a Paused event', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await playFor(1);
        await callPlayerAndExpectEvent((player) => {
          player.pause();
        }, EventType.Paused);
      });
    });
  });
  spec.describe('playing a source', () => {
    spec.it('emits TimeChanged events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayerAndExpectEvents(
          (player) => {
            player.play();
          },
          EventSequence(EventType.Play, EventType.Playing)
        );
        await expectEvents(RepeatedEvent(EventType.TimeChanged, 5));
      });
    });
  });
  spec.describe('playing a source to its end', () => {
    spec.it('emits PlaybackFinished event', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayerAndExpectEvent(async (player) => {
          player.play();
          const duration = await player.getDuration();
          player.seek(duration - 3);
        }, EventType.PlaybackFinished);
      });
    });
  });
};
