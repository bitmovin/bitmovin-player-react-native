import type {
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
  AudioAddedEvent,
  AudioChangedEvent,
  AudioRemovedEvent,
  CastAvailableEvent,
  CastPausedEvent,
  CastPlaybackFinishedEvent,
  CastPlayingEvent,
  CastStartedEvent,
  CastStartEvent,
  CastStoppedEvent,
  CastTimeUpdatedEvent,
  CastWaitingForDeviceEvent,
  CueEnterEvent,
  CueExitEvent,
  DestroyEvent,
  DownloadFinishedEvent,
  MetadataEvent,
  MetadataParsedEvent,
  MutedEvent,
  NonLinearAdFinishedEvent,
  NonLinearAdSkippedEvent,
  NonLinearAdStartedEvent,
  PausedEvent,
  PlaybackFinishedEvent,
  PlaybackSpeedChangedEvent,
  PlayerActiveEvent,
  PlayerErrorEvent,
  PlayerInactiveEvent,
  PlayerWarningEvent,
  PlayEvent,
  PlayingEvent,
  PlaylistTransitionEvent,
  ReadyEvent,
  SeekedEvent,
  SeekEvent,
  SourceAddedEvent,
  SourceErrorEvent,
  SourceLoadedEvent,
  SourceLoadEvent,
  SourceRemovedEvent,
  SourceUnloadedEvent,
  SourceWarningEvent,
  StallEndedEvent,
  StallStartedEvent,
  SubtitleAddedEvent,
  SubtitleChangedEvent,
  SubtitleRemovedEvent,
  TimeChangedEvent,
  TimeShiftedEvent,
  TimeShiftEvent,
  UnmutedEvent,
  VideoDownloadQualityChangedEvent,
  VideoPlaybackQualityChangedEvent,
} from './events';

/**
 * All events a {@link Source} emits, keyed by event name.
 * Used with {@link Source.on} and {@link Source.off}.
 */
export interface SourceEventMap {
  /** Emitted when the source starts loading. */
  sourceLoad: SourceLoadEvent;
  /** Emitted when the source has been loaded. */
  sourceLoaded: SourceLoadedEvent;
  /** Emitted when the source has been unloaded. */
  sourceUnloaded: SourceUnloadedEvent;
  /** Emitted when a source error occurred. */
  sourceError: SourceErrorEvent;
  /** Emitted when a source warning occurred. */
  sourceWarning: SourceWarningEvent;
  /** Emitted when a new audio track has been added. */
  audioAdded: AudioAddedEvent;
  /** Emitted when the selected audio track has changed. */
  audioChanged: AudioChangedEvent;
  /** Emitted when an audio track has been removed. */
  audioRemoved: AudioRemovedEvent;
  /** Emitted when a new subtitle track has been added. */
  subtitleAdded: SubtitleAddedEvent;
  /** Emitted when the selected subtitle track has changed. */
  subtitleChanged: SubtitleChangedEvent;
  /** Emitted when a subtitle track has been removed. */
  subtitleRemoved: SubtitleRemovedEvent;
  /** Emitted when a download has finished. */
  downloadFinished: DownloadFinishedEvent;
  /** Emitted when the video download quality has changed. */
  videoDownloadQualityChanged: VideoDownloadQualityChangedEvent;
  /** Emitted when metadata is first seen and parsed. */
  metadataParsed: MetadataParsedEvent;
}

/**
 * All events a {@link Player} emits, keyed by event name.
 * Used with {@link Player.on} and {@link Player.off}.
 *
 * Includes the {@link SourceEventMap} events of the active source, and `sourceError` of inactive sources.
 */
export interface PlayerEventMap extends SourceEventMap {
  /**
   * Emitted when a playback session was started. This event is emitted immediately after the
   * {@link Player.load} call and does not wait for actual data to be loaded.
   */
  playerActive: PlayerActiveEvent;
  /** Emitted when the active playback session was stopped via {@link Player.unload}. */
  playerInactive: PlayerInactiveEvent;
  /** Emitted when a player error occurred. */
  playerError: PlayerErrorEvent;
  /** Emitted when a player warning occurred. */
  playerWarning: PlayerWarningEvent;
  /** Emitted when the player is destroyed. */
  destroy: DestroyEvent;
  /** Emitted when the player has been muted. */
  muted: MutedEvent;
  /** Emitted when the player has been unmuted. */
  unmuted: UnmutedEvent;
  /** Emitted when the player is ready for immediate playback. */
  ready: ReadyEvent;
  /** Emitted when the player has been paused. */
  paused: PausedEvent;
  /** Emitted when the player received an intention to start or resume playback. */
  play: PlayEvent;
  /** Emitted when playback has started. */
  playing: PlayingEvent;
  /** Emitted when the playback of the current media has finished. */
  playbackFinished: PlaybackFinishedEvent;
  /** Emitted when the playback speed changes. */
  playbackSpeedChanged: PlaybackSpeedChangedEvent;
  /** Emitted when the player is about to seek. */
  seek: SeekEvent;
  /** Emitted when seeking has finished. */
  seeked: SeekedEvent;
  /** Emitted when the player starts time shifting. */
  timeShift: TimeShiftEvent;
  /** Emitted when time shifting has finished. */
  timeShifted: TimeShiftedEvent;
  /** Emitted when the player begins to stall due to an empty buffer. */
  stallStarted: StallStartedEvent;
  /** Emitted when the player stops stalling. */
  stallEnded: StallEndedEvent;
  /** Emitted when the current playback time has changed. */
  timeChanged: TimeChangedEvent;
  /** Emitted when a source has been added to the playback session. */
  sourceAdded: SourceAddedEvent;
  /** Emitted when a source has been removed from the playback session. */
  sourceRemoved: SourceRemovedEvent;
  /** Emitted when the player transitions between two sources of a playlist. */
  playlistTransition: PlaylistTransitionEvent;
  /** Emitted when an ad break has finished. */
  adBreakFinished: AdBreakFinishedEvent;
  /** Emitted when an ad break has started. */
  adBreakStarted: AdBreakStartedEvent;
  /** Emitted when an ad has been clicked. */
  adClicked: AdClickedEvent;
  /** Emitted when an ad error occurred. */
  adError: AdErrorEvent;
  /** Emitted when an ad has finished. */
  adFinished: AdFinishedEvent;
  /** Emitted when an ad manifest starts loading. */
  adManifestLoad: AdManifestLoadEvent;
  /** Emitted when an ad manifest has been loaded. */
  adManifestLoaded: AdManifestLoadedEvent;
  /** Emitted when an ad quartile has been reached. */
  adQuartile: AdQuartileEvent;
  /** Emitted when an ad has been scheduled. */
  adScheduled: AdScheduledEvent;
  /** Emitted when an ad has been skipped. */
  adSkipped: AdSkippedEvent;
  /** Emitted when an ad has started. */
  adStarted: AdStartedEvent;
  /**
   * Emitted when a non-linear ad has started.
   *
   * @experimental
   */
  nonLinearAdStarted: NonLinearAdStartedEvent;
  /**
   * Emitted when a non-linear ad has been skipped.
   *
   * @experimental
   */
  nonLinearAdSkipped: NonLinearAdSkippedEvent;
  /**
   * Emitted when a non-linear ad has finished.
   *
   * @experimental
   */
  nonLinearAdFinished: NonLinearAdFinishedEvent;
  /** Emitted when the video playback quality has changed. */
  videoPlaybackQualityChanged: VideoPlaybackQualityChangedEvent;
  /** Emitted when casting to a cast-compatible device is available. */
  castAvailable: CastAvailableEvent;
  /** Emitted when the playback on a cast-compatible device has been paused. */
  castPaused: CastPausedEvent;
  /** Emitted when the playback on a cast-compatible device has finished. */
  castPlaybackFinished: CastPlaybackFinishedEvent;
  /** Emitted when the playback on a cast-compatible device has started. */
  castPlaying: CastPlayingEvent;
  /** Emitted when the cast app has been launched successfully. */
  castStarted: CastStartedEvent;
  /** Emitted when casting has been initiated. */
  castStart: CastStartEvent;
  /** Emitted when casting has been stopped. */
  castStopped: CastStoppedEvent;
  /** Emitted when a time update from the cast-compatible device is received. */
  castTimeUpdated: CastTimeUpdatedEvent;
  /** Emitted when the player waits for the chosen cast-compatible device to get ready. */
  castWaitingForDevice: CastWaitingForDeviceEvent;
  /** Emitted when a subtitle cue becomes active. */
  cueEnter: CueEnterEvent;
  /** Emitted when an active subtitle cue becomes inactive. */
  cueExit: CueExitEvent;
  /** Emitted when metadata is encountered during playback. */
  metadata: MetadataEvent;
}

/**
 * A subscription returned by `on` that removes the registered listener.
 */
export interface BitmovinEventSubscription {
  /**
   * Removes the listener. Calling it more than once has no effect.
   */
  remove(): void;
}
