import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import type { NativePlayerViewConfig } from './native';
import { NativePlayerView } from './native';
import { useProxy } from '../../hooks/useProxy';
import { FullscreenHandlerBridge } from '../../ui/fullscreenhandlerbridge';
import { CustomMessageHandlerBridge } from '../../ui/custommessagehandlerbridge';
import type { PlayerViewProps } from './properties';
import type { PictureInPictureAction } from './pictureInPictureAction';
import { addPlatformToMetadataEvent } from '../../utils/metadataPlatform';
import RNPlayerViewManagerModule from '../../modules/RNPlayerViewManagerModule';
import type { Event } from '../../events';
import { usePlayerEventProps, usesPlayerEvents } from './usePlayerEventProps';

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
  isPictureInPictureEnabled,
  onPlayerViewReady,
  ...props
}: PlayerViewProps) {
  // Keep the device awake while the PlayerView is mounted
  useKeepAwake();

  const nativeView = useRef(viewRef?.current || null);

  // Native events proxy helper.
  const proxy = useProxy();
  usePlayerEventProps(player, props);
  // Player and source events are delivered via `Player.on` when `usesPlayerEvents` is set.
  const playerEventProxy = <E extends Event>(callback?: (event: E) => void) =>
    usesPlayerEvents ? undefined : proxy(callback);
  // Style resulting from merging `baseStyle` and `props.style`.
  const nativeViewStyle = StyleSheet.flatten([styles.baseStyle, style]);

  const fullscreenBridge: RefObject<FullscreenHandlerBridge | undefined> =
    useRef(undefined);
  if (fullscreenHandler && !fullscreenBridge.current) {
    fullscreenBridge.current = new FullscreenHandlerBridge();
  }
  if (fullscreenBridge.current) {
    fullscreenBridge.current.setFullscreenHandler(fullscreenHandler);
  }

  const customMessageHandlerBridge: RefObject<
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

  const [initializedPlayer, setInitializedPlayer] = useState<typeof player>();
  const isPlayerInitialized = initializedPlayer === player;
  const didNotifyPlayerViewReady = useRef<typeof player | undefined>(undefined);
  const currentPlayer = useRef<typeof player | undefined>(player);
  currentPlayer.current = player;

  useEffect(() => {
    let cancelled = false;
    currentPlayer.current = player;
    void player.initialize().then(() => {
      if (!cancelled) {
        setInitializedPlayer(player);
      }
    });

    return () => {
      cancelled = true;
      if (currentPlayer.current === player) {
        currentPlayer.current = undefined;
      }
      fullscreenBridge.current?.destroy();
      fullscreenBridge.current = undefined;
      customMessageHandlerBridge.current?.destroy();
      customMessageHandlerBridge.current = undefined;
    };
  }, [player, fullscreenBridge, customMessageHandlerBridge]);

  useEffect(() => {
    if (!isPlayerInitialized || !nativeView.current) {
      return;
    }

    // Also populate a replacement ref supplied after readiness, when the ready event
    // will not be replayed. A mounted view ref alone does not imply native readiness.
    if (viewRef) {
      viewRef.current = nativeView.current;
    }
  }, [isPlayerInitialized, viewRef, nativeView]);

  // Compare the actions by content, so passing a new array with the same actions on every render
  // does not trigger a native update each time.
  const pictureInPictureActionsJson =
    pictureInPictureActions != null
      ? JSON.stringify(pictureInPictureActions)
      : undefined;
  useEffect(() => {
    if (isPlayerInitialized && pictureInPictureActionsJson != null) {
      void RNPlayerViewManagerModule.updatePictureInPictureActions(
        player.nativeId,
        JSON.parse(pictureInPictureActionsJson) as PictureInPictureAction[]
      );
    }
  }, [isPlayerInitialized, player.nativeId, pictureInPictureActionsJson]);

  useEffect(() => {
    if (isPlayerInitialized && isPictureInPictureEnabled != null) {
      void RNPlayerViewManagerModule.setIsPictureInPictureEnabled(
        player.nativeId,
        isPictureInPictureEnabled
      );
    }
  }, [isPlayerInitialized, player.nativeId, isPictureInPictureEnabled]);

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
      onBmpPlayerViewReady={(event) => {
        if (
          currentPlayer.current !== player ||
          event.nativeEvent.playerId !== player.nativeId ||
          didNotifyPlayerViewReady.current === player
        ) {
          return;
        }
        // Make the ref available inside the callback even if the effect has not run.
        if (viewRef) {
          viewRef.current = nativeView.current;
        }
        didNotifyPlayerViewReady.current = player;
        onPlayerViewReady?.();
      }}
      onBmpAdBreakFinished={playerEventProxy(props.onAdBreakFinished)}
      onBmpAdBreakStarted={playerEventProxy(props.onAdBreakStarted)}
      onBmpAdClicked={playerEventProxy(props.onAdClicked)}
      onBmpAdError={playerEventProxy(props.onAdError)}
      onBmpAdFinished={playerEventProxy(props.onAdFinished)}
      onBmpAdManifestLoad={playerEventProxy(props.onAdManifestLoad)}
      onBmpAdManifestLoaded={playerEventProxy(props.onAdManifestLoaded)}
      onBmpAdQuartile={playerEventProxy(props.onAdQuartile)}
      onBmpAdScheduled={playerEventProxy(props.onAdScheduled)}
      onBmpAdSkipped={playerEventProxy(props.onAdSkipped)}
      onBmpAdStarted={playerEventProxy(props.onAdStarted)}
      onBmpCastAvailable={playerEventProxy(props.onCastAvailable)}
      onBmpCastPaused={playerEventProxy(props.onCastPaused)}
      onBmpCastPlaybackFinished={playerEventProxy(props.onCastPlaybackFinished)}
      onBmpCastPlaying={playerEventProxy(props.onCastPlaying)}
      onBmpCastStarted={playerEventProxy(props.onCastStarted)}
      onBmpCastStart={playerEventProxy(props.onCastStart)}
      onBmpCastStopped={playerEventProxy(props.onCastStopped)}
      onBmpCastTimeUpdated={playerEventProxy(props.onCastTimeUpdated)}
      onBmpCastWaitingForDevice={playerEventProxy(props.onCastWaitingForDevice)}
      onBmpCueEnter={playerEventProxy(props.onCueEnter)}
      onBmpCueExit={playerEventProxy(props.onCueExit)}
      onBmpMetadata={
        !usesPlayerEvents && props.onMetadata
          ? (e) => props.onMetadata?.(addPlatformToMetadataEvent(e.nativeEvent))
          : undefined
      }
      onBmpMetadataParsed={
        !usesPlayerEvents && props.onMetadataParsed
          ? (e) =>
              props.onMetadataParsed?.(
                addPlatformToMetadataEvent(e.nativeEvent)
              )
          : undefined
      }
      onBmpDestroy={playerEventProxy(props.onDestroy)}
      onBmpEvent={playerEventProxy(props.onEvent)}
      onBmpFullscreenEnabled={proxy(props.onFullscreenEnabled)}
      onBmpFullscreenDisabled={proxy(props.onFullscreenDisabled)}
      onBmpFullscreenEnter={proxy(props.onFullscreenEnter)}
      onBmpFullscreenExit={proxy(props.onFullscreenExit)}
      onBmpMuted={playerEventProxy(props.onMuted)}
      onBmpNonLinearAdStarted={playerEventProxy(props.onNonLinearAdStarted)}
      onBmpNonLinearAdSkipped={playerEventProxy(props.onNonLinearAdSkipped)}
      onBmpNonLinearAdFinished={playerEventProxy(props.onNonLinearAdFinished)}
      onBmpPaused={playerEventProxy(props.onPaused)}
      onBmpPictureInPictureAvailabilityChanged={proxy(
        props.onPictureInPictureAvailabilityChanged
      )}
      onBmpPictureInPictureEnter={proxy(props.onPictureInPictureEnter)}
      onBmpPictureInPictureEntered={proxy(props.onPictureInPictureEntered)}
      onBmpPictureInPictureExit={proxy(props.onPictureInPictureExit)}
      onBmpPictureInPictureExited={proxy(props.onPictureInPictureExited)}
      onBmpPlay={playerEventProxy(props.onPlay)}
      onBmpPlaybackFinished={playerEventProxy(props.onPlaybackFinished)}
      onBmpPlaybackSpeedChanged={proxy(props.onPlaybackSpeedChanged)}
      onBmpPlayerActive={playerEventProxy(props.onPlayerActive)}
      onBmpPlayerInactive={playerEventProxy(props.onPlayerInactive)}
      onBmpPlayerError={playerEventProxy(props.onPlayerError)}
      onBmpPlayerWarning={playerEventProxy(props.onPlayerWarning)}
      onBmpPlaying={playerEventProxy(props.onPlaying)}
      onBmpReady={playerEventProxy(props.onReady)}
      onBmpSeek={playerEventProxy(props.onSeek)}
      onBmpSeeked={playerEventProxy(props.onSeeked)}
      onBmpTimeShift={playerEventProxy(props.onTimeShift)}
      onBmpTimeShifted={playerEventProxy(props.onTimeShifted)}
      onBmpStallStarted={playerEventProxy(props.onStallStarted)}
      onBmpStallEnded={playerEventProxy(props.onStallEnded)}
      onBmpSourceError={playerEventProxy(props.onSourceError)}
      onBmpSourceLoad={playerEventProxy(props.onSourceLoad)}
      onBmpSourceLoaded={playerEventProxy(props.onSourceLoaded)}
      onBmpSourceUnloaded={playerEventProxy(props.onSourceUnloaded)}
      onBmpSourceAdded={playerEventProxy(props.onSourceAdded)}
      onBmpSourceRemoved={playerEventProxy(props.onSourceRemoved)}
      onBmpPlaylistTransition={playerEventProxy(props.onPlaylistTransition)}
      onBmpSourceWarning={playerEventProxy(props.onSourceWarning)}
      onBmpAudioAdded={playerEventProxy(props.onAudioAdded)}
      onBmpAudioChanged={playerEventProxy(props.onAudioChanged)}
      onBmpAudioRemoved={playerEventProxy(props.onAudioRemoved)}
      onBmpSubtitleAdded={playerEventProxy(props.onSubtitleAdded)}
      onBmpSubtitleChanged={playerEventProxy(props.onSubtitleChanged)}
      onBmpSubtitleRemoved={playerEventProxy(props.onSubtitleRemoved)}
      onBmpTimeChanged={playerEventProxy(props.onTimeChanged)}
      onBmpUnmuted={playerEventProxy(props.onUnmuted)}
      onBmpVideoDownloadQualityChanged={playerEventProxy(
        props.onVideoDownloadQualityChanged
      )}
      onBmpVideoPlaybackQualityChanged={playerEventProxy(
        props.onVideoPlaybackQualityChanged
      )}
      onBmpDownloadFinished={playerEventProxy(props.onDownloadFinished)}
      onBmpFairplayLicenseAcquired={proxy(props.onFairplayLicenseAcquired)}
    />
  );
}
