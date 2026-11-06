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
import RNPlayerViewManagerModule from '../../modules/RNPlayerViewManagerModule';
import { usePlayerEventProps } from './usePlayerEventProps';

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
      onBmpFullscreenEnabled={proxy(props.onFullscreenEnabled)}
      onBmpFullscreenDisabled={proxy(props.onFullscreenDisabled)}
      onBmpFullscreenEnter={proxy(props.onFullscreenEnter)}
      onBmpFullscreenExit={proxy(props.onFullscreenExit)}
      onBmpPictureInPictureAvailabilityChanged={proxy(
        props.onPictureInPictureAvailabilityChanged
      )}
      onBmpPictureInPictureEnter={proxy(props.onPictureInPictureEnter)}
      onBmpPictureInPictureEntered={proxy(props.onPictureInPictureEntered)}
      onBmpPictureInPictureExit={proxy(props.onPictureInPictureExit)}
      onBmpPictureInPictureExited={proxy(props.onPictureInPictureExited)}
    />
  );
}
