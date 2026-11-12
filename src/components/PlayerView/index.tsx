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
            player.config.playbackConfig?.isBackgroundPlaybackEnabled,
          isPictureInPictureEnabledOnPlayer:
            player.config.playbackConfig?.isPictureInPictureEnabled,
          userInterfaceTypeName: player.config.styleConfig?.userInterfaceType,
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
    const subscriptions = [
      props.onSourceAdded && player.on('sourceAdded', props.onSourceAdded),
      props.onSourceRemoved &&
        player.on('sourceRemoved', props.onSourceRemoved),
      props.onPlaylistTransition &&
        player.on('playlistTransition', props.onPlaylistTransition),
      props.onAdBreakFinished &&
        player.on('adBreakFinished', props.onAdBreakFinished),
      props.onAdBreakStarted &&
        player.on('adBreakStarted', props.onAdBreakStarted),
      props.onAdClicked && player.on('adClicked', props.onAdClicked),
      props.onAdError && player.on('adError', props.onAdError),
      props.onAdFinished && player.on('adFinished', props.onAdFinished),
      props.onAdManifestLoad &&
        player.on('adManifestLoad', props.onAdManifestLoad),
      props.onAdManifestLoaded &&
        player.on('adManifestLoaded', props.onAdManifestLoaded),
      props.onAdQuartile && player.on('adQuartile', props.onAdQuartile),
      props.onAdScheduled && player.on('adScheduled', props.onAdScheduled),
      props.onAdSkipped && player.on('adSkipped', props.onAdSkipped),
      props.onAdStarted && player.on('adStarted', props.onAdStarted),
      props.onCastAvailable &&
        player.on('castAvailable', props.onCastAvailable),
      props.onCastPaused && player.on('castPaused', props.onCastPaused),
      props.onCastPlaybackFinished &&
        player.on('castPlaybackFinished', props.onCastPlaybackFinished),
      props.onCastPlaying && player.on('castPlaying', props.onCastPlaying),
      props.onCastStarted && player.on('castStarted', props.onCastStarted),
      props.onCastStart && player.on('castStart', props.onCastStart),
      props.onCastStopped && player.on('castStopped', props.onCastStopped),
      props.onCastTimeUpdated &&
        player.on('castTimeUpdated', props.onCastTimeUpdated),
      props.onCastWaitingForDevice &&
        player.on('castWaitingForDevice', props.onCastWaitingForDevice),
      props.onCueEnter && player.on('cueEnter', props.onCueEnter),
      props.onCueExit && player.on('cueExit', props.onCueExit),
      props.onDestroy && player.on('destroy', props.onDestroy),
      props.onDownloadFinished &&
        player.on('downloadFinished', props.onDownloadFinished),
      props.onVideoDownloadQualityChanged &&
        player.on(
          'videoDownloadQualityChanged',
          props.onVideoDownloadQualityChanged
        ),
      props.onVideoPlaybackQualityChanged &&
        player.on(
          'videoPlaybackQualityChanged',
          props.onVideoPlaybackQualityChanged
        ),
      props.onEvent && player.on('event', props.onEvent),
      props.onMetadata && player.on('metadata', props.onMetadata),
      props.onMetadataParsed &&
        player.on('metadataParsed', props.onMetadataParsed),
      props.onMuted && player.on('muted', props.onMuted),
      props.onNonLinearAdStarted &&
        player.on('nonLinearAdStarted', props.onNonLinearAdStarted),
      props.onNonLinearAdSkipped &&
        player.on('nonLinearAdSkipped', props.onNonLinearAdSkipped),
      props.onNonLinearAdFinished &&
        player.on('nonLinearAdFinished', props.onNonLinearAdFinished),
      props.onPaused && player.on('paused', props.onPaused),
      props.onPlay && player.on('play', props.onPlay),
      props.onPlaybackFinished &&
        player.on('playbackFinished', props.onPlaybackFinished),
      props.onPlaybackSpeedChanged &&
        player.on('playbackSpeedChanged', props.onPlaybackSpeedChanged),
      props.onPlayerActive && player.on('playerActive', props.onPlayerActive),
      props.onPlayerInactive &&
        player.on('playerInactive', props.onPlayerInactive),
      props.onPlayerError && player.on('playerError', props.onPlayerError),
      props.onPlayerWarning &&
        player.on('playerWarning', props.onPlayerWarning),
      props.onPlaying && player.on('playing', props.onPlaying),
      props.onReady && player.on('ready', props.onReady),
      props.onSeek && player.on('seek', props.onSeek),
      props.onSeeked && player.on('seeked', props.onSeeked),
      props.onTimeShift && player.on('timeShift', props.onTimeShift),
      props.onTimeShifted && player.on('timeShifted', props.onTimeShifted),
      props.onStallStarted && player.on('stallStarted', props.onStallStarted),
      props.onStallEnded && player.on('stallEnded', props.onStallEnded),
      props.onSourceError && player.on('sourceError', props.onSourceError),
      props.onSourceLoad && player.on('sourceLoad', props.onSourceLoad),
      props.onSourceLoaded && player.on('sourceLoaded', props.onSourceLoaded),
      props.onSourceUnloaded &&
        player.on('sourceUnloaded', props.onSourceUnloaded),
      props.onSourceWarning &&
        player.on('sourceWarning', props.onSourceWarning),
      props.onAudioAdded && player.on('audioAdded', props.onAudioAdded),
      props.onAudioChanged && player.on('audioChanged', props.onAudioChanged),
      props.onAudioRemoved && player.on('audioRemoved', props.onAudioRemoved),
      props.onSubtitleAdded &&
        player.on('subtitleAdded', props.onSubtitleAdded),
      props.onSubtitleChanged &&
        player.on('subtitleChanged', props.onSubtitleChanged),
      props.onSubtitleRemoved &&
        player.on('subtitleRemoved', props.onSubtitleRemoved),
      props.onTimeChanged && player.on('timeChanged', props.onTimeChanged),
      props.onUnmuted && player.on('unmuted', props.onUnmuted),
      props.onFairplayLicenseAcquired &&
        player.on('fairplayLicenseAcquired', props.onFairplayLicenseAcquired),
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
