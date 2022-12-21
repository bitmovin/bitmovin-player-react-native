import React, { useRef, useEffect } from 'react';
import {
  Platform,
  UIManager,
  ViewStyle,
  StyleSheet,
  findNodeHandle,
  NodeHandle,
} from 'react-native';
import { PlayerViewEvents } from './events';
import { NativePlayerView } from './native';
import { Player } from '../../player';
import { useProxy } from '../../hooks/useProxy';
import { FullscreenHandler } from '../../ui/fullscreenhandler';
import { FullscreenHandlerBridge } from '../../ui/fullscreenhandlerbridge';

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

  fullscreenHandler?: FullscreenHandler;
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
function dispatch(command: string, node: NodeHandle, ...args: any[]) {
  const commandId =
    Platform.OS === 'android'
      ? (UIManager as any).NativePlayerView.Commands[command].toString()
      : UIManager.getViewManagerConfig('NativePlayerView').Commands[command];
  UIManager.dispatchViewManagerCommand(
    node,
    commandId,
    Platform.select({ ios: args, android: [node, ...args] })
  );
}

/**
 * Component that provides the Bitmovin Player UI and default UI handling to an attached `Player` instance.
 * This component needs a `Player` instance to work properly so make sure one is passed to it as a prop.
 */
export function PlayerView({
  style,
  player,
  fullscreenHandler,
  ...props
}: PlayerViewProps) {
  // Native view reference.
  const nativeView = useRef(null);
  // Native events proxy helper.
  const proxy = useProxy(nativeView);
  // Style resulting from merging `baseStyle` and `props.style`.
  const nativeViewStyle = StyleSheet.flatten([styles.baseStyle, style]);

  const fullscreenBridge: React.MutableRefObject<
    FullscreenHandlerBridge | undefined
  > = useRef(undefined);
  if (fullscreenHandler && !fullscreenBridge.current) {
    fullscreenBridge.current = new FullscreenHandlerBridge();
  }
  if (fullscreenBridge.current) {
    fullscreenBridge.current.fullscreenHandler = fullscreenHandler;
  }

  useEffect(() => {
    // Initialize native player instance if needed.
    player.initialize();
    // Attach native player to native `PlayerView`.
    const node = findNodeHandle(nativeView.current);
    if (node) {
      dispatch('attachPlayer', node, player.nativeId, player.config);
      if (fullscreenBridge.current) {
        dispatch(
          'attachFullscreenBridge',
          node,
          fullscreenBridge.current.nativeId
        );
      }
    }
    return () => {
      fullscreenBridge.current?.destroy();
      fullscreenBridge.current = undefined;
    };
  }, [player]);
  return (
    <NativePlayerView
      ref={nativeView}
      style={nativeViewStyle}
      fullscreenBridge={fullscreenBridge.current}
      onAdBreakFinished={proxy(props.onAdBreakFinished)}
      onAdBreakStarted={proxy(props.onAdBreakStarted)}
      onAdClicked={proxy(props.onAdClicked)}
      onAdError={proxy(props.onAdError)}
      onAdFinished={proxy(props.onAdFinished)}
      onAdManifestLoad={proxy(props.onAdManifestLoad)}
      onAdManifestLoaded={proxy(props.onAdManifestLoaded)}
      onAdQuartile={proxy(props.onAdQuartile)}
      onAdScheduled={proxy(props.onAdScheduled)}
      onAdSkipped={proxy(props.onAdSkipped)}
      onAdStarted={proxy(props.onAdStarted)}
      onDestroy={proxy(props.onDestroy)}
      onEvent={proxy(props.onEvent)}
      onFullscreenEnabled={proxy(props.onFullscreenEnabled)}
      onFullscreenDisabled={proxy(props.onFullscreenDisabled)}
      onFullscreenEnter={proxy(props.onFullscreenEnter)}
      onFullscreenExit={proxy(props.onFullscreenExit)}
      onMuted={proxy(props.onMuted)}
      onPaused={proxy(props.onPaused)}
      onPictureInPictureAvailabilityChanged={proxy(
        props.onPictureInPictureAvailabilityChanged
      )}
      onPictureInPictureEnter={proxy(props.onPictureInPictureEnter)}
      onPictureInPictureEntered={proxy(props.onPictureInPictureEntered)}
      onPictureInPictureExit={proxy(props.onPictureInPictureExit)}
      onPictureInPictureExited={proxy(props.onPictureInPictureExited)}
      onPlay={proxy(props.onPlay)}
      onPlaybackFinished={proxy(props.onPlaybackFinished)}
      onPlayerActive={proxy(props.onPlayerActive)}
      onPlayerError={proxy(props.onPlayerError)}
      onPlayerWarning={proxy(props.onPlayerWarning)}
      onPlaying={proxy(props.onPlaying)}
      onReady={proxy(props.onReady)}
      onSeek={proxy(props.onSeek)}
      onSeeked={proxy(props.onSeeked)}
      onStallStarted={proxy(props.onStallStarted)}
      onStallEnded={proxy(props.onStallEnded)}
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
      onVideoPlaybackQualityChanged={proxy(props.onVideoPlaybackQualityChanged)}
    />
  );
}
