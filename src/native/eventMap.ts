import type * as Events from '../events';

/**
 * Payloads emitted by a Source and forwarded by its attached Player.
 * @internal
 * @inline
 */
export interface SourceEventMap {
  downloadFinished: Events.DownloadFinishedEvent;
  videoDownloadQualityChanged: Events.VideoDownloadQualityChangedEvent;
  metadataParsed: Events.MetadataParsedEvent;
  sourceError: Events.SourceErrorEvent;
  sourceLoad: Events.SourceLoadEvent;
  sourceLoaded: Events.SourceLoadedEvent;
  sourceUnloaded: Events.SourceUnloadedEvent;
  sourceWarning: Events.SourceWarningEvent;
  audioAdded: Events.AudioAddedEvent;
  audioChanged: Events.AudioChangedEvent;
  audioRemoved: Events.AudioRemovedEvent;
  subtitleAdded: Events.SubtitleAddedEvent;
  subtitleChanged: Events.SubtitleChangedEvent;
  subtitleRemoved: Events.SubtitleRemovedEvent;
  fairplayLicenseAcquired: Events.FairplayLicenseAcquiredEvent;
  event: Events.Event;
}

/**
 * Player payloads, including Source events. View UI events belong to PlayerView.
 * @internal
 * @inline
 */
export interface PlayerEventMap extends SourceEventMap {
  /** @experimental */
  sourceAdded: Events.SourceAddedEvent;
  /** @experimental */
  sourceRemoved: Events.SourceRemovedEvent;
  /** @experimental */
  playlistTransition: Events.PlaylistTransitionEvent;
  adBreakFinished: Events.AdBreakFinishedEvent;
  adBreakStarted: Events.AdBreakStartedEvent;
  adClicked: Events.AdClickedEvent;
  adError: Events.AdErrorEvent;
  adFinished: Events.AdFinishedEvent;
  adManifestLoad: Events.AdManifestLoadEvent;
  adManifestLoaded: Events.AdManifestLoadedEvent;
  adQuartile: Events.AdQuartileEvent;
  adScheduled: Events.AdScheduledEvent;
  adSkipped: Events.AdSkippedEvent;
  adStarted: Events.AdStartedEvent;
  castAvailable: Events.CastAvailableEvent;
  castPaused: Events.CastPausedEvent;
  castPlaybackFinished: Events.CastPlaybackFinishedEvent;
  castPlaying: Events.CastPlayingEvent;
  castStarted: Events.CastStartedEvent;
  castStart: Events.CastStartEvent;
  castStopped: Events.CastStoppedEvent;
  castTimeUpdated: Events.CastTimeUpdatedEvent;
  castWaitingForDevice: Events.CastWaitingForDeviceEvent;
  cueEnter: Events.CueEnterEvent;
  cueExit: Events.CueExitEvent;
  destroy: Events.DestroyEvent;
  metadata: Events.MetadataEvent;
  muted: Events.MutedEvent;
  nonLinearAdStarted: Events.NonLinearAdStartedEvent;
  nonLinearAdSkipped: Events.NonLinearAdSkippedEvent;
  nonLinearAdFinished: Events.NonLinearAdFinishedEvent;
  paused: Events.PausedEvent;
  play: Events.PlayEvent;
  playbackFinished: Events.PlaybackFinishedEvent;
  playbackSpeedChanged: Events.PlaybackSpeedChangedEvent;
  playerActive: Events.PlayerActiveEvent;
  playerInactive: Events.PlayerInactiveEvent;
  playerError: Events.PlayerErrorEvent;
  playerWarning: Events.PlayerWarningEvent;
  playing: Events.PlayingEvent;
  ready: Events.ReadyEvent;
  seek: Events.SeekEvent;
  seeked: Events.SeekedEvent;
  timeShift: Events.TimeShiftEvent;
  timeShifted: Events.TimeShiftedEvent;
  stallStarted: Events.StallStartedEvent;
  stallEnded: Events.StallEndedEvent;
  timeChanged: Events.TimeChangedEvent;
  videoPlaybackQualityChanged: Events.VideoPlaybackQualityChangedEvent;
  unmuted: Events.UnmutedEvent;
}

/**
 * Expo SharedObject event types describe callbacks rather than payloads.
 * @internal
 * @inline
 */
export type EventCallbacks<EventMap> = {
  [Name in keyof EventMap]: (event: EventMap[Name]) => void;
};
