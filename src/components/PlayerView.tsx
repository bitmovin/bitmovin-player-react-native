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

  setup = (config: PlayerConfig) =>
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.viewRef.current),
      UIManager.getViewManagerConfig(NativePlayerViewModule).Commands.setup,
      [config]
    );

  loadSource = (config: SourceConfig) =>
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.viewRef.current),
      UIManager.getViewManagerConfig(NativePlayerViewModule).Commands
        .loadSource,
      [config]
    );

  destroy = () =>
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.viewRef.current),
      UIManager.getViewManagerConfig(NativePlayerViewModule).Commands.destroy,
      []
    );

  render() {
    const { style } = this.props;
    return <NativePlayerView style={style} ref={this.viewRef} />;
  }
}
