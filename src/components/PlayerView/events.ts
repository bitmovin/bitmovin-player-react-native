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
  MetadataParsedEvent,
  MetadataEvent,
} from '../../events';

/**
 * Event props for `PlayerView`.
 *
 * Note the events of `PlayerView` are simply a proxy over
 * the events from `NativePlayerView` just removing RN's bubbling data.
 */
export type PlayerViewEvents = {
  /**
   * Event emitted when an ad break has finished.
   */
  onAdBreakFinished?: (event: AdBreakFinishedEvent) => void;
  /**
   * Event emitted when an ad break has started.
   */
  onAdBreakStarted?: (event: AdBreakStartedEvent) => void;
  /**
   * Event emitted when an ad has been clicked.
   */
  onAdClicked?: (event: AdClickedEvent) => void;
  /**
   * Event emitted when an ad error has occurred.
   */
  onAdError?: (event: AdErrorEvent) => void;
  /**
   * Event emitted when an ad has finished.
   */
  onAdFinished?: (event: AdFinishedEvent) => void;
  /**
   * Event emitted when an ad manifest starts loading.
   */
  onAdManifestLoad?: (event: AdManifestLoadEvent) => void;
  /**
   * Event emitted when an ad manifest has been loaded.
   */
  onAdManifestLoaded?: (event: AdManifestLoadedEvent) => void;
  /**
   * Event emitted when an ad quartile has been reached.
   */
  onAdQuartile?: (event: AdQuartileEvent) => void;
  /**
   * Event emitted when an ad has been scheduled.
   */
  onAdScheduled?: (event: AdScheduledEvent) => void;
  /**
   * Event emitted when an ad has been skipped.
   */
  onAdSkipped?: (event: AdSkippedEvent) => void;
  /**
   * Event emitted when an ad has started.
   */
  onAdStarted?: (event: AdStartedEvent) => void;
  /**
   * Event emitted when casting to a cast-compatible device is available.
   *
   * @platform iOS, Android
   */
  onCastAvailable?: (event: CastAvailableEvent) => void;
  /**
   * Event emitted when the playback on a cast-compatible device was paused.
   *
   * @platform iOS, Android
   */
  onCastPaused?: (event: CastPausedEvent) => void;
  /**
   * Event emitted when the playback on a cast-compatible device has finished.
   *
   * @platform iOS, Android
   */
  onCastPlaybackFinished?: (event: CastPlaybackFinishedEvent) => void;
  /**
   * Event emitted when playback on a cast-compatible device has started.
   *
   * @platform iOS, Android
   */
  onCastPlaying?: (event: CastPlayingEvent) => void;
  /**
   * Event emitted when the cast app is launched successfully.
   *
   * @platform iOS, Android
   */
  onCastStarted?: (event: CastStartedEvent) => void;
  /**
   * Event emitted when casting is initiated, but the user still needs to choose which device should be used.
   *
   * @platform iOS, Android
   */
  onCastStart?: (event: CastStartEvent) => void;
  /**
   * Event emitted when casting to a cast-compatible device is stopped.
   *
   * @platform iOS, Android
   */
  onCastStopped?: (event: CastStoppedEvent) => void;
  /**
   * Event emitted when the time update from the currently used cast-compatible device is received.
   *
   * @platform iOS, Android
   */
  onCastTimeUpdated?: (event: CastTimeUpdatedEvent) => void;
  /**
   * Event emitted when a cast-compatible device has been chosen and the player is waiting for the device to get ready for
   * playback.
   *
   * @platform iOS, Android
   */
  onCastWaitingForDevice?: (event: CastWaitingForDeviceEvent) => void;
  /**
   * Event emitted when a subtitle entry transitions into the active status.
   */
  onCueEnter?: (event: CueEnterEvent) => void;
  /**
   * Event emitted when an active subtitle entry transitions into the inactive status.
   */
  onCueExit?: (event: CueExitEvent) => void;
  /**
   * Event emitted when the player is destroyed.
   */
  onDestroy?: (event: DestroyEvent) => void;
  /**
   * Emitted when a download was finished.
   */
  onDownloadFinished?: (event: DownloadFinishedEvent) => void;
  /**
   * All events emitted by the player.
   */
  onEvent?: (event: Event) => void;
  /**
   * Event emitted when fullscreen mode has been enabled.
   *
   * @platform iOS, Android
   */
  onFullscreenEnabled?: (event: FullscreenEnabledEvent) => void;
  /**
   * Event emitted when fullscreen mode has been disabled.
   *
   * @platform iOS, Android
   */
  onFullscreenDisabled?: (event: FullscreenDisabledEvent) => void;
  /**
   * Event emitted when fullscreen mode has been entered.
   *
   * @platform iOS, Android
   */
  onFullscreenEnter?: (event: FullscreenEnterEvent) => void;
  /**
   * Event emitted when fullscreen mode has been exited.
   *
   * @platform iOS, Android
   */
  onFullscreenExit?: (event: FullscreenExitEvent) => void;
  /**
   * Emitted when metadata is encountered during playback.
   */
  onMetadata?: (event: MetadataEvent) => void;
  /**
   * Emitted when metadata is first seen and parsed.
   */
  onMetadataParsed?: (event: MetadataParsedEvent) => void;
  /**
   * Event emitted when the player has been muted.
   */
  onMuted?: (event: MutedEvent) => void;
  /**
   * Event emitted when the player has been paused.
   */
  onPaused?: (event: PausedEvent) => void;
  /**
   * Event mitted when the availability of the Picture in Picture mode changed.
   */
  onPictureInPictureAvailabilityChanged?: (
    event: PictureInPictureAvailabilityChangedEvent
  ) => void;
  /**
   * Event emitted when the player enters Picture in Picture mode.
   */
  onPictureInPictureEnter?: (event: PictureInPictureEnterEvent) => void;
  /**
   * Event emitted when the player entered Picture in Picture mode.
   *
   * @platform iOS
   */
  onPictureInPictureEntered?: (event: PictureInPictureEnteredEvent) => void;
  /**
   * Event emitted when the player exits Picture in Picture mode.
   */
  onPictureInPictureExit?: (event: PictureInPictureExitEvent) => void;
  /**
   * Event emitted when the player exited Picture in Picture mode.
   *
   * @platform iOS
   */
  onPictureInPictureExited?: (event: PictureInPictureExitedEvent) => void;
  /**
   * Event emitted when the player received an intention to start/resume playback.
   */
  onPlay?: (event: PlayEvent) => void;
  /**
   * Event emitted when the playback of the current media has finished.
   */
  onPlaybackFinished?: (event: PlaybackFinishedEvent) => void;
  /**
   * Emitted when the player transitions from one playback speed to another.
   * @platform iOS, tvOS
   */
  onPlaybackSpeedChanged?: (event: PlaybackSpeedChangedEvent) => void;
  /**
   * Event emitted when a source is loaded into the player.
   * Seeking and time shifting are allowed as soon as this event is seen.
   */
  onPlayerActive?: (event: PlayerActiveEvent) => void;
  /**
   * Event Emitted when a player error occurred.
   */
  onPlayerError?: (event: PlayerErrorEvent) => void;
  /**
   * Event emitted when a player warning occurred.
   */
  onPlayerWarning?: (event: PlayerWarningEvent) => void;
  /**
   * Emitted when playback has started.
   */
  onPlaying?: (event: PlayingEvent) => void;
  /**
   * Emitted when the player is ready for immediate playback, because initial audio/video
   * has been downloaded.
   */
  onReady?: (event: ReadyEvent) => void;
  /**
   * Event emitted when the player is about to seek to a new position.
   * Only applies to VoD streams.
   */
  onSeek?: (event: SeekEvent) => void;
  /**
   * Event emitted when seeking has finished and data to continue playback is available.
   * Only applies to VoD streams.
   */
  onSeeked?: (event: SeekedEvent) => void;
  /**
   * Event mitted when the player starts time shifting.
   * Only applies to live streams.
   */
  onTimeShift?: (event: TimeShiftEvent) => void;
  /**
   * Event emitted when time shifting has finished and data is available to continue playback.
   * Only applies to live streams.
   */
  onTimeShifted?: (event: TimeShiftedEvent) => void;
  /**
   * Event emitted when the player begins to stall and to buffer due to an empty buffer.
   */
  onStallStarted?: (event: StallStartedEvent) => void;
  /**
   * Event emitted when the player ends stalling, due to enough data in the buffer.
   */
  onStallEnded?: (event: StallEndedEvent) => void;
  /**
   * Event emitted when a source error occurred.
   */
  onSourceError?: (event: SourceErrorEvent) => void;
  /**
   * Event emitted when a new source loading has started.
   */
  onSourceLoad?: (event: SourceLoadEvent) => void;
  /**
   * Event emitted when a new source is loaded.
   * This does not mean that the source is immediately ready for playback.
   * `ReadyEvent` indicates the player is ready for immediate playback.
   */
  onSourceLoaded?: (event: SourceLoadedEvent) => void;
  /**
   * Event emitted when the current source has been unloaded.
   */
  onSourceUnloaded?: (event: SourceUnloadedEvent) => void;
  /**
   * Event emitted when a source warning occurred.
   */
  onSourceWarning?: (event: SourceWarningEvent) => void;
  /**
   * Event emitted when a new audio track is added to the player.
   */
  onAudioAdded?: (event: AudioAddedEvent) => void;
  /**
   * Event emitted when the player's selected audio track has changed.
   */
  onAudioChanged?: (event: AudioChangedEvent) => void;
  /**
   * Event emitted when an audio track is removed from the player.
   */
  onAudioRemoved?: (event: AudioRemovedEvent) => void;
  /**
   * Event emitted when a new subtitle track is added to the player.
   */
  onSubtitleAdded?: (event: SubtitleAddedEvent) => void;
  /**
   * Event emitted when the player's selected subtitle track has changed.
   */
  onSubtitleChanged?: (event: SubtitleChangedEvent) => void;
  /**
   * Event emitted when a subtitle track is removed from the player.
   */
  onSubtitleRemoved?: (event: SubtitleRemovedEvent) => void;
  /**
   * Event emitted when the current playback time has changed.
   */
  onTimeChanged?: (event: TimeChangedEvent) => void;
  /**
   * Emitted when the player is unmuted.
   */
  onUnmuted?: (event: UnmutedEvent) => void;
  /**
   * Emitted when current video download quality has changed.
   */
  onVideoDownloadQualityChanged?: (
    event: VideoDownloadQualityChangedEvent
  ) => void;
  /**
   * Emitted when the current video playback quality has changed.
   */
  onVideoPlaybackQualityChanged?: (
    event: VideoPlaybackQualityChangedEvent
  ) => void;
};
