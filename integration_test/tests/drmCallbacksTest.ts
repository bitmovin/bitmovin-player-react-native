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
  spec.describe('DRM preprocessing', () => {
    spec.it(
      'plays encrypted content through request and license callbacks',
      async () => {
        await startPlayerTest({}, async () => {
          let messages = 0;
          let licenses = 0;
          await loadSourceConfig({
            ...Sources.widevineDrm,
            drmConfig: {
              widevine: {
                ...Sources.widevineDrm.drmConfig?.widevine,
                prepareMessage: (message) => {
                  messages++;
                  return message;
                },
                prepareLicense: (license) => {
                  licenses++;
                  return license;
                },
              },
            },
          });
          await callPlayerAndExpectEvent((player) => {
            player.play();
          }, EventType.Playing);
          expect(messages > 0, 'DRM request callback').toBe(true);
          expect(licenses > 0, 'DRM license callback').toBe(true);
        });
      }
    );
  });
};
