import { NativeSyntheticEvent } from 'react-native';
import {
  AdBreakFinishedEvent,
  AdBreakStartedEvent,
  AdClickedEvent,
  AdErrorEvent,
  AdFinishedEvent,
  AdManifestLoadedEvent,
  AdManifestLoadEvent,
  AdQuartileEvent,
  AdScheduledEvent,
  AdSkippedEvent,
  AdStartedEvent,
  CastAvailableEvent,
  CastPausedEvent,
  CastPlaybackFinishedEvent,
  CastPlayingEvent,
  CastStartedEvent,
  CastStartEvent,
  CastStoppedEvent,
  CastTimeUpdatedEvent,
  CastWaitingForDeviceEvent,
  DestroyEvent,
  Event,
  FullscreenEnabledEvent,
  FullscreenDisabledEvent,
  FullscreenEnterEvent,
  FullscreenExitEvent,
  MutedEvent,
  PausedEvent,
  PictureInPictureAvailabilityChangedEvent,
  PictureInPictureEnterEvent,
  PictureInPictureEnteredEvent,
  PictureInPictureExitEvent,
  PictureInPictureExitedEvent,
  PlaybackFinishedEvent,
  PlayerActiveEvent,
  PlayerErrorEvent,
  PlayerWarningEvent,
  PlayEvent,
  PlayingEvent,
  ReadyEvent,
  SeekedEvent,
  SeekEvent,
  TimeShiftEvent,
  TimeShiftedEvent,
  StallStartedEvent,
  StallEndedEvent,
  SourceErrorEvent,
  SourceLoadedEvent,
  SourceLoadEvent,
  SourceUnloadedEvent,
  SourceWarningEvent,
  AudioAddedEvent,
  AudioChangedEvent,
  AudioRemovedEvent,
  SubtitleAddedEvent,
  SubtitleChangedEvent,
  SubtitleRemovedEvent,
  TimeChangedEvent,
  UnmutedEvent,
  VideoPlaybackQualityChangedEvent,
} from '../../events';

/**
 * Type that defines all event props supported by `PlayerView` and `NativePlayerView`.
 * Used to generate the specific events interface for each component.
 */
interface EventProps {
  /**
   * Event emitted when an ad break has finished.
   */
  onAdBreakFinished: AdBreakFinishedEvent;
  /**
   * Event emitted when an ad break has started.
   */
  onAdBreakStarted: AdBreakStartedEvent;
  /**
   * Event emitted when an ad has been clicked.
   */
  onAdClicked: AdClickedEvent;
  /**
   * Event emitted when an ad error has occurred.
   */
  onAdError: AdErrorEvent;
  /**
   * Event emitted when an ad has finished.
   */
  onAdFinished: AdFinishedEvent;
  /**
   * Event emitted when an ad manifest starts loading.
   */
  onAdManifestLoad: AdManifestLoadEvent;
  /**
   * Event emitted when an ad manifest has been loaded.
   */
  onAdManifestLoaded: AdManifestLoadedEvent;
  /**
   * Event emitted when an ad quartile has been reached.
   */
  onAdQuartile: AdQuartileEvent;
  /**
   * Event emitted when an ad has been scheduled.
   */
  onAdScheduled: AdScheduledEvent;
  /**
   * Event emitted when an ad has been skipped.
   */
  onAdSkipped: AdSkippedEvent;
  /**
   * Event emitted when an ad has started.
   */
  onAdStarted: AdStartedEvent;
  /**
   * Event emitted when casting to a cast-compatible device is available.
   *
   * @platform iOS, Android
   */
  onCastAvailable: CastAvailableEvent;
  /**
   * Event emitted when the playback on a cast-compatible device was paused.
   *
   * @platform iOS, Android
   */
  onCastPaused: CastPausedEvent;
  /**
   * Event emitted when the playback on a cast-compatible device has finished.
   *
   * @platform iOS, Android
   */
  onCastPlaybackFinished: CastPlaybackFinishedEvent;
  /**
   * Event emitted when playback on a cast-compatible device has started.
   *
   * @platform iOS, Android
   */
  onCastPlaying: CastPlayingEvent;
  /**
   * Event emitted when the cast app is launched successfully.
   *
   * @platform iOS, Android
   */
  onCastStarted: CastStartedEvent;
  /**
   * Event emitted when casting is initiated, but the user still needs to choose which device should be used.
   *
   * @platform iOS, Android
   */
  onCastStart: CastStartEvent;
  /**
   * Event emitted when casting to a cast-compatible device is stopped.
   *
   * @platform iOS, Android
   */
  onCastStopped: CastStoppedEvent;
  /**
   * Event emitted when the time update from the currently used cast-compatible device is received.
   *
   * @platform iOS, Android
   */
  onCastTimeUpdated: CastTimeUpdatedEvent;
  /**
   * Event emitted when a cast-compatible device has been chosen and the player is waiting for the device to get ready for
   * playback.
   *
   * @platform iOS, Android
   */
  onCastWaitingForDevice: CastWaitingForDeviceEvent;
  /**
   * Event emitted when the player is destroyed.
   */
  onDestroy: DestroyEvent;
  /**
   * All events emitted by the player.
   */
  onEvent: Event;
  /**
   * Event emitted when fullscreen mode has been enabled.
   *
   * @platform iOS, Android
   */
  onFullscreenEnabled: FullscreenEnabledEvent;
  /**
   * Event emitted when fullscreen mode has been disabled.
   *
   * @platform iOS, Android
   */
  onFullscreenDisabled: FullscreenDisabledEvent;
  /**
   * Event emitted when fullscreen mode has been entered.
   *
   * @platform iOS, Android
   */
  onFullscreenEnter: FullscreenEnterEvent;
  /**
   * Event emitted when fullscreen mode has been exited.
   *
   * @platform iOS, Android
   */
  onFullscreenExit: FullscreenExitEvent;
  /**
   * Event emitted when the player has been muted.
   */
  onMuted: MutedEvent;
  /**
   * Event emitted when the player has been paused.
   */
  onPaused: PausedEvent;
  /**
   * Event mitted when the availability of the Picture in Picture mode changed.
   */
  onPictureInPictureAvailabilityChanged: PictureInPictureAvailabilityChangedEvent;
  /**
   * Event emitted when the player enters Picture in Picture mode.
   */
  onPictureInPictureEnter: PictureInPictureEnterEvent;
  /**
   * Event emitted when the player entered Picture in Picture mode.
   *
   * @platform iOS
   */
  onPictureInPictureEntered: PictureInPictureEnteredEvent;
  /**
   * Event emitted when the player exits Picture in Picture mode.
   */
  onPictureInPictureExit: PictureInPictureExitEvent;
  /**
   * Event emitted when the player exited Picture in Picture mode.
   *
   * @platform iOS
   */
  onPictureInPictureExited: PictureInPictureExitedEvent;
  /**
   * Event emitted when the player received an intention to start/resume playback.
   */
  onPlay: PlayEvent;
  /**
   * Event emitted when the playback of the current media has finished.
   */
  onPlaybackFinished: PlaybackFinishedEvent;
  /**
   * Event emitted when a source is loaded into the player.
   * Seeking and time shifting are allowed as soon as this event is seen.
   */
  onPlayerActive: PlayerActiveEvent;
  /**
   * Event Emitted when a player error occurred.
   */
  onPlayerError: PlayerErrorEvent;
  /**
   * Event emitted when a player warning occurred.
   */
  onPlayerWarning: PlayerWarningEvent;
  /**
   * Emitted when playback has started.
   */
  onPlaying: PlayingEvent;
  /**
   * Emitted when the player is ready for immediate playback, because initial audio/video
   * has been downloaded.
   */
  onReady: ReadyEvent;
  /**
   * Event emitted when the player is about to seek to a new position.
   * Only applies to VoD streams.
   */
  onSeek: SeekEvent;
  /**
   * Event emitted when seeking has finished and data to continue playback is available.
   * Only applies to VoD streams.
   */
  onSeeked: SeekedEvent;
  /**
   * Event mitted when the player starts time shifting.
   * Only applies to live streams.
   */
  onTimeShift: TimeShiftEvent;
  /**
   * Event emitted when time shifting has finished and data is available to continue playback.
   * Only applies to live streams.
   */
  onTimeShifted: TimeShiftedEvent;
  /**
   * Event emitted when the player begins to stall and to buffer due to an empty buffer.
   */
  onStallStarted: StallStartedEvent;
  /**
   * Event emitted when the player ends stalling, due to enough data in the buffer.
   */
  onStallEnded: StallEndedEvent;
  /**
   * Event emitted when a source error occurred.
   */
  onSourceError: SourceErrorEvent;
  /**
   * Event emitted when a new source loading has started.
   */
  onSourceLoad: SourceLoadEvent;
  /**
   * Event emitted when a new source is loaded.
   * This does not mean that the source is immediately ready for playback.
   * `ReadyEvent` indicates the player is ready for immediate playback.
   */
  onSourceLoaded: SourceLoadedEvent;
  /**
   * Event emitted when the current source has been unloaded.
   */
  onSourceUnloaded: SourceUnloadedEvent;
  /**
   * Event emitted when a source warning occurred.
   */
  onSourceWarning: SourceWarningEvent;
  /**
   * Event emitted when a new audio track is added to the player.
   */
  onAudioAdded: AudioAddedEvent;
  /**
   * Event emitted when the player's selected audio track has changed.
   */
  onAudioChanged: AudioChangedEvent;
  /**
   * Event emitted when an audio track is removed from the player.
   */
  onAudioRemoved: AudioRemovedEvent;
  /**
   * Event emitted when a new subtitle track is added to the player.
   */
  onSubtitleAdded: SubtitleAddedEvent;
  /**
   * Event emitted when the player's selected subtitle track has changed.
   */
  onSubtitleChanged: SubtitleChangedEvent;
  /**
   * Event emitted when a subtitle track is removed from the player.
   */
  onSubtitleRemoved: SubtitleRemovedEvent;
  /**
   * Event emitted when the current playback time has changed.
   */
  onTimeChanged: TimeChangedEvent;
  /**
   * Emitted when the player is unmuted.
   */
  onUnmuted: UnmutedEvent;
  /**
   * Emitted when the current video playback quality has changed.
   */
  onVideoPlaybackQualityChanged: VideoPlaybackQualityChangedEvent;
}

/**
 * Event props for `PlayerView`.
 *
 * Note the events of `PlayerView` are simply a proxy over
 * the events from `NativePlayerView` just removing RN's bubbling data.
 */
export type PlayerViewEvents = {
  [Prop in keyof EventProps]?: (event: EventProps[Prop]) => void;
};

/**
 * Event props for `NativePlayerView`.
 */
export type NativePlayerViewEvents = {
  [Prop in keyof EventProps]?: (
    nativeEvent: NativeSyntheticEvent<EventProps[Prop]>
  ) => void;
};
