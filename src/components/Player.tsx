import React, { Component, PropsWithRef } from 'react';
import {
  ViewStyle,
  UIManager,
  NativeModules,
  findNodeHandle,
  requireNativeComponent,
} from 'react-native';
import { PlayerConfig, SourceConfig } from '../config';

const NativePlayerView = requireNativeComponent<{ style?: ViewStyle }>(
  'NativePlayerView'
);

const PlayerModule = NativeModules.NativePlayerView;

type PlayerProps = PropsWithRef<{
  style?: ViewStyle;
  config?: PlayerConfig;
}>;

export class Player extends Component<PlayerProps> {
  private viewRef: React.RefObject<any>;

  constructor(props: PlayerProps) {
    super(props);
    this.viewRef = React.createRef();
  }

  render() {
    const { style } = this.props;
    return <NativePlayerView style={style} ref={this.viewRef} />;
  }

  componentDidMount() {
    const { config } = this.props;
    if (config) {
      this.create(config);
    }
  }

  componentWillUnmount() {
    // When setting the `config` prop, the user opts-in for default
    // handling of native player's creation/destruction during the
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
      PlayerModule.getVolume(this.nodeHandle(), resolve)
    );

  getCurrentTime = (mode?: 'absolute' | 'relative'): Promise<number> =>
    new Promise((resolve) =>
      PlayerModule.currentTime(this.nodeHandle(), mode, resolve)
    );

  getDuration = (): Promise<number> =>
    new Promise((resolve) => PlayerModule.duration(this.nodeHandle(), resolve));

  isDestroyed = (): Promise<boolean> =>
    new Promise((resolve) =>
      PlayerModule.isDestroyed(this.nodeHandle(), resolve)
    );

  isMuted = (): Promise<boolean> =>
    new Promise((resolve) => PlayerModule.isMuted(this.nodeHandle(), resolve));

  isPaused = (): Promise<boolean> =>
    new Promise((resolve) => PlayerModule.isPaused(this.nodeHandle(), resolve));

  isPlaying = (): Promise<boolean> =>
    new Promise((resolve) =>
      PlayerModule.isPlaying(this.nodeHandle(), resolve)
    );

  isLive = (): Promise<boolean> =>
    new Promise((resolve) => PlayerModule.isLive(this.nodeHandle(), resolve));

  isAirPlayActive = (): Promise<boolean> =>
    new Promise((resolve) => PlayerModule.isLive(this.nodeHandle(), resolve));

  isAirPlayAvailable = (): Promise<boolean> =>
    new Promise((resolve) => PlayerModule.isLive(this.nodeHandle(), resolve));

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
