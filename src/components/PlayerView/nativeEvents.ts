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
  DownloadFinishedEvent,
  VideoDownloadQualityChangedEvent,
  PlaybackSpeedChangedEvent,
  CueEnterEvent,
  CueExitEvent,
} from '../../events';

/**
 * Type that defines all event props supported by `PlayerView` and `NativePlayerView`.
 * Used to generate the specific events interface for each component.
 */
interface NativeEventProps {
  /**
   * Event emitted when an ad break has finished.
   */
  onBmpAdBreakFinished: AdBreakFinishedEvent;
  /**
   * Event emitted when an ad break has started.
   */
  onBmpAdBreakStarted: AdBreakStartedEvent;
  /**
   * Event emitted when an ad has been clicked.
   */
  onBmpAdClicked: AdClickedEvent;
  /**
   * Event emitted when an ad error has occurred.
   */
  onBmpAdError: AdErrorEvent;
  /**
   * Event emitted when an ad has finished.
   */
  onBmpAdFinished: AdFinishedEvent;
  /**
   * Event emitted when an ad manifest starts loading.
   */
  onBmpAdManifestLoad: AdManifestLoadEvent;
  /**
   * Event emitted when an ad manifest has been loaded.
   */
  onBmpAdManifestLoaded: AdManifestLoadedEvent;
  /**
   * Event emitted when an ad quartile has been reached.
   */
  onBmpAdQuartile: AdQuartileEvent;
  /**
   * Event emitted when an ad has been scheduled.
   */
  onBmpAdScheduled: AdScheduledEvent;
  /**
   * Event emitted when an ad has been skipped.
   */
  onBmpAdSkipped: AdSkippedEvent;
  /**
   * Event emitted when an ad has started.
   */
  onBmpAdStarted: AdStartedEvent;
  /**
   * Event emitted when casting to a cast-compatible device is available.
   *
   * @platform iOS, Android
   */
  onBmpCastAvailable: CastAvailableEvent;
  /**
   * Event emitted when the playback on a cast-compatible device was paused.
   *
   * @platform iOS, Android
   */
  onBmpCastPaused: CastPausedEvent;
  /**
   * Event emitted when the playback on a cast-compatible device has finished.
   *
   * @platform iOS, Android
   */
  onBmpCastPlaybackFinished: CastPlaybackFinishedEvent;
  /**
   * Event emitted when playback on a cast-compatible device has started.
   *
   * @platform iOS, Android
   */
  onBmpCastPlaying: CastPlayingEvent;
  /**
   * Event emitted when the cast app is launched successfully.
   *
   * @platform iOS, Android
   */
  onBmpCastStarted: CastStartedEvent;
  /**
   * Event emitted when casting is initiated, but the user still needs to choose which device should be used.
   *
   * @platform iOS, Android
   */
  onBmpCastStart: CastStartEvent;
  /**
   * Event emitted when casting to a cast-compatible device is stopped.
   *
   * @platform iOS, Android
   */
  onBmpCastStopped: CastStoppedEvent;
  /**
   * Event emitted when the time update from the currently used cast-compatible device is received.
   *
   * @platform iOS, Android
   */
  onBmpCastTimeUpdated: CastTimeUpdatedEvent;
  /**
   * Event emitted when a cast-compatible device has been chosen and the player is waiting for the device to get ready for
   * playback.
   *
   * @platform iOS, Android
   */
  onBmpCastWaitingForDevice: CastWaitingForDeviceEvent;
  /**
   * Event emitted when a subtitle entry transitions into the active status.
   */
  onBmpCueEnter: CueEnterEvent;
  /**
   * Event emitted when an active subtitle entry transitions into the inactive status.
   */
  onBmpCueExit: CueExitEvent;
  /**
   * Event emitted when the player is destroyed.
   */
  onBmpDestroy: DestroyEvent;
  /**
   * Emitted when a download was finished.
   */
  onBmpDownloadFinished: DownloadFinishedEvent;
  /**
   * All events emitted by the player.
   */
  onBmpEvent: Event;
  /**
   * Event emitted when fullscreen mode has been enabled.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenEnabled: FullscreenEnabledEvent;
  /**
   * Event emitted when fullscreen mode has been disabled.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenDisabled: FullscreenDisabledEvent;
  /**
   * Event emitted when fullscreen mode has been entered.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenEnter: FullscreenEnterEvent;
  /**
   * Event emitted when fullscreen mode has been exited.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenExit: FullscreenExitEvent;
  /**
   * Event emitted when the player has been muted.
   */
  onBmpMuted: MutedEvent;
  /**
   * Event emitted when the player has been paused.
   */
  onBmpPaused: PausedEvent;
  /**
   * Event mitted when the availability of the Picture in Picture mode changed.
   */
  onBmpPictureInPictureAvailabilityChanged: PictureInPictureAvailabilityChangedEvent;
  /**
   * Event emitted when the player enters Picture in Picture mode.
   */
  onBmpPictureInPictureEnter: PictureInPictureEnterEvent;
  /**
   * Event emitted when the player entered Picture in Picture mode.
   *
   * @platform iOS
   */
  onBmpPictureInPictureEntered: PictureInPictureEnteredEvent;
  /**
   * Event emitted when the player exits Picture in Picture mode.
   */
  onBmpPictureInPictureExit: PictureInPictureExitEvent;
  /**
   * Event emitted when the player exited Picture in Picture mode.
   *
   * @platform iOS
   */
  onBmpPictureInPictureExited: PictureInPictureExitedEvent;
  /**
   * Event emitted when the player received an intention to start/resume playback.
   */
  onBmpPlay: PlayEvent;
  /**
   * Event emitted when the playback of the current media has finished.
   */
  onBmpPlaybackFinished: PlaybackFinishedEvent;
  /**
   * Emitted when the player transitions from one playback speed to another.
   * @platform iOS, tvOS
   */
  onBmpPlaybackSpeedChanged: PlaybackSpeedChangedEvent;
  /**
   * Event emitted when a source is loaded into the player.
   * Seeking and time shifting are allowed as soon as this event is seen.
   */
  onBmpPlayerActive: PlayerActiveEvent;
  /**
   * Event Emitted when a player error occurred.
   */
  onBmpPlayerError: PlayerErrorEvent;
  /**
   * Event emitted when a player warning occurred.
   */
  onBmpPlayerWarning: PlayerWarningEvent;
  /**
   * Emitted when playback has started.
   */
  onBmpPlaying: PlayingEvent;
  /**
   * Emitted when the player is ready for immediate playback, because initial audio/video
   * has been downloaded.
   */
  onBmpReady: ReadyEvent;
  /**
   * Event emitted when the player is about to seek to a new position.
   * Only applies to VoD streams.
   */
  onBmpSeek: SeekEvent;
  /**
   * Event emitted when seeking has finished and data to continue playback is available.
   * Only applies to VoD streams.
   */
  onBmpSeeked: SeekedEvent;
  /**
   * Event mitted when the player starts time shifting.
   * Only applies to live streams.
   */
  onBmpTimeShift: TimeShiftEvent;
  /**
   * Event emitted when time shifting has finished and data is available to continue playback.
   * Only applies to live streams.
   */
  onBmpTimeShifted: TimeShiftedEvent;
  /**
   * Event emitted when the player begins to stall and to buffer due to an empty buffer.
   */
  onBmpStallStarted: StallStartedEvent;
  /**
   * Event emitted when the player ends stalling, due to enough data in the buffer.
   */
  onBmpStallEnded: StallEndedEvent;
  /**
   * Event emitted when a source error occurred.
   */
  onBmpSourceError: SourceErrorEvent;
  /**
   * Event emitted when a new source loading has started.
   */
  onBmpSourceLoad: SourceLoadEvent;
  /**
   * Event emitted when a new source is loaded.
   * This does not mean that the source is immediately ready for playback.
   * `ReadyEvent` indicates the player is ready for immediate playback.
   */
  onBmpSourceLoaded: SourceLoadedEvent;
  /**
   * Event emitted when the current source has been unloaded.
   */
  onBmpSourceUnloaded: SourceUnloadedEvent;
  /**
   * Event emitted when a source warning occurred.
   */
  onBmpSourceWarning: SourceWarningEvent;
  /**
   * Event emitted when a new audio track is added to the player.
   */
  onBmpAudioAdded: AudioAddedEvent;
  /**
   * Event emitted when the player's selected audio track has changed.
   */
  onBmpAudioChanged: AudioChangedEvent;
  /**
   * Event emitted when an audio track is removed from the player.
   */
  onBmpAudioRemoved: AudioRemovedEvent;
  /**
   * Event emitted when a new subtitle track is added to the player.
   */
  onBmpSubtitleAdded: SubtitleAddedEvent;
  /**
   * Event emitted when the player's selected subtitle track has changed.
   */
  onBmpSubtitleChanged: SubtitleChangedEvent;
  /**
   * Event emitted when a subtitle track is removed from the player.
   */
  onBmpSubtitleRemoved: SubtitleRemovedEvent;
  /**
   * Event emitted when the current playback time has changed.
   */
  onBmpTimeChanged: TimeChangedEvent;
  /**
   * Emitted when the player is unmuted.
   */
  onBmpUnmuted: UnmutedEvent;
  /**
   * Emitted when current video download quality has changed.
   */
  onBmpVideoDownloadQualityChanged: VideoDownloadQualityChangedEvent;
  /**
   * Emitted when the current video playback quality has changed.
   */
  onBmpVideoPlaybackQualityChanged: VideoPlaybackQualityChangedEvent;
}

/**
 * Event props for `NativePlayerView`.
 */
export type NativePlayerViewEvents = {
  [Prop in keyof NativeEventProps]?: (
    nativeEvent: NativeSyntheticEvent<NativeEventProps[Prop]>
  ) => void;
};
