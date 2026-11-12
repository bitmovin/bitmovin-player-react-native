import type {
  AdBreakFinishedEvent,
  AdBreakStartedEvent,
  AdClickedEvent,
  AdErrorEvent,
  AdFinishedEvent,
  AdManifestLoadEvent,
  AdManifestLoadedEvent,
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
  CastStartEvent,
  CastStartedEvent,
  CastStoppedEvent,
  CastTimeUpdatedEvent,
  CastWaitingForDeviceEvent,
  CueEnterEvent,
  CueExitEvent,
  DestroyEvent,
  DownloadFinishedEvent,
  Event,
  FairplayLicenseAcquiredEvent,
  MetadataEvent,
  MetadataParsedEvent,
  MutedEvent,
  NonLinearAdFinishedEvent,
  NonLinearAdSkippedEvent,
  NonLinearAdStartedEvent,
  PausedEvent,
  PlayEvent,
  PlaybackFinishedEvent,
  PlaybackSpeedChangedEvent,
  PlayerActiveEvent,
  PlayerErrorEvent,
  PlayerInactiveEvent,
  PlayerWarningEvent,
  PlayingEvent,
  PlaylistTransitionEvent,
  ReadyEvent,
  SeekEvent,
  SeekedEvent,
  SourceAddedEvent,
  SourceErrorEvent,
  SourceLoadEvent,
  SourceLoadedEvent,
  SourceRemovedEvent,
  SourceUnloadedEvent,
  SourceWarningEvent,
  StallEndedEvent,
  StallStartedEvent,
  SubtitleAddedEvent,
  SubtitleChangedEvent,
  SubtitleRemovedEvent,
  TimeChangedEvent,
  TimeShiftEvent,
  TimeShiftedEvent,
  UnmutedEvent,
  VideoDownloadQualityChangedEvent,
  VideoPlaybackQualityChangedEvent,
} from '../events';

/**
 * Payloads emitted by a Source and forwarded by its attached Player.
 * @internal
 * @inline
 */
export interface SourceEventMap {
  downloadFinished: DownloadFinishedEvent;
  videoDownloadQualityChanged: VideoDownloadQualityChangedEvent;
  metadataParsed: MetadataParsedEvent;
  sourceError: SourceErrorEvent;
  sourceLoad: SourceLoadEvent;
  sourceLoaded: SourceLoadedEvent;
  sourceUnloaded: SourceUnloadedEvent;
  sourceWarning: SourceWarningEvent;
  audioAdded: AudioAddedEvent;
  audioChanged: AudioChangedEvent;
  audioRemoved: AudioRemovedEvent;
  subtitleAdded: SubtitleAddedEvent;
  subtitleChanged: SubtitleChangedEvent;
  subtitleRemoved: SubtitleRemovedEvent;
  fairplayLicenseAcquired: FairplayLicenseAcquiredEvent;
  event: Event;
}

/**
 * Player payloads, including Source events. View UI events belong to PlayerView.
 * @internal
 * @inline
 */
export interface PlayerEventMap extends SourceEventMap {
  /** @experimental */
  sourceAdded: SourceAddedEvent;
  /** @experimental */
  sourceRemoved: SourceRemovedEvent;
  /** @experimental */
  playlistTransition: PlaylistTransitionEvent;
  adBreakFinished: AdBreakFinishedEvent;
  adBreakStarted: AdBreakStartedEvent;
  adClicked: AdClickedEvent;
  adError: AdErrorEvent;
  adFinished: AdFinishedEvent;
  adManifestLoad: AdManifestLoadEvent;
  adManifestLoaded: AdManifestLoadedEvent;
  adQuartile: AdQuartileEvent;
  adScheduled: AdScheduledEvent;
  adSkipped: AdSkippedEvent;
  adStarted: AdStartedEvent;
  castAvailable: CastAvailableEvent;
  castPaused: CastPausedEvent;
  castPlaybackFinished: CastPlaybackFinishedEvent;
  castPlaying: CastPlayingEvent;
  castStarted: CastStartedEvent;
  castStart: CastStartEvent;
  castStopped: CastStoppedEvent;
  castTimeUpdated: CastTimeUpdatedEvent;
  castWaitingForDevice: CastWaitingForDeviceEvent;
  cueEnter: CueEnterEvent;
  cueExit: CueExitEvent;
  destroy: DestroyEvent;
  metadata: MetadataEvent;
  muted: MutedEvent;
  nonLinearAdStarted: NonLinearAdStartedEvent;
  nonLinearAdSkipped: NonLinearAdSkippedEvent;
  nonLinearAdFinished: NonLinearAdFinishedEvent;
  paused: PausedEvent;
  play: PlayEvent;
  playbackFinished: PlaybackFinishedEvent;
  playbackSpeedChanged: PlaybackSpeedChangedEvent;
  playerActive: PlayerActiveEvent;
  playerInactive: PlayerInactiveEvent;
  playerError: PlayerErrorEvent;
  playerWarning: PlayerWarningEvent;
  playing: PlayingEvent;
  ready: ReadyEvent;
  seek: SeekEvent;
  seeked: SeekedEvent;
  timeShift: TimeShiftEvent;
  timeShifted: TimeShiftedEvent;
  stallStarted: StallStartedEvent;
  stallEnded: StallEndedEvent;
  timeChanged: TimeChangedEvent;
  videoPlaybackQualityChanged: VideoPlaybackQualityChangedEvent;
  unmuted: UnmutedEvent;
}

/**
 * Expo SharedObject event types describe callbacks rather than payloads.
 * @internal
 * @inline
 */
export type EventCallbacks<Events> = {
  [Name in keyof Events]: (event: Events[Name]) => void;
};
