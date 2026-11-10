import {
  OfflineContentManager,
  OfflineState,
  type OnOptionsAvailableEvent,
} from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('offline content options', () => {
    spec.it('delivers options requested through a manager alias', async () => {
      const identifier = `cavy-options-${Date.now()}`;
      const config = {
        nativeId: identifier,
        identifier,
        sourceConfig: Sources.artOfMotionHls,
      };
      const manager = new OfflineContentManager(config);
      const alias = new OfflineContentManager(config);
      let removeListener = () => {};
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const available = new Promise<OnOptionsAvailableEvent>(
          (resolve, reject) => {
            removeListener = manager.addListener({
              onOptionsAvailable: resolve,
              onError: (event) => reject(new Error(event.message)),
            });
            timeout = setTimeout(
              () => reject(new Error('No offline options event')),
              15000
            );
          }
        );
        const [, event] = await Promise.all([alias.getOptions(), available]);
        expect(event.nativeId).toBe(manager.nativeId);
        expect(event.identifier).toBe(identifier);
        expect(Boolean(event.options), 'Available offline options').toBe(true);
        expect(await alias.state()).toBe(OfflineState.NotDownloaded);
      } finally {
        clearTimeout(timeout);
        removeListener();
        await manager.destroy();
      }
    });
  });
};
