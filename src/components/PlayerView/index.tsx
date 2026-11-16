import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import type { NativePlayerViewConfig, NativePlayerViewRef } from './native';
import { NativePlayerView } from './native';
import { useProxy } from '../../hooks/useProxy';
import { FullscreenHandlerBridge } from '../../ui/fullscreenHandlerBridge';
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
            player.config?.playbackConfig?.isBackgroundPlaybackEnabled,
          isPictureInPictureEnabledOnPlayer:
            player.config?.playbackConfig?.isPictureInPictureEnabled,
          userInterfaceTypeName: player.config?.styleConfig?.userInterfaceType,
          playerViewConfig: config,
        }).filter(([, value]) => value !== undefined)
      ),
    [player, config]
  );

  const nativePlayer = player.native;
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
          ? fullscreenBridge.current.native
          : undefined,
        customMessageHandler ? customMessageHandler.native : undefined,
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
    // Expo removes all matching functions, so each effect owns distinct listeners.
    // A late subscription cleanup must not remove the next effect's callbacks.
    const subscriptions = [
      props.onSourceAdded &&
        player.on('sourceAdded', (event) => props.onSourceAdded?.(event)),
      props.onSourceRemoved &&
        player.on('sourceRemoved', (event) => props.onSourceRemoved?.(event)),
      props.onPlaylistTransition &&
        player.on('playlistTransition', (event) =>
          props.onPlaylistTransition?.(event)
        ),
      props.onAdBreakFinished &&
        player.on('adBreakFinished', (event) =>
          props.onAdBreakFinished?.(event)
        ),
      props.onAdBreakStarted &&
        player.on('adBreakStarted', (event) => props.onAdBreakStarted?.(event)),
      props.onAdClicked &&
        player.on('adClicked', (event) => props.onAdClicked?.(event)),
      props.onAdError &&
        player.on('adError', (event) => props.onAdError?.(event)),
      props.onAdFinished &&
        player.on('adFinished', (event) => props.onAdFinished?.(event)),
      props.onAdManifestLoad &&
        player.on('adManifestLoad', (event) => props.onAdManifestLoad?.(event)),
      props.onAdManifestLoaded &&
        player.on('adManifestLoaded', (event) =>
          props.onAdManifestLoaded?.(event)
        ),
      props.onAdQuartile &&
        player.on('adQuartile', (event) => props.onAdQuartile?.(event)),
      props.onAdScheduled &&
        player.on('adScheduled', (event) => props.onAdScheduled?.(event)),
      props.onAdSkipped &&
        player.on('adSkipped', (event) => props.onAdSkipped?.(event)),
      props.onAdStarted &&
        player.on('adStarted', (event) => props.onAdStarted?.(event)),
      props.onCastAvailable &&
        player.on('castAvailable', (event) => props.onCastAvailable?.(event)),
      props.onCastPaused &&
        player.on('castPaused', (event) => props.onCastPaused?.(event)),
      props.onCastPlaybackFinished &&
        player.on('castPlaybackFinished', (event) =>
          props.onCastPlaybackFinished?.(event)
        ),
      props.onCastPlaying &&
        player.on('castPlaying', (event) => props.onCastPlaying?.(event)),
      props.onCastStarted &&
        player.on('castStarted', (event) => props.onCastStarted?.(event)),
      props.onCastStart &&
        player.on('castStart', (event) => props.onCastStart?.(event)),
      props.onCastStopped &&
        player.on('castStopped', (event) => props.onCastStopped?.(event)),
      props.onCastTimeUpdated &&
        player.on('castTimeUpdated', (event) =>
          props.onCastTimeUpdated?.(event)
        ),
      props.onCastWaitingForDevice &&
        player.on('castWaitingForDevice', (event) =>
          props.onCastWaitingForDevice?.(event)
        ),
      props.onCueEnter &&
        player.on('cueEnter', (event) => props.onCueEnter?.(event)),
      props.onCueExit &&
        player.on('cueExit', (event) => props.onCueExit?.(event)),
      props.onDestroy &&
        player.on('destroy', (event) => props.onDestroy?.(event)),
      props.onDownloadFinished &&
        player.on('downloadFinished', (event) =>
          props.onDownloadFinished?.(event)
        ),
      props.onVideoDownloadQualityChanged &&
        player.on('videoDownloadQualityChanged', (event) =>
          props.onVideoDownloadQualityChanged?.(event)
        ),
      props.onVideoPlaybackQualityChanged &&
        player.on('videoPlaybackQualityChanged', (event) =>
          props.onVideoPlaybackQualityChanged?.(event)
        ),
      props.onEvent && player.on('event', (event) => props.onEvent?.(event)),
      props.onMetadata &&
        player.on('metadata', (event) => props.onMetadata?.(event)),
      props.onMetadataParsed &&
        player.on('metadataParsed', (event) => props.onMetadataParsed?.(event)),
      props.onMuted && player.on('muted', (event) => props.onMuted?.(event)),
      props.onNonLinearAdStarted &&
        player.on('nonLinearAdStarted', (event) =>
          props.onNonLinearAdStarted?.(event)
        ),
      props.onNonLinearAdSkipped &&
        player.on('nonLinearAdSkipped', (event) =>
          props.onNonLinearAdSkipped?.(event)
        ),
      props.onNonLinearAdFinished &&
        player.on('nonLinearAdFinished', (event) =>
          props.onNonLinearAdFinished?.(event)
        ),
      props.onPaused && player.on('paused', (event) => props.onPaused?.(event)),
      props.onPlay && player.on('play', (event) => props.onPlay?.(event)),
      props.onPlaybackFinished &&
        player.on('playbackFinished', (event) =>
          props.onPlaybackFinished?.(event)
        ),
      props.onPlaybackSpeedChanged &&
        player.on('playbackSpeedChanged', (event) =>
          props.onPlaybackSpeedChanged?.(event)
        ),
      props.onPlayerActive &&
        player.on('playerActive', (event) => props.onPlayerActive?.(event)),
      props.onPlayerInactive &&
        player.on('playerInactive', (event) => props.onPlayerInactive?.(event)),
      props.onPlayerError &&
        player.on('playerError', (event) => props.onPlayerError?.(event)),
      props.onPlayerWarning &&
        player.on('playerWarning', (event) => props.onPlayerWarning?.(event)),
      props.onPlaying &&
        player.on('playing', (event) => props.onPlaying?.(event)),
      props.onReady && player.on('ready', (event) => props.onReady?.(event)),
      props.onSeek && player.on('seek', (event) => props.onSeek?.(event)),
      props.onSeeked && player.on('seeked', (event) => props.onSeeked?.(event)),
      props.onTimeShift &&
        player.on('timeShift', (event) => props.onTimeShift?.(event)),
      props.onTimeShifted &&
        player.on('timeShifted', (event) => props.onTimeShifted?.(event)),
      props.onStallStarted &&
        player.on('stallStarted', (event) => props.onStallStarted?.(event)),
      props.onStallEnded &&
        player.on('stallEnded', (event) => props.onStallEnded?.(event)),
      props.onSourceError &&
        player.on('sourceError', (event) => props.onSourceError?.(event)),
      props.onSourceLoad &&
        player.on('sourceLoad', (event) => props.onSourceLoad?.(event)),
      props.onSourceLoaded &&
        player.on('sourceLoaded', (event) => props.onSourceLoaded?.(event)),
      props.onSourceUnloaded &&
        player.on('sourceUnloaded', (event) => props.onSourceUnloaded?.(event)),
      props.onSourceWarning &&
        player.on('sourceWarning', (event) => props.onSourceWarning?.(event)),
      props.onAudioAdded &&
        player.on('audioAdded', (event) => props.onAudioAdded?.(event)),
      props.onAudioChanged &&
        player.on('audioChanged', (event) => props.onAudioChanged?.(event)),
      props.onAudioRemoved &&
        player.on('audioRemoved', (event) => props.onAudioRemoved?.(event)),
      props.onSubtitleAdded &&
        player.on('subtitleAdded', (event) => props.onSubtitleAdded?.(event)),
      props.onSubtitleChanged &&
        player.on('subtitleChanged', (event) =>
          props.onSubtitleChanged?.(event)
        ),
      props.onSubtitleRemoved &&
        player.on('subtitleRemoved', (event) =>
          props.onSubtitleRemoved?.(event)
        ),
      props.onTimeChanged &&
        player.on('timeChanged', (event) => props.onTimeChanged?.(event)),
      props.onUnmuted &&
        player.on('unmuted', (event) => props.onUnmuted?.(event)),
      props.onFairplayLicenseAcquired &&
        player.on('fairplayLicenseAcquired', (event) =>
          props.onFairplayLicenseAcquired?.(event)
        ),
    ].map((pending) => pending?.catch(() => undefined));
    return () => {
      subscriptions.forEach((pending) => {
        void pending?.then((subscription) => subscription?.remove());
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
    if (
      !nativeView.current ||
      didNotifyPlayerViewReady.current?.player !== player ||
      didNotifyPlayerViewReady.current.view !== nativeView.current
    ) {
      return;
    }

    // Also populate a replacement ref supplied after readiness, when the ready event
    // will not be replayed. A mounted view ref alone does not imply native readiness.
    if (viewRef) {
      viewRef.current = nativeView.current;
    }
  }, [player, viewRef, nativeView]);

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
