import { NativeSyntheticEvent } from 'react-native';
import {
  DestroyEvent,
  Event,
  MutedEvent,
  PausedEvent,
  PlayEvent,
  PlaybackFinishedEvent,
  PlayerActiveEvent,
  PlayerErrorEvent,
  PlayerWarningEvent,
  PlayingEvent,
  ReadyEvent,
  ReceivedSynchronousMessage,
  ReceivedAsynchronousMessage,
  SeekEvent,
  SeekedEvent,
  SourceErrorEvent,
  SourceLoadEvent,
  SourceLoadedEvent,
  SourceUnloadedEvent,
  SourceWarningEvent,
  SubtitleAddedEvent,
  SubtitleChangedEvent,
  SubtitleRemovedEvent,
  TimeChangedEvent,
  UnmutedEvent,
} from '../../events';

/**
 * Type that defines all event props supported by `PlayerView` and `NativePlayerView`.
 * Used to generate the specific events interface for each component.
 */
interface EventProps {
  onDestroy: DestroyEvent;
  onEvent: Event;
  onMuted: MutedEvent;
  onPaused: PausedEvent;
  onPlay: PlayEvent;
  onPlaybackFinished: PlaybackFinishedEvent;
  onPlayerActive: PlayerActiveEvent;
  onPlayerError: PlayerErrorEvent;
  onPlayerWarning: PlayerWarningEvent;
  onPlaying: PlayingEvent;
  onReady: ReadyEvent;
  onReceivedSynchronousMessage: ReceivedSynchronousMessage;
  onReceivedAsynchronousMessage: ReceivedAsynchronousMessage;
  onSeek: SeekEvent;
  onSeeked: SeekedEvent;
  onSourceError: SourceErrorEvent;
  onSourceLoad: SourceLoadEvent;
  onSourceLoaded: SourceLoadedEvent;
  onSourceUnloaded: SourceUnloadedEvent;
  onSourceWarning: SourceWarningEvent;
  onSubtitleAdded: SubtitleAddedEvent;
  onSubtitleChanged: SubtitleChangedEvent;
  onSubtitleRemoved: SubtitleRemovedEvent;
  onTimeChanged: TimeChangedEvent;
  onUnmuted: UnmutedEvent;
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
