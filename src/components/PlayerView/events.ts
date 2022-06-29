import { NativeSyntheticEvent } from 'react-native';
import {
  Event,
  PlayerActiveEvent,
  PlayerErrorEvent,
  PlayerWarningEvent,
  DestroyEvent,
  MutedEvent,
  UnmutedEvent,
  ReadyEvent,
  PausedEvent,
  PlayEvent,
  PlayingEvent,
  PlaybackFinishedEvent,
  SeekEvent,
  SeekedEvent,
  TimeChangedEvent,
  SourceLoadEvent,
  SourceLoadedEvent,
  SourceUnloadedEvent,
  SourceErrorEvent,
  SourceWarningEvent,
} from '../../events';

/**
 * Type that defines all event props supported by `PlayerView` and `NativePlayerView`.
 * Used to generate the specific events interface for each component.
 */
interface EventProps {
  onEvent: Event;
  onPlayerActive: PlayerActiveEvent;
  onPlayerError: PlayerErrorEvent;
  onPlayerWarning: PlayerWarningEvent;
  onDestroy: DestroyEvent;
  onMuted: MutedEvent;
  onUnmuted: UnmutedEvent;
  onReady: ReadyEvent;
  onPaused: PausedEvent;
  onPlay: PlayEvent;
  onPlaying: PlayingEvent;
  onPlaybackFinished: PlaybackFinishedEvent;
  onSeek: SeekEvent;
  onSeeked: SeekedEvent;
  onTimeChanged: TimeChangedEvent;
  onSourceLoad: SourceLoadEvent;
  onSourceLoaded: SourceLoadedEvent;
  onSourceUnloaded: SourceUnloadedEvent;
  onSourceError: SourceErrorEvent;
  onSourceWarning: SourceWarningEvent;
}

/**
 * Event props for `PlayerView`.
 *
 * Note the events of `PlayerView` are simply a proxy over
 * the events from `NativePlayerView` just removing RN's bubbling data.
 */
export type PlayerViewEvents = {
  [Prop in keyof EventProps]?: (event: EventProps[Prop]) => void;
};

/**
 * Event props for `NativePlayerView`.
 */
export type NativePlayerViewEvents = {
  [Prop in keyof EventProps]?: (
    nativeEvent: NativeSyntheticEvent<EventProps[Prop]>
  ) => void;
};
