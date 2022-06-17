import {
  ViewStyle,
  NativeModules,
  requireNativeComponent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  PlayerEvent,
  PlayerErrorEvent,
  TimedEvent,
  SeekEvent,
  TimeChangedEvent,
  SourceEvent,
} from '../events';

export type SyntheticEvent<T> = (event: NativeSyntheticEvent<T>) => void;

type Props = {
  style?: ViewStyle;
  onEvent: SyntheticEvent<PlayerEvent>;
  onPlayerError: SyntheticEvent<PlayerErrorEvent>;
  onPlayerWarning: SyntheticEvent<PlayerErrorEvent>;
  onDestroy: SyntheticEvent<PlayerEvent>;
  onMuted: SyntheticEvent<PlayerEvent>;
  onUnmuted: SyntheticEvent<PlayerEvent>;
  onReady: SyntheticEvent<PlayerEvent>;
  onPaused: SyntheticEvent<TimedEvent>;
  onPlay: SyntheticEvent<TimedEvent>;
  onPlaying: SyntheticEvent<TimedEvent>;
  onPlaybackFinished: SyntheticEvent<PlayerEvent>;
  onSeek: SyntheticEvent<SeekEvent>;
  onSeeked: SyntheticEvent<PlayerEvent>;
  onTimeChanged: SyntheticEvent<TimeChangedEvent>;
  onSourceLoad: SyntheticEvent<SourceEvent>;
  onSourceLoaded: SyntheticEvent<SourceEvent>;
  onSourceUnloaded: SyntheticEvent<SourceEvent>;
  onSourceError: SyntheticEvent<PlayerErrorEvent>;
  onSourceWarning: SyntheticEvent<PlayerErrorEvent>;
};

export const NativePlayerView =
  requireNativeComponent<Props>('NativePlayerView');

export const NativePlayer = NativeModules.NativePlayerView;
