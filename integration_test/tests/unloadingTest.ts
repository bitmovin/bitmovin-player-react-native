import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';
import { Platform } from 'react-native';

export default (spec: TestScope) => {
  spec.describe('unloading the player', () => {
    spec.it('emits SourceUnloaded event', async () => {
      await startPlayerTest({}, async () => {
        await callPlayerAndExpectEvent((player) => {
          player.load(Sources.artOfMotionHls);
        }, EventType.Ready);
        await callPlayerAndExpectEvent((player) => {
          player.unload();
        }, EventType.SourceUnloaded);
      });
    });

    spec.it('validates SourceUnloaded event properties', async () => {
      await startPlayerTest({}, async () => {
        await callPlayerAndExpectEvent((player) => {
          player.load(Sources.artOfMotionHls);
        }, EventType.Ready);

        const sourceUnloadedEvent = await callPlayerAndExpectEvent((player) => {
          player.unload();
        }, EventType.SourceUnloaded);

        expect(
          sourceUnloadedEvent.name,
          'SourceUnloaded event should have name'
        ).toBeDefined();
        expect(
          sourceUnloadedEvent.name,
          'SourceUnloaded event name should be onSourceUnloaded'
        ).toBe('onSourceUnloaded');
        expect(
          sourceUnloadedEvent.timestamp,
          'SourceUnloaded event should have timestamp'
        ).toBeDefined();
        expect(
          typeof sourceUnloadedEvent.timestamp,
          'timestamp should be a number'
        ).toBe('number');
        expect(
          sourceUnloadedEvent.timestamp,
          'timestamp should be > 0'
        ).toBeGreaterThan(0);
      });
    });

    spec.it('validates player state after unload', async () => {
      const expectedDurationAfterUnload = Platform.OS !== 'android' ? 0 : -1;
      const expectedPausedAfterUnload =
        Platform.OS !== 'android' ? true : false;
      await startPlayerTest({}, async () => {
        await callPlayerAndExpectEvent((player) => {
          player.load(Sources.artOfMotionHls);
        }, EventType.Ready);

        await callPlayerAndExpectEvent((player) => {
          player.unload();
        }, EventType.SourceUnloaded);

        await callPlayer(async (player) => {
          const currentTime = await player.getCurrentTime();
          expect(currentTime, 'Current time should be 0 after unload').toBe(0);

          const duration = await player.getDuration();
          expect(
            duration,
            `Duration should be ${expectedDurationAfterUnload} after unload`
          ).toBe(expectedDurationAfterUnload);

          const isPaused = await player.isPaused();
          expect(isPaused, 'Player should be paused after unload').toBe(
            expectedPausedAfterUnload
          );
        });
      });
    });
  });
};
