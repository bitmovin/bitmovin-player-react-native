import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import type { NativePlayerViewConfig, NativePlayerViewRef } from './native';
import { NativePlayerView } from './native';
import { useProxy } from '../../hooks/useProxy';
import { getNativePlayer } from '../../player';
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
            player.config.playbackConfig?.isBackgroundPlaybackEnabled,
          isPictureInPictureEnabledOnPlayer:
            player.config.playbackConfig?.isPictureInPictureEnabled,
          userInterfaceTypeName: player.config.styleConfig?.userInterfaceType,
          playerViewConfig: config,
        }).filter(([, value]) => value !== undefined)
      ),
    [player, config]
  );

  const nativePlayer = getNativePlayer(player);
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
    void target
      .attachBindings(
        nativePlayer,
        fullscreenHandler && fullscreenBridge.current
          ? getNativeFullscreen(fullscreenBridge.current)
          : undefined,
        customMessageHandler
          ? getNativeCustomMessage(customMessageHandler)
          : undefined,
        nativePlayerViewConfig
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

  useEffect(() => {
    const subscriptions = [
      player.on(
        Platform.OS === 'ios' ? 'sourceAddedEvent' : 'sourceAdded',
        (event) => props.onSourceAdded?.(event)
      ),
      player.on(
        Platform.OS === 'ios' ? 'sourceRemovedEvent' : 'sourceRemoved',
        (event) => props.onSourceRemoved?.(event)
      ),
      player.on('playlistTransition', (event) =>
        props.onPlaylistTransition?.(event)
      ),
      player.on('adBreakFinished', (event) => props.onAdBreakFinished?.(event)),
      player.on('adBreakStarted', (event) => props.onAdBreakStarted?.(event)),
      player.on('adClicked', (event) => props.onAdClicked?.(event)),
      player.on('adError', (event) => props.onAdError?.(event)),
      player.on('adFinished', (event) => props.onAdFinished?.(event)),
      player.on('adManifestLoad', (event) => props.onAdManifestLoad?.(event)),
      player.on('adManifestLoaded', (event) =>
        props.onAdManifestLoaded?.(event)
      ),
      player.on('adQuartile', (event) => props.onAdQuartile?.(event)),
      player.on('adScheduled', (event) => props.onAdScheduled?.(event)),
      player.on('adSkipped', (event) => props.onAdSkipped?.(event)),
      player.on('adStarted', (event) => props.onAdStarted?.(event)),
      player.on('castAvailable', (event) => props.onCastAvailable?.(event)),
      player.on('castPaused', (event) => props.onCastPaused?.(event)),
      player.on('castPlaybackFinished', (event) =>
        props.onCastPlaybackFinished?.(event)
      ),
      player.on('castPlaying', (event) => props.onCastPlaying?.(event)),
      player.on('castStarted', (event) => props.onCastStarted?.(event)),
      player.on('castStart', (event) => props.onCastStart?.(event)),
      player.on('castStopped', (event) => props.onCastStopped?.(event)),
      player.on('castTimeUpdated', (event) => props.onCastTimeUpdated?.(event)),
      player.on('castWaitingForDevice', (event) =>
        props.onCastWaitingForDevice?.(event)
      ),
      player.on('cueEnter', (event) => props.onCueEnter?.(event)),
      player.on('cueExit', (event) => props.onCueExit?.(event)),
      player.on('destroy', (event) => props.onDestroy?.(event)),
      player.on('downloadFinished', (event) =>
        props.onDownloadFinished?.(event)
      ),
      player.on('videoDownloadQualityChanged', (event) =>
        props.onVideoDownloadQualityChanged?.(event)
      ),
      player.on('videoPlaybackQualityChanged', (event) =>
        props.onVideoPlaybackQualityChanged?.(event)
      ),
      player.on('event', (event) => props.onEvent?.(event)),
      player.on('metadata', (event) => props.onMetadata?.(event)),
      player.on('metadataParsed', (event) => props.onMetadataParsed?.(event)),
      player.on('muted', (event) => props.onMuted?.(event)),
      player.on('nonLinearAdStarted', (event) =>
        props.onNonLinearAdStarted?.(event)
      ),
      player.on('nonLinearAdSkipped', (event) =>
        props.onNonLinearAdSkipped?.(event)
      ),
      player.on('nonLinearAdFinished', (event) =>
        props.onNonLinearAdFinished?.(event)
      ),
      player.on('paused', (event) => props.onPaused?.(event)),
      player.on('play', (event) => props.onPlay?.(event)),
      player.on('playbackFinished', (event) =>
        props.onPlaybackFinished?.(event)
      ),
      player.on('playbackSpeedChanged', (event) =>
        props.onPlaybackSpeedChanged?.(event)
      ),
      player.on('playerActive', (event) => props.onPlayerActive?.(event)),
      player.on('playerInactive', (event) => props.onPlayerInactive?.(event)),
      player.on('playerError', (event) => props.onPlayerError?.(event)),
      player.on('playerWarning', (event) => props.onPlayerWarning?.(event)),
      player.on('playing', (event) => props.onPlaying?.(event)),
      player.on('ready', (event) => props.onReady?.(event)),
      player.on('seek', (event) => props.onSeek?.(event)),
      player.on('seeked', (event) => props.onSeeked?.(event)),
      player.on('timeShift', (event) => props.onTimeShift?.(event)),
      player.on('timeShifted', (event) => props.onTimeShifted?.(event)),
      player.on('stallStarted', (event) => props.onStallStarted?.(event)),
      player.on('stallEnded', (event) => props.onStallEnded?.(event)),
      player.on('sourceError', (event) => props.onSourceError?.(event)),
      player.on('sourceLoad', (event) => props.onSourceLoad?.(event)),
      player.on('sourceLoaded', (event) => props.onSourceLoaded?.(event)),
      player.on('sourceUnloaded', (event) => props.onSourceUnloaded?.(event)),
      player.on('sourceWarning', (event) => props.onSourceWarning?.(event)),
      player.on('audioAdded', (event) => props.onAudioAdded?.(event)),
      player.on('audioChanged', (event) => props.onAudioChanged?.(event)),
      player.on('audioRemoved', (event) => props.onAudioRemoved?.(event)),
      player.on('subtitleAdded', (event) => props.onSubtitleAdded?.(event)),
      player.on('subtitleChanged', (event) => props.onSubtitleChanged?.(event)),
      player.on('subtitleRemoved', (event) => props.onSubtitleRemoved?.(event)),
      player.on('timeChanged', (event) => props.onTimeChanged?.(event)),
      player.on('unmuted', (event) => props.onUnmuted?.(event)),
      player.on('fairplayLicenseAcquired', (event) =>
        props.onFairplayLicenseAcquired?.(event)
      ),
    ].map((pending) => pending.catch(() => undefined));
    return () => {
      subscriptions.forEach((pending) => {
        void pending.then((subscription) => subscription?.remove());
      });
    };
  }, [player, props]);

  useEffect(
    () => () => {
      void fullscreenBridge.current?.destroy();
      fullscreenBridge.current = undefined;
    },
    []
  );

  useEffect(() => {
    if (!nativePlayer || !nativeView.current) {
      return;
    }

    // Also populate a replacement ref supplied after readiness, when the ready event
    // will not be replayed. A mounted view ref alone does not imply native readiness.
    if (viewRef) {
      viewRef.current = nativeView.current;
    }
  }, [nativePlayer, viewRef, nativeView]);

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
