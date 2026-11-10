import { BufferType, Player } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayer,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('buffer API', () => {
    spec.it('shares buffer targets with compatibility aliases', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.artOfMotionHls);
        await callPlayer(async (player) => {
          const alias = new Player({ nativeId: player.nativeId });
          await alias.buffer.setTargetLevel(BufferType.FORWARD_DURATION, 12);
          const levels = await player.buffer.getLevel(
            BufferType.FORWARD_DURATION
          );
          expect(levels.audio.targetLevel).toBe(12);
          expect(levels.video.targetLevel).toBe(12);
        });
      });
    });
  });
};
