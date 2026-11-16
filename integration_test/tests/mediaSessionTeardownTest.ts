import { Player } from 'bitmovin-player-react-native';
import { Platform } from 'react-native';
import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  EventType,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';

export default (spec: TestScope) => {
  if (Platform.OS !== 'android') return;

  spec.describe('media-session teardown', () => {
    spec.it(
      'keeps playback alive after prompt Player initialization and destruction',
      async () => {
        const destroyed = new Player({
          licenseKey: PlayerTestWorld.defaultLicenseKey,
          mediaControlConfig: { isEnabled: true },
        });
        let onDestroy: () => void = () => {};
        let deadline: ReturnType<typeof setTimeout> | undefined;
        try {
          await destroyed.initialize();
          await destroyed.isMuted();
          const finished = new Promise<void>((resolve, reject) => {
            deadline = setTimeout(
              () => reject(new Error('Player destruction timed out')),
              15000
            );
            onDestroy = resolve;
            destroyed.on('destroy', onDestroy);
          });
          destroyed.destroy();
          await finished;
        } finally {
          clearTimeout(deadline);
          destroyed.off('destroy', onDestroy);
          destroyed.destroy();
        }
        await startPlayerTest(
          { mediaControlConfig: { isEnabled: false } },
          async () => {
            await loadSourceConfig(Sources.artOfMotionHls);
            await callPlayerAndExpectEvent((player) => {
              player.play();
            }, EventType.Playing);
          }
        );
      }
    );
  });
};
