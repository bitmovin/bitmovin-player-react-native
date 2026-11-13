import { Player, Source } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import type { EventSubscription } from 'expo-modules-core';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('native object creation', () => {
    spec.it(
      'loads through its first native operation without a PlayerView',
      async () => {
        let requests = 0;
        const player = new Player({
          licenseKey: PlayerTestWorld.defaultLicenseKey,
          networkConfig: {
            preprocessHttpRequest: async (_type, request) => {
              requests++;
              return request;
            },
          },
        });
        const source = new Source(Sources.artOfMotionHls);
        let deadline: ReturnType<typeof setTimeout> | undefined;
        let onReady = () => {};
        const ready = new Promise<void>((resolve, reject) => {
          onReady = resolve;
          deadline = setTimeout(
            () => reject(new Error('Headless Player did not become ready')),
            25000
          );
        });
        void ready.catch(() => {});
        let subscription: EventSubscription | undefined;
        try {
          subscription = await player.on('ready', onReady);
          // No PlayerView, initialize call, or SDK getter precedes this command.
          await player.loadSource(source);
          await ready;
          expect(
            requests,
            'native preprocessing resumed loading'
          ).toBeGreaterThan(0);
          expect(await player.getSource(), 'original Source identity').toBe(
            source
          );
        } finally {
          clearTimeout(deadline);
          subscription?.remove();
          await player.destroy();
        }
      }
    );
  });
};
