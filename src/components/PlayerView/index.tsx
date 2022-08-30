import React, { useRef, useEffect } from 'react';
import {
  Platform,
  UIManager,
  ViewStyle,
  StyleSheet,
  findNodeHandle,
} from 'react-native';
import { PlayerViewEvents } from './events';
import { NativePlayerView } from './native';
import { Player } from '../../player';
import { useProxy } from '../../hooks/useProxy';

/**
 * Base `PlayerView` component props. Used to stablish common
 * props between `NativePlayerView` and `PlayerView`.
 * @see NativePlayerView
 */
export interface BasePlayerViewProps {
  style?: ViewStyle;
}

/**
 * `PlayerView` component props.
 * @see PlayerView
 */
export interface PlayerViewProps extends BasePlayerViewProps, PlayerViewEvents {
  /**
   * `Player` instance (generally returned from `usePlayer` hook) that will control
   * and render audio/video inside the `PlayerView`.
   */
  player: Player;
}

/**
 * Base style that initializes the native view frame when no width/height prop has been set.
 */
const styles = StyleSheet.create({
  baseStyle: {
    alignSelf: 'stretch',
  },
});

/**
 * Dispatches any given `NativePlayerView` commands on React's `UIManager`.
 */
function dispatch(command: string, node: number | null, playerId: string) {
  const commandId =
    Platform.OS === 'android'
      ? (UIManager as any).NativePlayerView.Commands[command].toString()
      : UIManager.getViewManagerConfig('NativePlayerView').Commands[command];
  UIManager.dispatchViewManagerCommand(
    node,
    commandId,
    Platform.select({
      ios: [playerId],
      android: [node, playerId],
    })
  );
}

/**
 * Component that provides the Bitmovin Player UI and default UI handling to an attached `Player` instance.
 * This component needs a `Player` instance to work properly so make sure one is passed to it as a prop.
 */
export function PlayerView(props: PlayerViewProps) {
  // Native view reference.
  const nativeView = useRef(null);
  // Native events proxy helper.
  const proxy = useProxy(nativeView);
  // Style resulting from merging `baseStyle` and `props.style`.
  const style = StyleSheet.flatten([styles.baseStyle, props.style]);
  useEffect(() => {
    // Initialize native player instance if needed.
    props.player.initialize();
    // Attach native player to native `PlayerView`.
    const node = findNodeHandle(nativeView.current);
    dispatch('attachPlayer', node, props.player.nativeId);
  }, [props.player]);
  return (
    <NativePlayerView
      ref={nativeView}
      style={style}
      onDestroy={proxy(props.onDestroy)}
      onEvent={proxy(props.onEvent)}
      onMuted={proxy(props.onMuted)}
      onPaused={proxy(props.onPaused)}
      onPlay={proxy(props.onPlay)}
      onPlaybackFinished={proxy(props.onPlaybackFinished)}
      onPlayerActive={proxy(props.onPlayerActive)}
      onPlayerError={proxy(props.onPlayerError)}
      onPlayerWarning={proxy(props.onPlayerWarning)}
      onPlaying={proxy(props.onPlaying)}
      onReady={proxy(props.onReady)}
      onReceivedSynchronousMessage={proxy(props.onReceivedSynchronousMessage)}
      onReceivedAsynchronousMessage={proxy(props.onReceivedAsynchronousMessage)}
      onSeek={proxy(props.onSeek)}
      onSeeked={proxy(props.onSeeked)}
      onSourceError={proxy(props.onSourceError)}
      onSourceLoad={proxy(props.onSourceLoad)}
      onSourceLoaded={proxy(props.onSourceLoaded)}
      onSourceUnloaded={proxy(props.onSourceUnloaded)}
      onSourceWarning={proxy(props.onSourceWarning)}
      onSubtitleAdded={proxy(props.onSubtitleAdded)}
      onSubtitleChanged={proxy(props.onSubtitleChanged)}
      onSubtitleRemoved={proxy(props.onSubtitleRemoved)}
      onTimeChanged={proxy(props.onTimeChanged)}
      onUnmuted={proxy(props.onUnmuted)}
    />
  );
}
