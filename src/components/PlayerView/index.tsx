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
  // Style resulting from merging `baseStyle` and `props.style`.
  const style = StyleSheet.flatten([styles.baseStyle, props.style]);
  useEffect(() => {
    // Attach `props.player` to native `PlayerView`.
    const node = findNodeHandle(nativeView.current);
    dispatch('attachPlayer', node, props.player.nativeId);
  }, [props.player.nativeId]);
  return (
    <NativePlayerView
      ref={nativeView}
      style={style}
      onEvent={useProxy(nativeView, props.onEvent)}
      onPlayerActive={useProxy(nativeView, props.onPlayerActive)}
      onPlayerError={useProxy(nativeView, props.onPlayerError)}
      onPlayerWarning={useProxy(nativeView, props.onPlayerWarning)}
      onDestroy={useProxy(nativeView, props.onDestroy)}
      onMuted={useProxy(nativeView, props.onMuted)}
      onUnmuted={useProxy(nativeView, props.onUnmuted)}
      onReady={useProxy(nativeView, props.onReady)}
      onPaused={useProxy(nativeView, props.onPaused)}
      onPlay={useProxy(nativeView, props.onPlay)}
      onPlaying={useProxy(nativeView, props.onPlaying)}
      onPlaybackFinished={useProxy(nativeView, props.onPlaybackFinished)}
      onSeek={useProxy(nativeView, props.onSeek)}
      onSeeked={useProxy(nativeView, props.onSeeked)}
      onTimeChanged={useProxy(nativeView, props.onTimeChanged)}
      onSourceLoad={useProxy(nativeView, props.onSourceLoad)}
      onSourceLoaded={useProxy(nativeView, props.onSourceLoaded)}
      onSourceUnloaded={useProxy(nativeView, props.onSourceUnloaded)}
      onSourceError={useProxy(nativeView, props.onSourceError)}
      onSourceWarning={useProxy(nativeView, props.onSourceWarning)}
    />
  );
}
