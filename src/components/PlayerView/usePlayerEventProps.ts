import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { Event, MetadataEvent } from '../../events';
import type { PlayerEventMap } from '../../eventMap';
import type { Player } from '../../player';
import { addPlatformToMetadataEvent } from '../../utils/metadataPlatform';
import { callListener } from '../../utils/eventListeners';
import type { PlayerViewEvents } from './events';

// TODO: Use the player event subscriptions on iOS too once its bridge supports them
// (iOS phase 2 in docs/events-plan.md, section 11).
export const usesPlayerEvents = Platform.OS === 'android';

const playerEventNames = Object.keys({
  playerActive: true,
  playerInactive: true,
  playerError: true,
  playerWarning: true,
  destroy: true,
  muted: true,
  unmuted: true,
  ready: true,
  paused: true,
  play: true,
  playing: true,
  playbackFinished: true,
  playbackSpeedChanged: true,
  seek: true,
  seeked: true,
  timeShift: true,
  timeShifted: true,
  stallStarted: true,
  stallEnded: true,
  timeChanged: true,
  sourceLoad: true,
  sourceLoaded: true,
  sourceUnloaded: true,
  sourceAdded: true,
  sourceRemoved: true,
  playlistTransition: true,
  sourceError: true,
  sourceWarning: true,
  audioAdded: true,
  audioChanged: true,
  audioRemoved: true,
  subtitleAdded: true,
  subtitleChanged: true,
  subtitleRemoved: true,
  downloadFinished: true,
  adBreakFinished: true,
  adBreakStarted: true,
  adClicked: true,
  adError: true,
  adFinished: true,
  adManifestLoad: true,
  adManifestLoaded: true,
  adQuartile: true,
  adScheduled: true,
  adSkipped: true,
  adStarted: true,
  nonLinearAdStarted: true,
  nonLinearAdSkipped: true,
  nonLinearAdFinished: true,
  videoDownloadQualityChanged: true,
  videoPlaybackQualityChanged: true,
  castAvailable: true,
  castPaused: true,
  castPlaybackFinished: true,
  castPlaying: true,
  castStarted: true,
  castStart: true,
  castStopped: true,
  castTimeUpdated: true,
  castWaitingForDevice: true,
  cueEnter: true,
  cueExit: true,
  metadata: true,
  metadataParsed: true,
} satisfies Record<keyof PlayerEventMap, true>) as (keyof PlayerEventMap)[];

const metadataEventNames = new Set<keyof PlayerEventMap>([
  'metadata',
  'metadataParsed',
]);

type PlayerEventPropName = `on${Capitalize<keyof PlayerEventMap>}`;

const toPropName = (eventName: keyof PlayerEventMap) =>
  `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}` as PlayerEventPropName;

/**
 * Delivers the player and source events of `player` to the matching `PlayerView` event props
 * (e.g. `playerActive` to `onPlayerActive`) and to `onEvent` via {@link Player.on}.
 *
 * Only events with a set prop are subscribed, or all of them if `onEvent` is set. Changing the
 * function identity of a prop does not resubscribe.
 * Does nothing unless {@link usesPlayerEvents} is set.
 */
export function usePlayerEventProps(player: Player, props: PlayerViewEvents) {
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  const subscribedEventNames = usesPlayerEvents
    ? playerEventNames
        .filter(
          (eventName) =>
            props.onEvent != null || props[toPropName(eventName)] != null
        )
        .join(',')
    : '';

  useEffect(() => {
    if (!subscribedEventNames) {
      return;
    }
    const subscriptions = (
      subscribedEventNames.split(',') as (keyof PlayerEventMap)[]
    ).map((eventName) => {
      const propName = toPropName(eventName);
      return player.on(eventName, (event: Event) => {
        const listener = propsRef.current[propName] as
          | ((event: Event) => void)
          | undefined;
        if (listener) {
          callListener(
            listener,
            metadataEventNames.has(eventName)
              ? addPlatformToMetadataEvent(event as MetadataEvent)
              : event
          );
        }
        propsRef.current.onEvent?.(event);
      });
    });
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [player, subscribedEventNames]);
}
