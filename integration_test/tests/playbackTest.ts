import { TestScope } from 'cavy';
import { Platform } from 'react-native';
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
  PlaybackSpeedChangedEvent,
} from 'bitmovin-player-react-native';

export default (spec: TestScope) => {
  spec.describe('calling play when a source is loaded', () => {
    spec.it('emits a Play and Playing events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayerAndExpectEvents(
          async (player) => {
            await player.play();
          },
          EventSequence(EventType.Play, EventType.Playing)
        );
      });
    });
  });
  if (Platform.OS === 'ios') {
    spec.describe('resetting the maximum selectable bitrate', () => {
      spec.it(
        'accepts null after a finite cap and continues playback',
        async () => {
          await startPlayerTest({}, async () => {
            await loadSourceConfig(Sources.artOfMotionHls);
            await callPlayerAndExpectEvent(async (player) => {
              await player.setMaxSelectableBitrate(1_000_000);
              await player.setMaxSelectableBitrate(null);
              await player.play();
            }, EventType.Playing);
          });
        }
      );
    });
  }
  spec.describe('calling pause when a source is loaded', () => {
    spec.it('emits a Paused event', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await playFor(1);
        await callPlayerAndExpectEvent(async (player) => {
          await player.pause();
        }, EventType.Paused);
      });
    });
  });
  spec.describe('changing the playback speed', () => {
    spec.it('emits a PlaybackSpeedChanged event', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await playFor(1);
        const event = await callPlayerAndExpectEvent<PlaybackSpeedChangedEvent>(
          async (player) => {
            await player.setPlaybackSpeed(2);
          },
          EventType.PlaybackSpeedChanged
        );
        expect(event.from).toBe(1);
        expect(event.to).toBe(2);
      });
    });
  });
  spec.describe('playing a source', () => {
    spec.it('emits TimeChanged events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayerAndExpectEvents(
          async (player) => {
            await player.play();
          },
          EventSequence(EventType.Play, EventType.Playing)
        );
        await expectEvents(RepeatedEvent(EventType.TimeChanged, 5));
      });
    });

    spec.it('validates TimeChanged event properties', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayerAndExpectEvents(
          async (player) => {
            await player.play();
          },
          EventSequence(EventType.Play, EventType.Playing)
        );

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
          await player.play();
          const duration = await player.getDuration();
          await player.seek(duration - 3);
        }, EventType.PlaybackFinished);
      });
    });

    spec.it('validates PlaybackFinished event properties', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        const playbackFinishedEvent = (await callPlayerAndExpectEvent(
          async (player) => {
            await player.play();
            const duration = await player.getDuration();
            await player.seek(duration - 3);
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
