import React, { PureComponent, PropsWithRef } from 'react';
import { ViewStyle, UIManager, findNodeHandle, StyleSheet } from 'react-native';
import { PlayerConfig, SourceConfig } from '../config';
import { NativePlayerView, NativePlayerModule } from './NativePlayer';

type PlayerProps = PropsWithRef<{
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
    new Promise((resolve) =>
      NativePlayerModule.getVolume(this.nodeHandle(), resolve)
    );

  getSource = (): Promise<any> =>
    new Promise((resolve) =>
      NativePlayerModule.source(this.nodeHandle(), resolve)
    );

  getCurrentTime = (mode?: 'absolute' | 'relative'): Promise<number> =>
    new Promise((resolve) =>
      NativePlayerModule.currentTime(this.nodeHandle(), mode, resolve)
    );

  getDuration = (): Promise<number> =>
    new Promise((resolve) =>
      NativePlayerModule.duration(this.nodeHandle(), resolve)
    );

  isDestroyed = (): Promise<boolean> =>
    new Promise((resolve) =>
      NativePlayerModule.isDestroyed(this.nodeHandle(), resolve)
    );

  isMuted = (): Promise<boolean> =>
    new Promise((resolve) =>
      NativePlayerModule.isMuted(this.nodeHandle(), resolve)
    );

  isPaused = (): Promise<boolean> =>
    new Promise((resolve) =>
      NativePlayerModule.isPaused(this.nodeHandle(), resolve)
    );

  isPlaying = (): Promise<boolean> =>
    new Promise((resolve) =>
      NativePlayerModule.isPlaying(this.nodeHandle(), resolve)
    );

  isLive = (): Promise<boolean> =>
    new Promise((resolve) =>
      NativePlayerModule.isLive(this.nodeHandle(), resolve)
    );

  isAirPlayActive = (): Promise<boolean> =>
    new Promise((resolve) =>
      NativePlayerModule.isAirPlayActive(this.nodeHandle(), resolve)
    );

  isAirPlayAvailable = (): Promise<boolean> =>
    new Promise((resolve) =>
      NativePlayerModule.isAirPlayAvailable(this.nodeHandle(), resolve)
    );

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
