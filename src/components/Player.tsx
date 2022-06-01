import React, { PureComponent, PropsWithRef } from 'react';
import { ViewStyle, UIManager, findNodeHandle, StyleSheet } from 'react-native';
import { PlayerConfig, SourceConfig } from '../config';
import { NativePlayerView, NativePlayerModule } from './NativePlayer';

export enum LoadingState {
  UNLOADED = 0,
  LOADING = 1,
  LOADED = 2,
}

export type Source = {
  duration: number;
  isActive: boolean;
  isAttachedToPlayer: boolean;
  loadingState: LoadingState;
};

export type PlayerProps = PropsWithRef<{
  config?: PlayerConfig;
  style?: ViewStyle;
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

  render() {
    const nativeStyle = StyleSheet.flatten([
      styles.baseStyle,
      this.props.style,
    ]);
    return <NativePlayerView ref={this.viewRef} style={nativeStyle} />;
  }

  componentDidMount() {
    const { config } = this.props;
    if (config) {
      this.create(config);
    }
  }

  componentWillUnmount() {
    // When setting the `config` prop, the user enables the default
    // handling of the native player's creation/destruction process inside the
    // component's lifecycle (`componentDidMount`/`componentWillUnmount`).
    //
    // If the `config` prop is not provided, then manual handling
    // of the creation/destruction process is required from the user.
    if (this.props.config) {
      this.destroy();
    }
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

  private dispatch = (command: string, ...args: any[]): void =>
    UIManager.dispatchViewManagerCommand(
      this.nodeHandle(),
      this.getCommandId(command),
      args ?? []
    );

  private nodeHandle = (): number | null =>
    findNodeHandle(this.viewRef.current);

  private getCommandId = (command: string): number =>
    UIManager.getViewManagerConfig('NativePlayerView').Commands[command];
}
