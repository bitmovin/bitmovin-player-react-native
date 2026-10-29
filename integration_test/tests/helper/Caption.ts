import { SourceConfig } from 'bitmovin-player-react-native';
import {
  callPlayerAndExpectEvents,
  EventBag,
  EventType,
} from '../../playertesting';

export async function loadCaptionSource(
  sourceConfig: SourceConfig
): Promise<void> {
  // Ready can precede SourceLoaded on iOS, where subtitle tracks are initialized.
  await callPlayerAndExpectEvents(
    (player) => player.load(sourceConfig),
    EventBag(EventType.SourceLoaded, EventType.Ready)
  );
}
