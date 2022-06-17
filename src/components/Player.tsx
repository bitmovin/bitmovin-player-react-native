import React, { PureComponent, PropsWithRef } from 'react';
import {
  Platform,
  ViewStyle,
  UIManager,
  findNodeHandle,
  StyleSheet,
} from 'react-native';
import { PlayerConfig, SourceConfig } from '../config';
import { NativePlayerView, NativePlayer, SyntheticEvent } from './NativePlayer';
import {
  PlayerEvent,
  PlayerErrorEvent,
  TimedEvent,
  TimeChangedEvent,
  SeekEvent,
  SourceEvent,
} from '../events';
import { pick } from '../utils';

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

export type EventProp<T> = (event: T) => void;

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

  getVolume = (): Promise<number> => NativePlayer.getVolume(this.nodeHandle());

  getSource = (): Promise<Source | null> =>
    NativePlayer.source(this.nodeHandle());

  getCurrentTime = (mode?: 'absolute' | 'relative'): Promise<number> =>
    NativePlayer.currentTime(this.nodeHandle(), mode);

  getDuration = (): Promise<number> => NativePlayer.duration(this.nodeHandle());

  isDestroyed = (): Promise<boolean> =>
    NativePlayer.isDestroyed(this.nodeHandle());

  isMuted = (): Promise<boolean> => NativePlayer.isMuted(this.nodeHandle());

  isPaused = (): Promise<boolean> => NativePlayer.isPaused(this.nodeHandle());

  isPlaying = (): Promise<boolean> => NativePlayer.isPlaying(this.nodeHandle());

  isLive = (): Promise<boolean> => NativePlayer.isLive(this.nodeHandle());

  isAirPlayActive = (): Promise<boolean> =>
    NativePlayer.isAirPlayActive(this.nodeHandle());

  isAirPlayAvailable = (): Promise<boolean> =>
    NativePlayer.isAirPlayAvailable(this.nodeHandle());

  _onEvent: SyntheticEvent<PlayerEvent> = (event) =>
    this.props.onEvent?.(
      pick<PlayerEvent>(['name', 'timestamp'], event.nativeEvent)
    );

  _onPlayerError: SyntheticEvent<PlayerErrorEvent> = (event) =>
    this.props.onPlayerError?.(
      pick<PlayerErrorEvent>(
        ['name', 'timestamp', 'code', 'message', 'data'],
        event.nativeEvent
      )
    );

  _onPlayerWarning: SyntheticEvent<PlayerErrorEvent> = (event) =>
    this.props.onPlayerWarning?.(
      pick<PlayerErrorEvent>(
        ['name', 'timestamp', 'code', 'message', 'data'],
        event.nativeEvent
      )
    );

  _onDestroy: SyntheticEvent<PlayerEvent> = (event) =>
    this.props.onDestroy?.(
      pick<PlayerEvent>(['name', 'timestamp'], event.nativeEvent)
    );

  _onMuted: SyntheticEvent<PlayerEvent> = (event) =>
    this.props.onMuted?.(
      pick<PlayerEvent>(['name', 'timestamp'], event.nativeEvent)
    );

  _onUnmuted: SyntheticEvent<PlayerEvent> = (event) =>
    this.props.onUnmuted?.(
      pick<PlayerEvent>(['name', 'timestamp'], event.nativeEvent)
    );

  _onReady: SyntheticEvent<PlayerEvent> = (event) =>
    this.props.onReady?.(
      pick<PlayerEvent>(['name', 'timestamp'], event.nativeEvent)
    );

  _onPaused: SyntheticEvent<TimedEvent> = (event) =>
    this.props.onPaused?.(
      pick<TimedEvent>(['name', 'time', 'timestamp'], event.nativeEvent)
    );

  _onPlay: SyntheticEvent<TimedEvent> = (event) =>
    this.props.onPlay?.(
      pick<TimedEvent>(['name', 'time', 'timestamp'], event.nativeEvent)
    );

  _onPlaying: SyntheticEvent<TimedEvent> = (event) =>
    this.props.onPlaying?.(
      pick<TimedEvent>(['name', 'time', 'timestamp'], event.nativeEvent)
    );

  _onPlaybackFinished: SyntheticEvent<PlayerEvent> = (event) =>
    this.props.onPlaybackFinished?.(
      pick<PlayerEvent>(['name', 'timestamp'], event.nativeEvent)
    );

  _onSeek: SyntheticEvent<SeekEvent> = (event) =>
    this.props.onSeek?.(
      pick<SeekEvent>(['name', 'timestamp'], event.nativeEvent)
    );

  _onSeeked: SyntheticEvent<PlayerEvent> = (event) =>
    this.props.onSeeked?.(
      pick<PlayerEvent>(['name', 'timestamp'], event.nativeEvent)
    );

  _onTimeChanged: SyntheticEvent<TimeChangedEvent> = (event) =>
    this.props.onTimeChanged?.(
      pick<TimeChangedEvent>(
        ['name', 'currentTime', 'timestamp'],
        event.nativeEvent
      )
    );

  _onSourceLoad: SyntheticEvent<SourceEvent> = (event) =>
    this.props.onSourceLoad?.(
      pick<SourceEvent>(['name', 'timestamp', 'source'], event.nativeEvent)
    );

  _onSourceLoaded: SyntheticEvent<SourceEvent> = (event) =>
    this.props.onSourceLoaded?.(
      pick<SourceEvent>(['name', 'timestamp', 'source'], event.nativeEvent)
    );

  _onSourceUnloaded: SyntheticEvent<SourceEvent> = (event) =>
    this.props.onSourceUnloaded?.(
      pick<SourceEvent>(['name', 'timestamp', 'source'], event.nativeEvent)
    );

  _onSourceError: SyntheticEvent<PlayerErrorEvent> = (event) =>
    this.props.onSourceError?.(
      pick<PlayerErrorEvent>(
        ['name', 'timestamp', 'code', 'message', 'data'],
        event.nativeEvent
      )
    );

  _onSourceWarning: SyntheticEvent<PlayerErrorEvent> = (event) =>
    this.props.onSourceWarning?.(
      pick<PlayerErrorEvent>(
        ['name', 'timestamp', 'code', 'message', 'data'],
        event.nativeEvent
      )
    );

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
    Platform.OS === 'android'
      ? UIManager.dispatchViewManagerCommand(
          this.nodeHandle(),
          this.getCommandId(command),
          [this.nodeHandle(), ...args]
        )
      : UIManager.dispatchViewManagerCommand(
          this.nodeHandle(),
          this.getCommandId(command),
          [...args]
        );

  private nodeHandle = (): number | null =>
    findNodeHandle(this.viewRef.current);

  private getCommandId = (command: string): number =>
    Platform.OS === 'android'
      ? (UIManager as any).NativePlayerView.Commands[command].toString()
      : UIManager.getViewManagerConfig('NativePlayerView').Commands[command];
}
