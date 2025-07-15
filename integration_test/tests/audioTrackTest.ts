import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { Platform } from 'react-native';
import expect from './helper/Expect';

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

            await callPlayer(async (player) => {
              const audioTrack = await player.getAudioTrack();
              expect(
                audioTrack?.qualities,
                'Android should have audio qualities'
              ).toBeDefined();
              expect(
                audioTrack?.qualities,
                'Audio qualities should be an array'
              ).toBeInstanceOf(Array);
              expect(
                audioTrack?.qualities!.length,
                'Audio qualities should not be empty'
              ).toBeGreaterThan(0);

              const quality = audioTrack?.qualities![0]!;
              expect(quality.id, 'Audio quality should have id').toBeDefined();
              expect(
                typeof quality.id,
                'Audio quality id should be string'
              ).toBe('string');
              expect(
                quality.label,
                'Audio quality should have label'
              ).toBeDefined();
              expect(
                typeof quality.label,
                'Audio quality label should be string'
              ).toBe('string');
              expect(
                quality.bitrate,
                'Audio quality should have bitrate'
              ).toBeDefined();
              expect(
                typeof quality.bitrate,
                'Audio quality bitrate should be number'
              ).toBe('number');
              expect(
                quality.bitrate,
                'Audio quality bitrate should be > 0'
              ).toBeGreaterThan(0);
              expect(
                quality.averageBitrate,
                'Audio quality should have averageBitrate'
              ).toBeDefined();
              expect(
                typeof quality.averageBitrate,
                'Audio quality averageBitrate should be number'
              ).toBe('number');
              expect(
                quality.peakBitrate,
                'Audio quality should have peakBitrate'
              ).toBeDefined();
              expect(
                typeof quality.peakBitrate,
                'Audio quality peakBitrate should be number'
              ).toBe('number');
              expect(
                quality.codec,
                'Audio quality should have codec'
              ).toBeDefined();
              expect(
                typeof quality.codec,
                'Audio quality codec should be string'
              ).toBe('string');
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

              await callPlayer(async (player) => {
                const audioTrack = await player.getAudioTrack();
                expect(
                  audioTrack?.qualities,
                  'iOS should not have audio qualities'
                ).toBeUndefined();
                expect(
                  audioTrack?.identifier,
                  'Audio track should have identifier'
                ).toBeDefined();
                expect(
                  typeof audioTrack?.identifier,
                  'Audio track identifier should be string'
                ).toBe('string');
                expect(
                  audioTrack?.label,
                  'Audio track should have label'
                ).toBeDefined();
                expect(
                  typeof audioTrack?.label,
                  'Audio track label should be string'
                ).toBe('string');
                expect(
                  audioTrack?.language,
                  'Audio track should have language'
                ).toBeDefined();
                expect(
                  typeof audioTrack?.language,
                  'Audio track language should be string'
                ).toBe('string');
              });
            });
          }
        );
      });
    }
  });
};
