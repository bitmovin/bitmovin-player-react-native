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

  currentTime = (mode?: 'absolute' | 'relative'): Promise<number> =>
    new Promise((resolve) =>
      PlayerModule.currentTime(this.nodeHandle(), mode, resolve)
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
