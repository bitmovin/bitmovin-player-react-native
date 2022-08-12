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
      onCueEnter={useProxy(nativeView, props.onCueEnter)}
      onCueExit={useProxy(nativeView, props.onCueExit)}
      onDestroy={useProxy(nativeView, props.onDestroy)}
      onEvent={useProxy(nativeView, props.onEvent)}
      onMuted={useProxy(nativeView, props.onMuted)}
      onPaused={useProxy(nativeView, props.onPaused)}
      onPlay={useProxy(nativeView, props.onPlay)}
      onPlaybackFinished={useProxy(nativeView, props.onPlaybackFinished)}
      onPlayerActive={useProxy(nativeView, props.onPlayerActive)}
      onPlayerError={useProxy(nativeView, props.onPlayerError)}
      onPlayerWarning={useProxy(nativeView, props.onPlayerWarning)}
      onPlaying={useProxy(nativeView, props.onPlaying)}
      onReady={useProxy(nativeView, props.onReady)}
      onSeek={useProxy(nativeView, props.onSeek)}
      onSeeked={useProxy(nativeView, props.onSeeked)}
      onSourceError={useProxy(nativeView, props.onSourceError)}
      onSourceLoad={useProxy(nativeView, props.onSourceLoad)}
      onSourceLoaded={useProxy(nativeView, props.onSourceLoaded)}
      onSourceUnloaded={useProxy(nativeView, props.onSourceUnloaded)}
      onSourceWarning={useProxy(nativeView, props.onSourceWarning)}
      onTimeChanged={useProxy(nativeView, props.onTimeChanged)}
      onUnmuted={useProxy(nativeView, props.onUnmuted)}
    />
  );
}
