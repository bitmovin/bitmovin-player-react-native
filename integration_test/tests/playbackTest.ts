import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventSequence,
  EventType,
  expectEvent,
  expectEvents,
  loadSourceConfig,
  playFor,
  RepeatedEvent,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';
import {
  TimeChangedEvent,
  PlaybackFinishedEvent,
} from 'bitmovin-player-react-native';

export default (spec: TestScope) => {
  spec.describe('calling play when a source is loaded', () => {
    spec.it('emits a Play and Playing events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayerAndExpectEvents((player) => {
          player.play();
        }, EventSequence(EventType.Play, EventType.Playing));
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
        await callPlayerAndExpectEvents((player) => {
          player.play();
        }, EventSequence(EventType.Play, EventType.Playing));
        await expectEvents(RepeatedEvent(EventType.TimeChanged, 5));
      });
    });

    spec.it('validates TimeChanged event properties', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayerAndExpectEvents((player) => {
          player.play();
        }, EventSequence(EventType.Play, EventType.Playing));

        const timeChangedEvent = (await expectEvent(
          EventType.TimeChanged
        )) as TimeChangedEvent;
        expect(
          timeChangedEvent.currentTime,
          'TimeChanged event should have currentTime'
        ).toBeDefined();
        expect(
          typeof timeChangedEvent.currentTime,
          'currentTime should be a number'
        ).toBe('number');
        expect(
          timeChangedEvent.currentTime,
          'currentTime should be >= 0'
        ).toBeGreaterThanOrEqual(0);

        // Note: duration is not available on TimeChangedEvent in all platforms
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

    spec.it('validates PlaybackFinished event properties', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        const playbackFinishedEvent = (await callPlayerAndExpectEvent(
          async (player) => {
            player.play();
            const duration = await player.getDuration();
            player.seek(duration - 3);
          },
          EventType.PlaybackFinished
        )) as PlaybackFinishedEvent;

        expect(
          playbackFinishedEvent.name,
          'PlaybackFinished event should have name'
        ).toBeDefined();
        expect(
          playbackFinishedEvent.name,
          'PlaybackFinished event name should be onPlaybackFinished'
        ).toBe('onPlaybackFinished');
        expect(
          playbackFinishedEvent.timestamp,
          'PlaybackFinished event should have timestamp'
        ).toBeDefined();
        expect(
          typeof playbackFinishedEvent.timestamp,
          'timestamp should be a number'
        ).toBe('number');
        expect(
          playbackFinishedEvent.timestamp,
          'timestamp should be > 0'
        ).toBeGreaterThan(0);
      });
    });
  });
};
