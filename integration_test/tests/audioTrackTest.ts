import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { Platform } from 'react-native';

export default (spec: TestScope) => {
  spec.describe('loading a source with audio tracks', () => {
    spec.it('emits AudioAdded event', async () => {
      await startPlayerTest({}, async () => {
        await callPlayerAndExpectEvent((player) => {
          player.load(Sources.artOfMotionHls);
        }, EventType.AudioAdded);
      });
    });
    if (Platform.OS === 'android') {
      spec.describe('when Platform is Android', () => {
        spec.it('AudioTrack contains qualities information', async () => {
          await startPlayerTest({}, async () => {
            await callPlayerAndExpectEvent((player) => {
              player.load(Sources.artOfMotionHls);
            }, EventType.AudioAdded);
            callPlayer(async (player) => {
              const audioTrack = await player.getAudioTrack();
              expect(audioTrack?.qualities).toBeDefined();
              const quality = audioTrack?.qualities![0]!;
              expect(quality.id).toBeDefined();
              expect(quality.label).toBeDefined();
              expect(quality.bitrate).toBeDefined();
              expect(quality.averageBitrate).toBeDefined();
              expect(quality.peakBitrate).toBeDefined();
              expect(quality.codec).toBeDefined();
              expect(quality.channelCount).toBeDefined();
            });
          });
        });
      });
    }
    if (Platform.OS === 'ios') {
      spec.describe('when Platform is iOS', () => {
        spec.it(
          'AudioTrack does not contain qualities information',
          async () => {
            await startPlayerTest({}, async () => {
              await callPlayerAndExpectEvent((player) => {
                player.load(Sources.artOfMotionHls);
              }, EventType.AudioAdded);
              callPlayer(async (player) => {
                const audioTrack = await player.getAudioTrack();
                expect(audioTrack?.qualities).toBeUndefined();
              });
            });
          }
        );
      });
    }
  });
};
