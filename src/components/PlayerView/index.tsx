import React, { useRef, useEffect, useCallback } from 'react';
import {
  Platform,
  UIManager,
  StyleSheet,
  findNodeHandle,
  NodeHandle,
} from 'react-native';
import { NativePlayerView } from './native';
import { useProxy } from '../../hooks/useProxy';
import { FullscreenHandlerBridge } from '../../ui/fullscreenhandlerbridge';
import { CustomMessageHandlerBridge } from '../../ui/custommessagehandlerbridge';
import { PlayerViewProps } from './properties';

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
 *
 * @param options configuration options
 */
export function PlayerView({
  viewRef,
  style,
  player,
  config,
  fullscreenHandler,
  customMessageHandler,
  isFullscreenRequested = false,
  scalingMode,
  isPictureInPictureRequested = false,
  ...props
}: PlayerViewProps) {
  // Workaround React Native UIManager commands not sent until UI refresh
  // See: https://github.com/bitmovin/bitmovin-player-react-native/issues/163
  // Might be fixed in recent RN version: https://github.com/microsoft/react-native-windows/issues/7543
  // Workaround: call a native (noop) function after a (necessary) arbitrary delay
  const workaroundViewManagerCommandNotSent = useCallback(() => {
    setTimeout(() => player.getDuration(), 100);
  }, [player]);

  const nativeView = useRef(viewRef?.current || null);

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
    fullscreenBridge.current.setFullscreenHandler(fullscreenHandler);
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
      workaroundViewManagerCommandNotSent();
    }

    return () => {
      fullscreenBridge.current?.destroy();
      fullscreenBridge.current = undefined;
      customMessageHandlerBridge.current?.destroy();
      customMessageHandlerBridge.current = undefined;
    };
  }, [player, workaroundViewManagerCommandNotSent]);

  useEffect(() => {
    const node = findNodeHandle(nativeView.current);
    if (node) {
      dispatch('setFullscreen', node, isFullscreenRequested);
    }
  }, [isFullscreenRequested, nativeView]);

  useEffect(() => {
    const node = findNodeHandle(nativeView.current);
    if (node && scalingMode) {
      dispatch('setScalingMode', node, scalingMode);
    }
  }, [scalingMode, nativeView]);

  useEffect(() => {
    const node = findNodeHandle(nativeView.current);
    if (node) {
      dispatch('setPictureInPicture', node, isPictureInPictureRequested);
    }
  }, [isPictureInPictureRequested, nativeView]);

  useEffect(() => {
    if (viewRef) {
      viewRef.current = nativeView.current;
    }
  }, [viewRef, nativeView]);

  return (
    <NativePlayerView
      ref={nativeView}
      style={nativeViewStyle}
      fullscreenBridge={fullscreenBridge.current}
      customMessageHandlerBridge={customMessageHandlerBridge.current}
      config={config}
      onBmpAdBreakFinished={proxy(props.onAdBreakFinished)}
      onBmpAdBreakStarted={proxy(props.onAdBreakStarted)}
      onBmpAdClicked={proxy(props.onAdClicked)}
      onBmpAdError={proxy(props.onAdError)}
      onBmpAdFinished={proxy(props.onAdFinished)}
      onBmpAdManifestLoad={proxy(props.onAdManifestLoad)}
      onBmpAdManifestLoaded={proxy(props.onAdManifestLoaded)}
      onBmpAdQuartile={proxy(props.onAdQuartile)}
      onBmpAdScheduled={proxy(props.onAdScheduled)}
      onBmpAdSkipped={proxy(props.onAdSkipped)}
      onBmpAdStarted={proxy(props.onAdStarted)}
      onBmpCastAvailable={proxy(props.onCastAvailable)}
      onBmpCastPaused={proxy(props.onCastPaused)}
      onBmpCastPlaybackFinished={proxy(props.onCastPlaybackFinished)}
      onBmpCastPlaying={proxy(props.onCastPlaying)}
      onBmpCastStarted={proxy(props.onCastStarted)}
      onBmpCastStart={proxy(props.onCastStart)}
      onBmpCastStopped={proxy(props.onCastStopped)}
      onBmpCastTimeUpdated={proxy(props.onCastTimeUpdated)}
      onBmpCastWaitingForDevice={proxy(props.onCastWaitingForDevice)}
      onBmpCueEnter={proxy(props.onCueEnter)}
      onBmpCueExit={proxy(props.onCueExit)}
      onBmpDestroy={proxy(props.onDestroy)}
      onBmpEvent={proxy(props.onEvent)}
      onBmpFullscreenEnabled={proxy(props.onFullscreenEnabled)}
      onBmpFullscreenDisabled={proxy(props.onFullscreenDisabled)}
      onBmpFullscreenEnter={proxy(props.onFullscreenEnter)}
      onBmpFullscreenExit={proxy(props.onFullscreenExit)}
      onBmpMuted={proxy(props.onMuted)}
      onBmpPaused={proxy(props.onPaused)}
      onBmpPictureInPictureAvailabilityChanged={proxy(
        props.onPictureInPictureAvailabilityChanged
      )}
      onBmpPictureInPictureEnter={proxy(props.onPictureInPictureEnter)}
      onBmpPictureInPictureEntered={proxy(props.onPictureInPictureEntered)}
      onBmpPictureInPictureExit={proxy(props.onPictureInPictureExit)}
      onBmpPictureInPictureExited={proxy(props.onPictureInPictureExited)}
      onBmpPlay={proxy(props.onPlay)}
      onBmpPlaybackFinished={proxy(props.onPlaybackFinished)}
      onBmpPlaybackSpeedChanged={proxy(props.onPlaybackSpeedChanged)}
      onBmpPlayerActive={proxy(props.onPlayerActive)}
      onBmpPlayerError={proxy(props.onPlayerError)}
      onBmpPlayerWarning={proxy(props.onPlayerWarning)}
      onBmpPlaying={proxy(props.onPlaying)}
      onBmpReady={proxy(props.onReady)}
      onBmpSeek={proxy(props.onSeek)}
      onBmpSeeked={proxy(props.onSeeked)}
      onBmpTimeShift={proxy(props.onTimeShift)}
      onBmpTimeShifted={proxy(props.onTimeShifted)}
      onBmpStallStarted={proxy(props.onStallStarted)}
      onBmpStallEnded={proxy(props.onStallEnded)}
      onBmpSourceError={proxy(props.onSourceError)}
      onBmpSourceLoad={proxy(props.onSourceLoad)}
      onBmpSourceLoaded={proxy(props.onSourceLoaded)}
      onBmpSourceUnloaded={proxy(props.onSourceUnloaded)}
      onBmpSourceWarning={proxy(props.onSourceWarning)}
      onBmpAudioAdded={proxy(props.onAudioAdded)}
      onBmpAudioChanged={proxy(props.onAudioChanged)}
      onBmpAudioRemoved={proxy(props.onAudioRemoved)}
      onBmpSubtitleAdded={proxy(props.onSubtitleAdded)}
      onBmpSubtitleChanged={proxy(props.onSubtitleChanged)}
      onBmpSubtitleRemoved={proxy(props.onSubtitleRemoved)}
      onBmpTimeChanged={proxy(props.onTimeChanged)}
      onBmpUnmuted={proxy(props.onUnmuted)}
      onBmpVideoDownloadQualityChanged={proxy(
        props.onVideoDownloadQualityChanged
      )}
      onBmpVideoPlaybackQualityChanged={proxy(
        props.onVideoPlaybackQualityChanged
      )}
      onBmpDownloadFinished={proxy(props.onDownloadFinished)}
    />
  );
}
