import React, { PureComponent, PropsWithRef } from 'react';
import {
  Platform,
  ViewStyle,
  UIManager,
  findNodeHandle,
  StyleSheet,
} from 'react-native';
import { PlayerConfig, SourceConfig } from '../config';
import {
  NativePlayerView,
  NativePlayerModule,
  SyntheticEvent,
} from './NativePlayer';
import {
  PlayerEvent,
  PlayerErrorEvent,
  TimedEvent,
  TimeChangedEvent,
  SeekEvent,
  SourceEvent,
} from '../events';

export enum LoadingState {
  UNLOADED = 0,
  LOADING = 1,
  LOADED = 2,
}

export type Source = {
  duration: number;
  isActive: boolean;
  isAttachedToPlayer: boolean;
  metadata?: Record<string, any>;
  loadingState?: LoadingState;
};

export type EventProp<T> = (event: Omit<T, 'target'>) => void;

export type PlayerProps = PropsWithRef<{
  style?: ViewStyle;
  onEvent?: EventProp<PlayerEvent>;
  onPlayerError?: EventProp<PlayerErrorEvent>;
  onPlayerWarning?: EventProp<PlayerErrorEvent>;
  onDestroy?: EventProp<PlayerEvent>;
  onMuted?: EventProp<PlayerEvent>;
  onUnmuted?: EventProp<PlayerEvent>;
  onReady?: EventProp<PlayerEvent>;
  onPaused?: EventProp<TimedEvent>;
  onPlay?: EventProp<TimedEvent>;
  onPlaying?: EventProp<TimedEvent>;
  onPlaybackFinished?: EventProp<PlayerEvent>;
  onSeek?: EventProp<SeekEvent>;
  onSeeked?: EventProp<PlayerEvent>;
  onTimeChanged?: EventProp<TimeChangedEvent>;
  onSourceLoad?: EventProp<SourceEvent>;
  onSourceLoaded?: EventProp<SourceEvent>;
  onSourceUnloaded?: EventProp<SourceEvent>;
  onSourceError?: EventProp<PlayerErrorEvent>;
  onSourceWarning?: EventProp<PlayerErrorEvent>;
}>;

const styles = StyleSheet.create({
  baseStyle: {
    alignSelf: 'stretch',
  },
});

export class Player extends PureComponent<PlayerProps> {
  private viewRef: React.RefObject<any>;

  constructor(props: PlayerProps) {
    super(props);
    this.viewRef = React.createRef();
  }

  create = (config: PlayerConfig): void => this.dispatch('create', config);

  loadSource = (config: SourceConfig): void =>
    this.dispatch('loadSource', config);

  unload = (): void => this.dispatch('unload');

  play = (): void => this.dispatch('play');

  pause = (): void => this.dispatch('pause');

  seek = (time: number): void => this.dispatch('seek', time);

  mute = (): void => this.dispatch('mute');

  unmute = (): void => this.dispatch('unmute');

  destroy = (): void => this.dispatch('destroy');

  setVolume = (volume: number): void => this.dispatch('setVolume', volume);

  getVolume = (): Promise<number> =>
    NativePlayerModule.getVolume(this.nodeHandle());

  getSource = (): Promise<Source | null> =>
    NativePlayerModule.source(this.nodeHandle());

  getCurrentTime = (mode?: 'absolute' | 'relative'): Promise<number> =>
    NativePlayerModule.currentTime(this.nodeHandle(), mode);

  getDuration = (): Promise<number> =>
    NativePlayerModule.duration(this.nodeHandle());

  isDestroyed = (): Promise<boolean> =>
    NativePlayerModule.isDestroyed(this.nodeHandle());

  isMuted = (): Promise<boolean> =>
    NativePlayerModule.isMuted(this.nodeHandle());

  isPaused = (): Promise<boolean> =>
    NativePlayerModule.isPaused(this.nodeHandle());

  isPlaying = (): Promise<boolean> =>
    NativePlayerModule.isPlaying(this.nodeHandle());

  isLive = (): Promise<boolean> => NativePlayerModule.isLive(this.nodeHandle());

  isAirPlayActive = (): Promise<boolean> =>
    NativePlayerModule.isAirPlayActive(this.nodeHandle());

  isAirPlayAvailable = (): Promise<boolean> =>
    NativePlayerModule.isAirPlayAvailable(this.nodeHandle());

  _onEvent: SyntheticEvent<PlayerEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onEvent?.(nativeEvent);
    }
  };

  _onPlayerError: SyntheticEvent<PlayerErrorEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onPlayerError?.(nativeEvent);
    }
  };

  _onPlayerWarning: SyntheticEvent<PlayerErrorEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onPlayerWarning?.(nativeEvent);
    }
  };

  _onDestroy: SyntheticEvent<PlayerEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onDestroy?.(nativeEvent);
    }
  };

  _onMuted: SyntheticEvent<PlayerEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onMuted?.(nativeEvent);
    }
  };

  _onUnmuted: SyntheticEvent<PlayerEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onUnmuted?.(nativeEvent);
    }
  };

  _onReady: SyntheticEvent<PlayerEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onReady?.(nativeEvent);
    }
  };

  _onPaused: SyntheticEvent<TimedEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onPaused?.(nativeEvent);
    }
  };

  _onPlay: SyntheticEvent<TimedEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onPlay?.(nativeEvent);
    }
  };

  _onPlaying: SyntheticEvent<TimedEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onPlaying?.(nativeEvent);
    }
  };

  _onPlaybackFinished: SyntheticEvent<PlayerEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onPlaybackFinished?.(nativeEvent);
    }
  };

  _onSeek: SyntheticEvent<SeekEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onSeek?.(nativeEvent);
    }
  };

  _onSeeked: SyntheticEvent<PlayerEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onSeeked?.(nativeEvent);
    }
  };

  _onTimeChanged: SyntheticEvent<TimeChangedEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onTimeChanged?.(nativeEvent);
    }
  };

  _onSourceLoad: SyntheticEvent<SourceEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onSourceLoad?.(nativeEvent);
    }
  };

  _onSourceLoaded: SyntheticEvent<SourceEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onSourceLoaded?.(nativeEvent);
    }
  };

  _onSourceUnloaded: SyntheticEvent<SourceEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onSourceUnloaded?.(nativeEvent);
    }
  };

  _onSourceError: SyntheticEvent<PlayerErrorEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onSourceError?.(nativeEvent);
    }
  };

  _onSourceWarning: SyntheticEvent<PlayerErrorEvent> = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.target === this.nodeHandle()) {
      this.props.onSourceWarning?.(nativeEvent);
    }
  };

  render() {
    const nativeStyle = StyleSheet.flatten([
      styles.baseStyle,
      this.props.style,
    ]);
    return (
      <NativePlayerView
        ref={this.viewRef}
        style={nativeStyle}
        onEvent={this._onEvent}
        onPlayerError={this._onPlayerError}
        onPlayerWarning={this._onPlayerWarning}
        onDestroy={this._onDestroy}
        onMuted={this._onMuted}
        onUnmuted={this._onUnmuted}
        onReady={this._onReady}
        onPaused={this._onPaused}
        onPlay={this._onPlay}
        onPlaying={this._onPlaying}
        onPlaybackFinished={this._onPlaybackFinished}
        onSeek={this._onSeek}
        onSeeked={this._onSeeked}
        onTimeChanged={this._onTimeChanged}
        onSourceLoad={this._onSourceLoad}
        onSourceLoaded={this._onSourceLoaded}
        onSourceUnloaded={this._onSourceUnloaded}
        onSourceError={this._onSourceError}
        onSourceWarning={this._onSourceWarning}
      />
    );
  }

  private dispatch = (command: string, ...args: any[]): void =>
    UIManager.dispatchViewManagerCommand(
      this.nodeHandle(),
      this.getCommandId(command),
      Platform.select({
        ios: args ?? [],
        android: [this.nodeHandle(), ...args],
      })
    );

  private nodeHandle = (): number | null =>
    findNodeHandle(this.viewRef.current);

  private getCommandId = (command: string): number =>
    Platform.select({
      ios: UIManager.getViewManagerConfig('NativePlayerView').Commands[command],
      // @ts-ignore
      android: UIManager.NativePlayerView.Commands[command].toString(),
    });
}
