import React, { Component } from 'react';
import {
  UIManager,
  ViewStyle,
  findNodeHandle,
  requireNativeComponent,
} from 'react-native';

const NativePlayerViewModule = 'NativePlayerView';
const NativePlayerView = requireNativeComponent<{ style?: ViewStyle }>(
  NativePlayerViewModule
);

export type ConfigSourceType =
  | 'none'
  | 'hls'
  | 'dash'
  | 'progressive'
  | 'movpkg';

export interface Config {
  player: {
    licenseKey: string;
  };
  source: {
    url: string;
    type?: ConfigSourceType;
    poster?: string;
  };
}

export interface PlayerViewProps {
  style?: ViewStyle;
  config: Config;
}

export class PlayerView extends Component<PlayerViewProps> {
  props: PlayerViewProps;
  nativeRef: React.RefObject<any>;

  constructor(props: PlayerViewProps) {
    super(props);
    this.props = props;
    this.nativeRef = React.createRef();
  }

  loadConfig = (config: Config) =>
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.nativeRef.current),
      UIManager.getViewManagerConfig(NativePlayerViewModule).Commands
        .loadConfig,
      [config]
    );

  dispose = () =>
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.nativeRef.current),
      UIManager.getViewManagerConfig(NativePlayerViewModule).Commands.dispose,
      []
    );

  componentDidMount() {
    this.loadConfig(this.props.config);
  }

  componentWillUnmount() {
    this.dispose();
  }

  render() {
    return <NativePlayerView ref={this.nativeRef} style={this.props.style} />;
  }
}
