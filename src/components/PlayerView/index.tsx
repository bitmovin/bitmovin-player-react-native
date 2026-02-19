import React, { RefObject, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { NativePlayerView, NativePlayerViewConfig } from './native';
import { useProxy } from '../../hooks/useProxy';
import { FullscreenHandlerBridge } from '../../ui/fullscreenhandlerbridge';
import { CustomMessageHandlerBridge } from '../../ui/custommessagehandlerbridge';
import { PlayerViewProps } from './properties';
import { PictureInPictureAction } from './pictureInPictureAction';
import { addPlatformToMetadataEvent } from '../../utils/metadataPlatform';

/**
 * Base style that initializes the native view frame when no width/height prop has been set.
 */
const styles = StyleSheet.create({
  baseStyle: {
    alignSelf: 'stretch',
  },
});

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
  pictureInPictureActions,
  ...props
}: PlayerViewProps) {
  // Keep the device awake while the PlayerView is mounted
  useKeepAwake();

  const nativeView = useRef<InternalPlayerViewRef>(viewRef?.current || null);

  // Native events proxy helper.
  const proxy = useProxy();
  // Style resulting from merging `baseStyle` and `props.style`.
  const nativeViewStyle = StyleSheet.flatten([styles.baseStyle, style]);

  const fullscreenBridge: React.RefObject<FullscreenHandlerBridge | undefined> =
    useRef(undefined);
  if (fullscreenHandler && !fullscreenBridge.current) {
    fullscreenBridge.current = new FullscreenHandlerBridge();
  }
  if (fullscreenBridge.current) {
    fullscreenBridge.current.setFullscreenHandler(fullscreenHandler);
  }

  const customMessageHandlerBridge: React.RefObject<
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

  const nativePlayerViewConfig: NativePlayerViewConfig = {
    playerId: player.nativeId,
    customMessageHandlerBridgeId: customMessageHandlerBridge.current?.nativeId,
    enableBackgroundPlayback:
      player.config?.playbackConfig?.isBackgroundPlaybackEnabled,
    isPictureInPictureEnabledOnPlayer:
      player.config?.playbackConfig?.isPictureInPictureEnabled,
    userInterfaceTypeName: player.config?.styleConfig?.userInterfaceType,
    playerViewConfig: config,
  };

  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);

  useEffect(() => {
    player.initialize().then(() => {
      setIsPlayerInitialized(true);
      // call attach player on native view if switched to AsyncFunction for RNPlayerViewExpo
    });

    return () => {
      fullscreenBridge.current?.destroy();
      fullscreenBridge.current = undefined;
      customMessageHandlerBridge.current?.destroy();
      customMessageHandlerBridge.current = undefined;
    };
  }, [player, fullscreenBridge, customMessageHandlerBridge]);

  useEffect(() => {
    if (isPlayerInitialized && viewRef) {
      viewRef.current = nativeView.current;
    }
  }, [isPlayerInitialized, viewRef, nativeView]);

  useEffect(() => {
    if (isPlayerInitialized && pictureInPictureActions != null) {
      nativeView.current?.updatePictureInPictureActions(
        pictureInPictureActions
      );
    }
  }, [isPlayerInitialized, pictureInPictureActions]);

  if (!isPlayerInitialized) {
    return null;
  }

  return (
    <NativePlayerView
      ref={nativeView}
      style={nativeViewStyle}
      config={nativePlayerViewConfig}
      isFullscreenRequested={isFullscreenRequested}
      isPictureInPictureRequested={isPictureInPictureRequested}
      scalingMode={scalingMode}
      fullscreenBridgeId={fullscreenBridge.current?.nativeId}
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
      onBmpMetadata={
        props.onMetadata
          ? (e) => props.onMetadata?.(addPlatformToMetadataEvent(e.nativeEvent))
          : undefined
      }
      onBmpMetadataParsed={
        props.onMetadataParsed
          ? (e) =>
              props.onMetadataParsed?.(
                addPlatformToMetadataEvent(e.nativeEvent)
              )
          : undefined
      }
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
      onBmpFairplayLicenseAcquired={proxy(props.onFairplayLicenseAcquired)}
    />
  );
}

interface InternalPlayerViewRef extends RefObject<any> {
  /**
   * Update Picture in Picture actions that should be displayed on the Picture in Picture window.
   * Ideally we would just pass the props to the `NativePlayerView`, but due to a React Native limitation,
   * the props aren't passed to the native module when PiP is active on Android.
   */
  updatePictureInPictureActions: (
    actions: PictureInPictureAction[]
  ) => Promise<void>;
}
