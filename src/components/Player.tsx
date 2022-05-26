import React, { Component, PropsWithRef } from 'react';
import {
  ViewStyle,
  UIManager,
  findNodeHandle,
  requireNativeComponent,
} from 'react-native';
import { PlayerConfig, SourceConfig } from '../config';

const NativePlayerView = requireNativeComponent<{ style?: ViewStyle }>(
  'NativePlayerView'
);

// const PlayerModule = NativeModules.NativePlayerView;

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

  setup = (config: PlayerConfig) => this.dispatch('setup', config);

  loadSource = (config: SourceConfig) => this.dispatch('loadSource', config);

  unload = () => this.dispatch('unload');

  play = () => this.dispatch('play');

  pause = () => this.dispatch('pause');

  seek = (time: number) => this.dispatch('seek', time);

  mute = () => this.dispatch('mute');

  unmute = () => this.dispatch('unmute');

  destroy = () => this.dispatch('destroy');

  private dispatch = (command: string, ...args: any[]) =>
    UIManager.dispatchViewManagerCommand(
      this.nodeHandle(),
      this.getCommandId(command),
      args ?? []
    );

  private nodeHandle = (): number | null =>
    findNodeHandle(this.viewRef.current);

  private getCommandId = (name: string): number =>
    UIManager.getViewManagerConfig('NativePlayerView').Commands[name];
}
