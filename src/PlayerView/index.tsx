import React, { Component } from 'react';
import {
  UIManager,
  ViewStyle,
  findNodeHandle,
  requireNativeComponent,
} from 'react-native';

export interface PlayerConfig {
  key: string;
}

export interface PlayerViewProps {
  style?: ViewStyle;
  config: PlayerConfig;
}

const PlayerViewNativeComponentName = 'PlayerViewNativeComponent';
const PlayerViewNativeComponent = requireNativeComponent<{ style?: ViewStyle }>(
  PlayerViewNativeComponentName
);

export class PlayerView extends Component<PlayerViewProps> {
  props: PlayerViewProps;
  nativeRef: React.RefObject<any>;

  constructor(props: PlayerViewProps) {
    super(props);
    this.props = props;
    this.nativeRef = React.createRef();
  }

  componentDidMount() {
    this.createPlayer(this.props.config);
  }

  componentWillUnmount() {
    this.destroyPlayer();
  }

  render() {
    return (
      <PlayerViewNativeComponent
        ref={this.nativeRef}
        style={this.props.style}
      />
    );
  }

  // Native view commands.
  createPlayer = (config: PlayerConfig) =>
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.nativeRef.current),
      UIManager.getViewManagerConfig(PlayerViewNativeComponentName).Commands
        .createPlayer,
      [config]
    );

  destroyPlayer = () =>
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this.nativeRef.current),
      UIManager.getViewManagerConfig(PlayerViewNativeComponentName).Commands
        .destroyPlayer,
      []
    );
}
