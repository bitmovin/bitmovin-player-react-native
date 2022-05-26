import React, { Component, PropsWithRef } from 'react';
import {
  UIManager,
  ViewStyle,
  findNodeHandle,
  requireNativeComponent,
} from 'react-native';
import { PlayerConfig, SourceConfig } from '../config';

const NativePlayerViewModule = 'NativePlayerView';
const NativePlayerView = requireNativeComponent<{ style?: ViewStyle }>(
  NativePlayerViewModule
);

type PlayerProps = PropsWithRef<{
  style?: ViewStyle;
}>;

export class Player extends Component<PlayerProps> {
  private viewRef: React.RefObject<any>;

  constructor(props: PlayerProps) {
    super(props);
    this.viewRef = React.createRef();
  }

  setup = (config: PlayerConfig) => this.dispatch('setup', config);

  loadSource = (config: SourceConfig) => this.dispatch('loadSource', config);

  destroy = () => this.dispatch('destroy');

  render() {
    const { style } = this.props;
    return <NativePlayerView style={style} ref={this.viewRef} />;
  }

  // View manager utilities
  private dispatch = (command: string, ...args: any[]) =>
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.viewRef.current),
      this.getCommandId(command),
      args ?? []
    );

  private getCommandId = (name: string): number =>
    UIManager.getViewManagerConfig(NativePlayerViewModule).Commands[name];
}
