import { TestScope } from 'cavy';
import {
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
  SourceConfig,
} from 'bitmovin-player-react-native';
import { HttpRequestType } from 'src/network/networkConfig';

export default (spec: TestScope) => {
  function loadingSourceTests(sourceConfig: SourceConfig, label: string) {
    spec.describe(`loading a ${label} source`, () => {
      spec.it('emits ReadyEvent event', async () => {
        await startPlayerTest({}, async () => {
          await callPlayerAndExpectEvent((player) => {
            player.load(sourceConfig);
          }, EventType.Ready);
        });
      });
      spec.it('emits SourceLoad and SourceLoaded events', async () => {
        await startPlayerTest({}, async () => {
          await callPlayerAndExpectEvents((player) => {
            player.load(sourceConfig);
          }, EventSequence(EventType.SourceLoad, EventType.SourceLoaded));
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
    });
  }

  loadingSourceTests(Sources.artOfMotionHls, 'VOD');
  loadingSourceTests(Sources.akamaiTestLiveHls, 'live');
};
