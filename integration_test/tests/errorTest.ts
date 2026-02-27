import { Platform } from 'react-native';
import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { ErrorEvent } from 'bitmovin-player-react-native';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

export default (spec: TestScope) => {
  spec.describe('error events with network details', () => {
    spec.it(
      'emits an error with httpResponse when a DRM license request fails',
      async () => {
        const source =
          Platform.OS === 'android'
            ? Sources.widevineDrmWithBrokenLicense
            : Sources.fairplayDrmWithBrokenLicense;

        await startPlayerTest({}, async () => {
          const errorEvent: ErrorEvent =
            await callPlayerAndExpectEvent<ErrorEvent>((player) => {
              player.load(source);
            }, EventType.PlayerError);

          expect(
            errorEvent.code,
            'Error event should have a code'
          ).toBeDefined();
          expect(
            errorEvent.message,
            'Error event should have a message'
          ).toBeDefined();
          expect(errorEvent.data, 'Error event should have data').toBeDefined();
          expect(
            errorEvent.data?.httpResponse,
            'Error data should contain httpResponse'
          ).toBeDefined();
          expect(
            errorEvent.data?.httpResponse?.status,
            'httpResponse status should be 403'
          ).toBe(403);
          expect(
            errorEvent.data?.httpResponse?.url,
            'httpResponse should have a url'
          ).toBeDefined();
          expect(
            errorEvent.data?.httpResponse?.request,
            'httpResponse should have a request'
          ).toBeDefined();
        });
      }
    );
  });
};
