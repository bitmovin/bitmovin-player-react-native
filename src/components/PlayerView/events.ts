import { NativeSyntheticEvent } from 'react-native';
import {
  Event,
  ErrorEvent,
  TimedEvent,
  SeekEvent,
  SourceEvent,
  TimeChangedEvent,
} from '../../events';

interface EventProps {
  onEvent: Event;
  onPlayerActive: Event;
  onPlayerError: ErrorEvent;
  onPlayerWarning: ErrorEvent;
  onDestroy: Event;
  onMuted: Event;
  onUnmuted: Event;
  onReady: Event;
  onPaused: TimedEvent;
  onPlay: TimedEvent;
  onPlaying: TimedEvent;
  onPlaybackFinished: Event;
  onSeek: SeekEvent;
  onSeeked: Event;
  onTimeChanged: TimeChangedEvent;
  onSourceLoad: SourceEvent;
  onSourceLoaded: SourceEvent;
  onSourceUnloaded: SourceEvent;
  onSourceError: ErrorEvent;
  onSourceWarning: ErrorEvent;
}

export type PlayerViewEvents = {
  [Prop in keyof EventProps]?: (evt: EventProps[Prop]) => void;
};

export type NativePlayerViewEvents = {
  [Prop in keyof EventProps]?: (
    nativeEvt: NativeSyntheticEvent<EventProps[Prop]>
  ) => void;
};
