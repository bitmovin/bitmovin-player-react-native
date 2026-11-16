import { DecoderContextMediaType } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  EventType,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('decoder configuration', () => {
    spec.it(
      'plays with decoders returned by the priority callback',
      async () => {
        let receivedVideoDecoders = false;
        await startPlayerTest(
          {
            playbackConfig: {
              decoderConfig: {
                decoderPriorityProvider: {
                  overrideDecodersPriority: (context, decoders) => {
                    if (context.mediaType === DecoderContextMediaType.VIDEO) {
                      receivedVideoDecoders = decoders.some(
                        (decoder) => decoder.name.length > 0
                      );
                    }
                    return decoders;
                  },
                },
              },
            },
          },
          async () => {
            await loadSourceConfig(Sources.artOfMotionHls);
            await callPlayerAndExpectEvent(
              (player) => player.play(),
              EventType.Playing
            );
            expect(receivedVideoDecoders, 'Native decoder callback').toBe(true);
          }
        );
      }
    );
  });
};
