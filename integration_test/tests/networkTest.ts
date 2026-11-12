import { TestScope } from 'cavy';
import {
  HttpRequest,
  HttpRequestType,
  HttpResponse,
} from 'bitmovin-player-react-native';
import {
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';

export default (spec: TestScope) => {
  spec.describe('network preprocessing', () => {
    spec.it(
      'invokes preprocessHttpRequest and preprocessHttpResponse and still loads the source',
      async () => {
        const requests: { type: HttpRequestType; request: HttpRequest }[] = [];
        const responses: { type: HttpRequestType; response: HttpResponse }[] =
          [];

        await startPlayerTest(
          {
            networkConfig: {
              preprocessHttpRequest: async (type, request) => {
                requests.push({ type, request });
                return request;
              },
              preprocessHttpResponse: async (type, response) => {
                responses.push({ type, response });
                return response;
              },
            },
          },
          async () => {
            // The manifest has to pass through both callbacks before the player can become ready.
            await callPlayerAndExpectEvent((player) => {
              player.load(Sources.artOfMotionHls);
            }, EventType.Ready);

            expect(
              requests.length,
              'preprocessHttpRequest invocations'
            ).toBeGreaterThan(0);
            expect(
              responses.length,
              'preprocessHttpResponse invocations'
            ).toBeGreaterThan(0);
            expect(
              requests.some(
                ({ type }) => type === HttpRequestType.ManifestHlsMaster
              ),
              'preprocessHttpRequest saw the HLS master manifest'
            ).toBe(true);
            expect(
              responses.some(
                ({ type }) => type === HttpRequestType.ManifestHlsMaster
              ),
              'preprocessHttpResponse saw the HLS master manifest'
            ).toBe(true);
            expect(requests[0]?.request.url, 'preprocessHttpRequest URL').toBe(
              Sources.artOfMotionHls.url
            );
          }
        );
      }
    );
  });
};
