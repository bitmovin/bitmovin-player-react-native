import { Platform } from 'react-native';
import { TestScope } from 'cavy';
import { callPlayer, startPlayerTest } from '../playertesting';
import { expect } from './helper/Expect';

export default (spec: TestScope) => {
  if (Platform.OS !== 'ios') return;

  spec.describe('media controls API', () => {
    spec.it('reflects configured state and runtime changes', async () => {
      await startPlayerTest(
        { mediaControlConfig: { isEnabled: true } },
        async () => {
          await callPlayer(async (player) => {
            expect(await player.mediaControls.isEnabled()).toBe(true);

            await player.mediaControls.setEnabled(false);
            expect(await player.mediaControls.isEnabled()).toBe(false);

            await player.mediaControls.setEnabled(true);
            expect(await player.mediaControls.isEnabled()).toBe(true);
          });
        }
      );
    });
  });
};
