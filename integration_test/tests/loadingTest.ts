import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventBag,
  EventSequence,
  EventType,
  FilteredEvent,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import {
  DownloadFinishedEvent,
  HttpRequestType,
  SourceConfig,
} from 'bitmovin-player-react-native';
import { expect } from './helper/Expect';

export default (spec: TestScope) => {
  function loadingSourceTests(sourceConfig: SourceConfig, label: string) {
    spec.describe(`loading a ${label} source`, () => {
      spec.it('emits ReadyEvent event', async () => {
        await startPlayerTest({}, async () => {
          await callPlayerAndExpectEvent((player) => {
            player.load(sourceConfig);
          }, EventType.Ready);
          await callPlayer(async (player) => {
            const duration = await player.getDuration();
            expect(duration, 'Player duration after loading').toNotBe(0);
            expect(
              duration,
              'Player duration should be a number'
            ).toBeGreaterThan(0);
            expect(typeof duration, 'Duration type').toBe('number');
          });
        });
      });
      spec.it('emits SourceLoad and SourceLoaded events', async () => {
        await startPlayerTest({}, async () => {
          await callPlayerAndExpectEvents(
            (player) => {
              player.load(sourceConfig);
            },
            EventSequence(EventType.SourceLoad, EventType.SourceLoaded)
          );
        });
      });
      spec.it('emits DownloadFinished events', async () => {
        await startPlayerTest({}, async () => {
          await callPlayerAndExpectEvents(
            (player) => {
              player.load(sourceConfig);
            },
            EventBag(
              FilteredEvent<DownloadFinishedEvent>(
                EventType.DownloadFinished,
                (event) =>
                  event.requestType === HttpRequestType.ManifestHlsMaster
              ),
              FilteredEvent<DownloadFinishedEvent>(
                EventType.DownloadFinished,
                (event) =>
                  event.requestType === HttpRequestType.ManifestHlsVariant
              )
            )
          );
        });
      });

      spec.it('validates DownloadFinished event properties', async () => {
        await startPlayerTest({}, async () => {
          const downloadEvent: DownloadFinishedEvent =
            await callPlayerAndExpectEvent((player) => {
              player.load(sourceConfig);
            }, EventType.DownloadFinished);

          expect(
            downloadEvent.requestType,
            'DownloadFinished event should have requestType'
          ).toBeDefined();
          expect(
            downloadEvent.url,
            'DownloadFinished event should have url'
          ).toBeDefined();
          if (downloadEvent.lastRedirectLocation !== undefined) {
            expect(
              typeof downloadEvent.lastRedirectLocation,
              'lastRedirectLocation should be string'
            ).toBe('string');
          }
          expect(
            downloadEvent.httpStatus,
            'DownloadFinished event should have httpStatus'
          ).toBeGreaterThan(0);
          expect(
            downloadEvent.isSuccess,
            'DownloadFinished event should have isSuccess'
          ).toBeDefined();
          expect(
            typeof downloadEvent.isSuccess,
            'isSuccess should be boolean'
          ).toBe('boolean');
          expect(
            downloadEvent.downloadTime,
            'DownloadFinished event should have downloadTime'
          ).toBeGreaterThanOrEqual(0);

          if (downloadEvent.isSuccess) {
            expect(
              downloadEvent.httpStatus,
              'Successful download should have 2xx status'
            ).toBeGreaterThanOrEqual(200);
            expect(
              downloadEvent.httpStatus,
              'Successful download should have 2xx status'
            ).toBeSmallerThan(300);
          }
        });
      });
    });
  }

  loadingSourceTests(Sources.artOfMotionHls, 'VOD');
  loadingSourceTests(Sources.iReplayTestLiveHls, 'live');
};
