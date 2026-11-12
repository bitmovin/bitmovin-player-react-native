import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import type { NativePlayerViewConfig, NativePlayerViewRef } from './native';
import { NativePlayerView } from './native';
import { useProxy } from '../../hooks/useProxy';
import { usePlayerEventProps } from './usePlayerEventProps';
import { getNativeCustomMessage } from '../../ui/customMessageHandler';
import {
  FullscreenHandlerBridge,
  getNativeFullscreen,
} from '../../ui/fullscreenHandlerBridge';
import type { PlayerViewProps } from './properties';
import type { PictureInPictureAction } from './pictureInPictureAction';

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

  const nativeView = useRef<NativePlayerViewRef | null>(
    viewRef?.current || null
  );

  const [mountedView, setMountedView] = useState<NativePlayerViewRef | null>(
    null
  );

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

  const nativePlayerViewConfig: NativePlayerViewConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({
          enableBackgroundPlayback:
            player.config?.playbackConfig?.isBackgroundPlaybackEnabled,
          isPictureInPictureEnabledOnPlayer:
            player.config?.playbackConfig?.isPictureInPictureEnabled,
          userInterfaceTypeName: player.config?.styleConfig?.userInterfaceType,
          playerViewConfig: config,
        }).filter(([, value]) => value !== undefined)
      ),
    [player, config]
  );

  const nativePlayer = player.nativeId;
  const didNotifyPlayerViewReady = useRef<
    | {
        player: typeof player;
        view: NativePlayerViewRef;
      }
    | undefined
  >(undefined);
  const currentPlayer = useRef<typeof player | undefined>(player);
  if (currentPlayer.current !== player)
    didNotifyPlayerViewReady.current = undefined;
  currentPlayer.current = player;

  const notifyReady = useRef<(view: NativePlayerViewRef) => void>(() => {});
  notifyReady.current = (view) => {
    if (
      currentPlayer.current !== player ||
      (didNotifyPlayerViewReady.current?.player === player &&
        didNotifyPlayerViewReady.current.view === view)
    )
      return;
    if (viewRef) viewRef.current = view;
    if (pictureInPictureActionsJson != null) {
      void nativeView.current?.updatePictureInPictureActions(
        JSON.parse(pictureInPictureActionsJson)
      );
    }
    if (isPictureInPictureEnabled != null) {
      void nativeView.current?.setIsPictureInPictureEnabled(
        isPictureInPictureEnabled
      );
    }
    didNotifyPlayerViewReady.current = { player, view };
    onPlayerViewReady?.();
  };

  useEffect(() => {
    const target = nativeView.current;
    if (!nativePlayer || !target || mountedView !== target) return;
    let cancelled = false;
    // Method arguments cross Expo directly; public objects never become Fabric host props.
    void player
      .initialize()
      .then(() =>
        target.attachBindings(
          nativePlayer,
          fullscreenHandler && fullscreenBridge.current
            ? getNativeFullscreen(fullscreenBridge.current)
            : undefined,
          customMessageHandler
            ? getNativeCustomMessage(customMessageHandler)
            : undefined,
          nativePlayerViewConfig
        )
      )
      .then(
        () => {
          if (
            !cancelled &&
            nativeView.current === target &&
            currentPlayer.current === player
          )
            notifyReady.current(target);
        },
        (error) => {
          if (
            !cancelled &&
            nativeView.current === target &&
            currentPlayer.current === player
          ) {
            console.warn(
              'PlayerView could not attach its native bindings:',
              error
            );
          }
        }
      );
    return () => {
      cancelled = true;
    };
  }, [
    mountedView,
    nativePlayer,
    player,
    fullscreenHandler,
    customMessageHandler,
    nativePlayerViewConfig,
  ]);

  // Compare the actions by content, so passing a new array with the same actions on every render
  // does not trigger a native update each time.
  const pictureInPictureActionsJson =
    pictureInPictureActions != null
      ? JSON.stringify(pictureInPictureActions)
      : undefined;
  useEffect(() => {
    if (
      mountedView === nativeView.current &&
      pictureInPictureActionsJson != null
    ) {
      void nativeView.current?.updatePictureInPictureActions(
        JSON.parse(pictureInPictureActionsJson) as PictureInPictureAction[]
      );
    }
  }, [mountedView, nativePlayer, pictureInPictureActionsJson]);

  useEffect(() => {
    if (
      mountedView === nativeView.current &&
      isPictureInPictureEnabled != null
    ) {
      void nativeView.current?.setIsPictureInPictureEnabled(
        isPictureInPictureEnabled
      );
    }
  }, [mountedView, nativePlayer, isPictureInPictureEnabled]);

  return (
    <NativePlayerView
      ref={nativeView}
      onBmpViewAttached={() => setMountedView(nativeView.current)}
      style={nativeViewStyle}
      isFullscreenRequested={isFullscreenRequested}
      isPictureInPictureRequested={isPictureInPictureRequested}
      scalingMode={scalingMode}
      onBmpPictureInPictureAvailabilityChanged={proxy(
        props.onPictureInPictureAvailabilityChanged
      )}
      onBmpFullscreenEnabled={proxy(props.onFullscreenEnabled)}
      onBmpFullscreenDisabled={proxy(props.onFullscreenDisabled)}
      onBmpFullscreenEnter={proxy(props.onFullscreenEnter)}
      onBmpFullscreenExit={proxy(props.onFullscreenExit)}
      onBmpPictureInPictureEnter={proxy(props.onPictureInPictureEnter)}
      onBmpPictureInPictureEntered={proxy(props.onPictureInPictureEntered)}
      onBmpPictureInPictureExit={proxy(props.onPictureInPictureExit)}
      onBmpPictureInPictureExited={proxy(props.onPictureInPictureExited)}
    />
  );
}
