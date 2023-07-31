import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import { FullscreenHandler, CustomMessageHandler } from '../../ui';
import { FullscreenHandlerBridge } from '../../ui/fullscreenhandlerbridge';
import { CustomMessageHandlerBridge } from '../../ui/custommessagehandlerbridge';

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

  customMessageHandler?: CustomMessageHandler;
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
  customMessageHandler,
  ...props
}: PlayerViewProps) {
  const fakeStateUpdater = useState(1)[1];
  const workaroundViewManagerCommandNotSent = useCallback(() => {
    setTimeout(
      () =>
        fakeStateUpdater((i) => {
          console.log('Workaround #163'); // Player will not load 1/10th if this log is removed :((((
          return i + 1;
        }),
      100
    );
  }, [fakeStateUpdater]);
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

  const customMessageHandlerBridge: React.MutableRefObject<
    CustomMessageHandlerBridge | undefined
  > = useRef(undefined);
  if (customMessageHandler && !customMessageHandlerBridge.current) {
    customMessageHandlerBridge.current = new CustomMessageHandlerBridge();
  }
  if (customMessageHandlerBridge.current && customMessageHandler) {
    customMessageHandlerBridge.current.setCustomMessageHandler(
      customMessageHandler
    );
  }

  useEffect(() => {
    // Initialize native player instance if needed.
    player.initialize();
    // Attach native player to native `PlayerView`.
    const node = findNodeHandle(nativeView.current);
    if (node) {
      // For iOS this has to happen before attaching the player to the view
      // as we need to set the CustomMessageHandler on the BitmovinUserInterfaceConfig
      if (customMessageHandlerBridge.current) {
        dispatch(
          'setCustomMessageHandlerBridgeId',
          node,
          customMessageHandlerBridge.current.nativeId
        );
      }
      dispatch('attachPlayer', node, player.nativeId, player.config);
      if (fullscreenBridge.current) {
        dispatch(
          'attachFullscreenBridge',
          node,
          fullscreenBridge.current.nativeId
        );
      }
      // Workaround React Native Command not sent until UI refresh
      // See: https://github.com/bitmovin/bitmovin-player-react-native/issues/163
      // Seems to be a dup of https://github.com/microsoft/react-native-windows/issues/7543
      // Remove the workaround when React Native is updated
      workaroundViewManagerCommandNotSent();
    }
    return () => {
      fullscreenBridge.current?.destroy();
      fullscreenBridge.current = undefined;
      customMessageHandlerBridge.current?.destroy();
      customMessageHandlerBridge.current = undefined;
    };
  }, [player, workaroundViewManagerCommandNotSent]);
  return (
    <NativePlayerView
      ref={nativeView}
      style={nativeViewStyle}
      fullscreenBridge={fullscreenBridge.current}
      customMessageHandlerBridge={customMessageHandlerBridge.current}
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
      onTimeShift={proxy(props.onTimeShift)}
      onTimeShifted={proxy(props.onTimeShifted)}
      onStallStarted={proxy(props.onStallStarted)}
      onStallEnded={proxy(props.onStallEnded)}
      onSourceError={proxy(props.onSourceError)}
      onSourceLoad={proxy(props.onSourceLoad)}
      onSourceLoaded={proxy(props.onSourceLoaded)}
      onSourceUnloaded={proxy(props.onSourceUnloaded)}
      onSourceWarning={proxy(props.onSourceWarning)}
      onAudioAdded={proxy(props.onAudioAdded)}
      onAudioChanged={proxy(props.onAudioChanged)}
      onAudioRemoved={proxy(props.onAudioRemoved)}
      onSubtitleAdded={proxy(props.onSubtitleAdded)}
      onSubtitleChanged={proxy(props.onSubtitleChanged)}
      onSubtitleRemoved={proxy(props.onSubtitleRemoved)}
      onTimeChanged={proxy(props.onTimeChanged)}
      onUnmuted={proxy(props.onUnmuted)}
      onVideoPlaybackQualityChanged={proxy(props.onVideoPlaybackQualityChanged)}
    />
  );
}
