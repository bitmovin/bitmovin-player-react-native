import { SubtitleTrack } from './subtitleTrack';

/**
 * Base event type for all events.
 */
export interface Event {
  /**
   * This event name as it is on the native side.
   */
  name: string;
  /**
   * The UNIX timestamp in which this event happened.
   */
  timestamp: number;
}

/**
 * Base event type for error and warning events.
 */
export interface ErrorEvent extends Event {
  /**
   * Error/Warning's code number.
   */
  code?: number;
  /**
   * Error/Warning's localized message.
   */
  message: string;
  /**
   * Underlying data emitted with the Error/Warning.
   */
  data?: Record<string, any>;
}

/**
 * Emitted when a source is loaded into the player.
 * Seeking and time shifting are allowed as soon as this event is seen.
 */
export interface PlayerActiveEvent extends Event {}

/**
 * Emitted when a player error happens.
 */
export interface PlayerErrorEvent extends ErrorEvent {}

/**
 * Emitted when a player warning happens.
 */
export interface PlayerWarningEvent extends ErrorEvent {}

/**
 * Emitted when the player is destroyed.
 */
export interface DestroyEvent extends Event {}

/**
 * Emitted when the player is muted.
 */
export interface MutedEvent extends Event {}

/**
 * Emitted when the player is unmuted.
 */
export interface UnmutedEvent extends Event {}

/**
 * Emitted when the player is ready for immediate playback, because initial audio/video
 * has been downloaded.
 */
export interface ReadyEvent extends Event {}

/**
 * Emitted when the player is paused.
 */
export interface PausedEvent extends Event {
  /**
   * The player's playback time from when this event happened.
   */
  time: number;
}

/**
 * Emitted when the player received an intention to start/resume playback.
 */
export interface PlayEvent extends Event {
  /**
   * The player's playback time from when this event happened.
   */
  time: number;
}

/**
 * Emitted when playback has started.
 */
export interface PlayingEvent extends Event {
  /**
   * The player's playback time from when this event happened.
   */
  time: number;
}

/**
 * Emitted when the playback of the current media has finished.
 */
export interface PlaybackFinishedEvent extends Event {}

/**
 * Source object representation the way it appears on `Event` payloads such as `SeekEvent`, for example.
 *
 * This interface only type hints what should be the shape of a `Source` object inside an `Event`'s
 * payload during runtime so it has no direct relation with the `Source` class present in `src/source.ts`.
 *
 * Do not mistake it for a `NativeInstance` type.
 */
export interface EventSource {
  /**
   * Event's source duration in seconds.
   */
  duration: number;
  /**
   * Whether this event's source is currently active in a player.
   */
  isActive: boolean;
  /**
   * Whether this event's source is currently attached to a player instance.
   */
  isAttachedToPlayer: boolean;
  /**
   * Metadata for this event's source.
   */
  metadata?: Record<string, any>;
}

/**
 * Emitted when the player is about to seek to a new position.
 * Only applies to VoD streams.
 */
export interface SeekEvent extends Event {
  /**
   * Removed source metadata.
   */
  from: {
    time: number;
    source: EventSource;
  };
  /**
   * Added source metadata.
   */
  to: {
    time: number;
    source: EventSource;
  };
}

/**
 * Emitted when seeking has finished and data to continue playback is available.
 * Only applies to VoD streams.
 */
export interface SeekedEvent extends Event {}

/**
 * Emitted when the current playback time has changed.
 */
export interface TimeChangedEvent extends Event {
  /**
   * The player's playback time from when this event happened.
   */
  currentTime: number;
}

/**
 * Emitted when a new source loading has started.
 * It doesn't mean that the loading of the new manifest has finished.
 */
export interface SourceLoadEvent extends Event {
  /**
   * Source that is about to load.
   */
  source: EventSource;
}

/**
 * Emitted when a new source is loaded.
 * It doesn't mean that the loading of the new manifest has finished.
 */
export interface SourceLoadedEvent extends Event {
  /**
   * Source that was loaded into player.
   */
  source: EventSource;
}

/**
 * Emitted when the current source has been unloaded.
 */
export interface SourceUnloadedEvent extends Event {
  /**
   * Source that was unloaded from player.
   */
  source: EventSource;
}

/**
 * Emitted when a source error happens.
 */
export interface SourceErrorEvent extends ErrorEvent {}

/**
 * Emitted when a source warning happens.
 */
export interface SourceWarningEvent extends ErrorEvent {}

/**
 * Emitted when a new subtitle track is added to the player.
 */
export interface SubtitleAddedEvent extends Event {
  /**
   * Subtitle track that has been added.
   */
  subtitleTrack: SubtitleTrack;
}

/**
 * Emitted when a subtitle track is removed from the player.
 */
export interface SubtitleRemovedEvent extends Event {
  /**
   * Subtitle track that has been removed.
   */
  subtitleTrack: SubtitleTrack;
}

/**
 * Emitted when the player's selected subtitle track has changed.
 */
export interface SubtitleChangedEvent extends Event {
  /**
   * Subtitle track that was previously selected.
   */
  oldSubtitleTrack: SubtitleTrack;
  /**
   * Subtitle track that is selected now.
   */
  newSubtitleTrack: SubtitleTrack;
}

/**
 * Emitted when the player enters Picture-In-Picture mode.
 */
export interface PictureInPictureEnterEvent extends Event {}

/**
 * Emitted when the player exits Picture-In-Picture mode.
 */
export interface PictureInPictureExitEvent extends Event {}
