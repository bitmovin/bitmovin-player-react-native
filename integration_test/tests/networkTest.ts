import { TestScope } from 'cavy';
import {
  HttpRequest,
  HttpRequestType,
  HttpResponse,
  NetworkConfig,
} from 'bitmovin-player-react-native';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';

export default (spec: TestScope) => {
  spec.describe('network preprocessing', () => {
    spec.it(
      'destroys a Player with an unresolved preprocessing callback',
      async () => {
        let invoked!: () => void;
        let deadline: ReturnType<typeof setTimeout> | undefined;
        const pendingRequest = new Promise<void>((resolve, reject) => {
          invoked = resolve;
          deadline = setTimeout(
            () => reject(new Error('Native request callback was not invoked')),
            10000
          );
        });
        void pendingRequest.catch(() => {});
        try {
          await startPlayerTest(
            {
              networkConfig: {
                preprocessHttpRequest: () => {
                  invoked();
                  return new Promise<HttpRequest>(() => {});
                },
              },
            },
            async () => {
              await callPlayer(async (player) => {
                await player.load(Sources.artOfMotionHls);
                await pendingRequest;
                await player.destroy();
                expect(
                  player.isDestroyed,
                  'Player destroyed while callback is pending'
                ).toBe(true);
              });
            }
          );
        } finally {
          clearTimeout(deadline);
        }
      }
    );
    spec.it(
      'invokes preprocessHttpRequest and preprocessHttpResponse and still loads the source',
      async () => {
        const requests: { type: HttpRequestType; request: HttpRequest }[] = [];
        const responses: { type: HttpRequestType; response: HttpResponse }[] =
          [];
        const networkConfig: NetworkConfig = {
          preprocessHttpRequest: async (_type, request) => request,
          preprocessHttpResponse: async (_type, response) => response,
        };

        await startPlayerTest(
          { networkConfig: { ...networkConfig } },
          async () => {
            networkConfig.preprocessHttpRequest = async function (
              type,
              request
            ) {
              expect(this === networkConfig, 'request callback receiver').toBe(
                true
              );
              requests.push({ type, request });
              return request;
            };
            networkConfig.preprocessHttpResponse = async function (
              type,
              response
            ) {
              expect(this === networkConfig, 'response callback receiver').toBe(
                true
              );
              responses.push({ type, response });
              return response;
            };
            // The manifest has to pass through both callbacks before the player can become ready.
            await callPlayerAndExpectEvent(async (player) => {
              player.config.networkConfig = networkConfig;
              await player.load(Sources.artOfMotionHls);
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
    for (const failure of ['throw', 'reject']) {
      spec.it(
        `loads using the original HTTP values when preprocessing callbacks ${failure}`,
        async () => {
          let requests = 0;
          let responses = 0;
          const fail = () => {
            if (failure === 'throw') throw new Error('preprocessing failed');
            return Promise.reject(new Error('preprocessing rejected'));
          };
          await startPlayerTest(
            {
              networkConfig: {
                preprocessHttpRequest: () => {
                  requests++;
                  return fail();
                },
                preprocessHttpResponse: () => {
                  responses++;
                  return fail();
                },
              },
            },
            async () => {
              await callPlayerAndExpectEvent(
                (player) => player.load(Sources.artOfMotionHls),
                EventType.Ready
              );
              expect(requests > 0, 'request fallback callback').toBe(true);
              expect(responses > 0, 'response fallback callback').toBe(true);
            }
          );
        }
      );
    }
  });
};
