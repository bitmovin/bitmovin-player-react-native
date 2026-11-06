import { useEffect, useRef } from 'react';
import type { Event, MetadataEvent } from '../../events';
import type { PlayerEventMap } from '../../eventMap';
import type { Player } from '../../player';
import { addPlatformToMetadataEvent } from '../../utils/metadataPlatform';
import { callListener } from '../../utils/eventListeners';
import type { PlayerViewEvents } from './events';

// Listed as an object so that `satisfies` makes the compiler require every event of `PlayerEventMap`;
// the values are unused.
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
  fairplayLicenseAcquired: true,
} satisfies Record<keyof PlayerEventMap, true>) as (keyof PlayerEventMap)[];

const metadataEventNames = new Set<keyof PlayerEventMap>([
  'metadata',
  'metadataParsed',
]);

type PlayerEventPropName = `on${Capitalize<keyof PlayerEventMap>}`;

/**
 * The listeners attached to `player` for the event props, by event name.
 */
type Subscription = {
  player: Player;
  listeners: Map<keyof PlayerEventMap, (event: Event) => void>;
};

const detachAll = ({ player, listeners }: Subscription) => {
  listeners.forEach((listener, eventName) => player.off(eventName, listener));
  listeners.clear();
};

const toPropName = (eventName: keyof PlayerEventMap) =>
  `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}` as PlayerEventPropName;

/**
 * Delivers the player and source events of `player` to the matching `PlayerView` event props
 * (e.g. `playerActive` to `onPlayerActive`) and to `onEvent` via {@link Player.on}.
 *
 * Only events with a set prop are subscribed, or all of them if `onEvent` is set. Changing the
 * function identity of a prop does not resubscribe, and setting or unsetting a prop only (un)subscribes
 * the affected events.
 */
export function usePlayerEventProps(player: Player, props: PlayerViewEvents) {
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  const subscribedEventNames = playerEventNames
    .filter(
      (eventName) =>
        props.onEvent != null || props[toPropName(eventName)] != null
    )
    .join(',');

  const subscriptionRef = useRef<Subscription | undefined>(undefined);
  useEffect(() => {
    let subscription = subscriptionRef.current;
    if (subscription?.player !== player) {
      // A new player: detach the listeners from the previous one before attaching them anew.
      if (subscription) {
        detachAll(subscription);
      }
      subscription = { player, listeners: new Map() };
      subscriptionRef.current = subscription;
    }
    const { listeners } = subscription;
    const eventNames = new Set(
      subscribedEventNames
        ? (subscribedEventNames.split(',') as (keyof PlayerEventMap)[])
        : []
    );
    listeners.forEach((listener, eventName) => {
      if (!eventNames.has(eventName)) {
        player.off(eventName, listener);
        listeners.delete(eventName);
      }
    });
    eventNames.forEach((eventName) => {
      if (listeners.has(eventName)) {
        return;
      }
      const propName = toPropName(eventName);
      const listener = (event: Event) => {
        const propListener = propsRef.current[propName] as
          | ((event: Event) => void)
          | undefined;
        if (propListener) {
          callListener(
            propListener,
            metadataEventNames.has(eventName)
              ? addPlatformToMetadataEvent(event as MetadataEvent)
              : event
          );
        }
        propsRef.current.onEvent?.(event);
      };
      player.on(eventName, listener);
      listeners.set(eventName, listener);
    });
  }, [player, subscribedEventNames]);

  // Detach everything when the view unmounts.
  useEffect(
    () => () => {
      if (subscriptionRef.current) {
        detachAll(subscriptionRef.current);
        subscriptionRef.current = undefined;
      }
    },
    []
  );
}
