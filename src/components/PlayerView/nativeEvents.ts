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
 * Event props for `NativePlayerView`.
 */
export type NativePlayerViewEvents = {
  /**
   * Event emitted when an ad break has finished.
   */
  onBmpAdBreakFinished?: (event: { nativeEvent: AdBreakFinishedEvent }) => void;
  /**
   * Event emitted when an ad break has started.
   */
  onBmpAdBreakStarted?: (event: { nativeEvent: AdBreakStartedEvent }) => void;
  /**
   * Event emitted when an ad has been clicked.
   */
  onBmpAdClicked?: (event: { nativeEvent: AdClickedEvent }) => void;
  /**
   * Event emitted when an ad error has occurred.
   */
  onBmpAdError?: (event: { nativeEvent: AdErrorEvent }) => void;
  /**
   * Event emitted when an ad has finished.
   */
  onBmpAdFinished?: (event: { nativeEvent: AdFinishedEvent }) => void;
  /**
   * Event emitted when an ad manifest starts loading.
   */
  onBmpAdManifestLoad?: (event: { nativeEvent: AdManifestLoadEvent }) => void;
  /**
   * Event emitted when an ad manifest has been loaded.
   */
  onBmpAdManifestLoaded?: (event: {
    nativeEvent: AdManifestLoadedEvent;
  }) => void;
  /**
   * Event emitted when an ad quartile has been reached.
   */
  onBmpAdQuartile?: (event: { nativeEvent: AdQuartileEvent }) => void;
  /**
   * Event emitted when an ad has been scheduled.
   */
  onBmpAdScheduled?: (event: { nativeEvent: AdScheduledEvent }) => void;
  /**
   * Event emitted when an ad has been skipped.
   */
  onBmpAdSkipped?: (event: { nativeEvent: AdSkippedEvent }) => void;
  /**
   * Event emitted when an ad has started.
   */
  onBmpAdStarted?: (event: { nativeEvent: AdStartedEvent }) => void;
  /**
   * Event emitted when casting to a cast-compatible device is available.
   *
   * @platform iOS, Android
   */
  onBmpCastAvailable?: (event: { nativeEvent: CastAvailableEvent }) => void;
  /**
   * Event emitted when the playback on a cast-compatible device was paused.
   *
   * @platform iOS, Android
   */
  onBmpCastPaused?: (event: { nativeEvent: CastPausedEvent }) => void;
  /**
   * Event emitted when the playback on a cast-compatible device has finished.
   *
   * @platform iOS, Android
   */
  onBmpCastPlaybackFinished?: (event: {
    nativeEvent: CastPlaybackFinishedEvent;
  }) => void;
  /**
   * Event emitted when playback on a cast-compatible device has started.
   *
   * @platform iOS, Android
   */
  onBmpCastPlaying?: (event: { nativeEvent: CastPlayingEvent }) => void;
  /**
   * Event emitted when the cast app is launched successfully.
   *
   * @platform iOS, Android
   */
  onBmpCastStarted?: (event: { nativeEvent: CastStartedEvent }) => void;
  /**
   * Event emitted when casting is initiated, but the user still needs to choose which device should be used.
   *
   * @platform iOS, Android
   */
  onBmpCastStart?: (event: { nativeEvent: CastStartEvent }) => void;
  /**
   * Event emitted when casting to a cast-compatible device is stopped.
   *
   * @platform iOS, Android
   */
  onBmpCastStopped?: (event: { nativeEvent: CastStoppedEvent }) => void;
  /**
   * Event emitted when the time update from the currently used cast-compatible device is received.
   *
   * @platform iOS, Android
   */
  onBmpCastTimeUpdated?: (event: { nativeEvent: CastTimeUpdatedEvent }) => void;
  /**
   * Event emitted when a cast-compatible device has been chosen and the player is waiting for the device to get ready for
   * playback.
   *
   * @platform iOS, Android
   */
  onBmpCastWaitingForDevice?: (event: {
    nativeEvent: CastWaitingForDeviceEvent;
  }) => void;
  /**
   * Event emitted when a subtitle entry transitions into the active status.
   */
  onBmpCueEnter?: (event: { nativeEvent: CueEnterEvent }) => void;
  /**
   * Event emitted when an active subtitle entry transitions into the inactive status.
   */
  onBmpCueExit?: (event: { nativeEvent: CueExitEvent }) => void;
  /**
   * Event emitted when the player is destroyed.
   */
  onBmpDestroy?: (event: { nativeEvent: DestroyEvent }) => void;
  /**
   * Emitted when a download was finished.
   */
  onBmpDownloadFinished?: (event: {
    nativeEvent: DownloadFinishedEvent;
  }) => void;
  /**
   * All events emitted by the player.
   */
  onBmpEvent?: (event: { nativeEvent: Event }) => void;
  /**
   * Event emitted when fullscreen mode has been enabled.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenEnabled?: (event: {
    nativeEvent: FullscreenEnabledEvent;
  }) => void;
  /**
   * Event emitted when fullscreen mode has been disabled.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenDisabled?: (event: {
    nativeEvent: FullscreenDisabledEvent;
  }) => void;
  /**
   * Event emitted when fullscreen mode has been entered.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenEnter?: (event: { nativeEvent: FullscreenEnterEvent }) => void;
  /**
   * Event emitted when fullscreen mode has been exited.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenExit?: (event: { nativeEvent: FullscreenExitEvent }) => void;
  /**
   * Event emitted when the player has been muted.
   */
  onBmpMuted?: (event: { nativeEvent: MutedEvent }) => void;
  /**
   * Event emitted when the player has been paused.
   */
  onBmpPaused?: (event: { nativeEvent: PausedEvent }) => void;
  /**
   * Event mitted when the availability of the Picture in Picture mode changed.
   */
  onBmpPictureInPictureAvailabilityChanged?: (event: {
    nativeEvent: PictureInPictureAvailabilityChangedEvent;
  }) => void;
  /**
   * Event emitted when the player enters Picture in Picture mode.
   */
  onBmpPictureInPictureEnter?: (event: {
    nativeEvent: PictureInPictureEnterEvent;
  }) => void;
  /**
   * Event emitted when the player entered Picture in Picture mode.
   *
   * @platform iOS
   */
  onBmpPictureInPictureEntered?: (event: {
    nativeEvent: PictureInPictureEnteredEvent;
  }) => void;
  /**
   * Event emitted when the player exits Picture in Picture mode.
   */
  onBmpPictureInPictureExit?: (event: {
    nativeEvent: PictureInPictureExitEvent;
  }) => void;
  /**
   * Event emitted when the player exited Picture in Picture mode.
   *
   * @platform iOS
   */
  onBmpPictureInPictureExited?: (event: {
    nativeEvent: PictureInPictureExitedEvent;
  }) => void;
  /**
   * Event emitted when the player received an intention to start/resume playback.
   */
  onBmpPlay?: (event: { nativeEvent: PlayEvent }) => void;
  /**
   * Event emitted when the playback of the current media has finished.
   */
  onBmpPlaybackFinished?: (event: {
    nativeEvent: PlaybackFinishedEvent;
  }) => void;
  /**
   * Emitted when the player transitions from one playback speed to another.
   * @platform iOS, tvOS
   */
  onBmpPlaybackSpeedChanged?: (event: {
    nativeEvent: PlaybackSpeedChangedEvent;
  }) => void;
  /**
   * Event emitted when a source is loaded into the player.
   * Seeking and time shifting are allowed as soon as this event is seen.
   */
  onBmpPlayerActive?: (event: { nativeEvent: PlayerActiveEvent }) => void;
  /**
   * Event Emitted when a player error occurred.
   */
  onBmpPlayerError?: (event: { nativeEvent: PlayerErrorEvent }) => void;
  /**
   * Event emitted when a player warning occurred.
   */
  onBmpPlayerWarning?: (event: { nativeEvent: PlayerWarningEvent }) => void;
  /**
   * Emitted when playback has started.
   */
  onBmpPlaying?: (event: { nativeEvent: PlayingEvent }) => void;
  /**
   * Emitted when the player is ready for immediate playback, because initial audio/video
   * has been downloaded.
   */
  onBmpReady?: (event: { nativeEvent: ReadyEvent }) => void;
  /**
   * Event emitted when the player is about to seek to a new position.
   * Only applies to VoD streams.
   */
  onBmpSeek?: (event: { nativeEvent: SeekEvent }) => void;
  /**
   * Event emitted when seeking has finished and data to continue playback is available.
   * Only applies to VoD streams.
   */
  onBmpSeeked?: (event: { nativeEvent: SeekedEvent }) => void;
  /**
   * Event mitted when the player starts time shifting.
   * Only applies to live streams.
   */
  onBmpTimeShift?: (event: { nativeEvent: TimeShiftEvent }) => void;
  /**
   * Event emitted when time shifting has finished and data is available to continue playback.
   * Only applies to live streams.
   */
  onBmpTimeShifted?: (event: { nativeEvent: TimeShiftedEvent }) => void;
  /**
   * Event emitted when the player begins to stall and to buffer due to an empty buffer.
   */
  onBmpStallStarted?: (event: { nativeEvent: StallStartedEvent }) => void;
  /**
   * Event emitted when the player ends stalling, due to enough data in the buffer.
   */
  onBmpStallEnded?: (event: { nativeEvent: StallEndedEvent }) => void;
  /**
   * Event emitted when a source error occurred.
   */
  onBmpSourceError?: (event: { nativeEvent: SourceErrorEvent }) => void;
  /**
   * Event emitted when a new source loading has started.
   */
  onBmpSourceLoad?: (event: { nativeEvent: SourceLoadEvent }) => void;
  /**
   * Event emitted when a new source is loaded.
   * This does not mean that the source is immediately ready for playback.
   * `ReadyEvent` indicates the player is ready for immediate playback.
   */
  onBmpSourceLoaded?: (event: { nativeEvent: SourceLoadedEvent }) => void;
  /**
   * Event emitted when the current source has been unloaded.
   */
  onBmpSourceUnloaded?: (event: { nativeEvent: SourceUnloadedEvent }) => void;
  /**
   * Event emitted when a source warning occurred.
   */
  onBmpSourceWarning?: (event: { nativeEvent: SourceWarningEvent }) => void;
  /**
   * Event emitted when a new audio track is added to the player.
   */
  onBmpAudioAdded?: (event: { nativeEvent: AudioAddedEvent }) => void;
  /**
   * Event emitted when the player's selected audio track has changed.
   */
  onBmpAudioChanged?: (event: { nativeEvent: AudioChangedEvent }) => void;
  /**
   * Event emitted when an audio track is removed from the player.
   */
  onBmpAudioRemoved?: (event: { nativeEvent: AudioRemovedEvent }) => void;
  /**
   * Event emitted when a new subtitle track is added to the player.
   */
  onBmpSubtitleAdded?: (event: { nativeEvent: SubtitleAddedEvent }) => void;
  /**
   * Event emitted when the player's selected subtitle track has changed.
   */
  onBmpSubtitleChanged?: (event: { nativeEvent: SubtitleChangedEvent }) => void;
  /**
   * Event emitted when a subtitle track is removed from the player.
   */
  onBmpSubtitleRemoved?: (event: { nativeEvent: SubtitleRemovedEvent }) => void;
  /**
   * Event emitted when the current playback time has changed.
   */
  onBmpTimeChanged?: (event: { nativeEvent: TimeChangedEvent }) => void;
  /**
   * Emitted when the player is unmuted.
   */
  onBmpUnmuted?: (event: { nativeEvent: UnmutedEvent }) => void;
  /**
   * Emitted when current video download quality has changed.
   */
  onBmpVideoDownloadQualityChanged?: (event: {
    nativeEvent: VideoDownloadQualityChangedEvent;
  }) => void;
  /**
   * Emitted when the current video playback quality has changed.
   */
  onBmpVideoPlaybackQualityChanged?: (event: {
    nativeEvent: VideoPlaybackQualityChangedEvent;
  }) => void;
};
