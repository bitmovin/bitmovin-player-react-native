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
 * Emitted when the player is about to seek to a new position.
 * Only applies to VoD streams.
 */
export interface SeekEvent extends Event {
  /**
   * Removed source metadata.
   */
  from: {
    time: number;
    source: {
      duration: number;
      isActive: boolean;
      isAttachedToPlayer: boolean;
      metadata?: Record<string, any>;
    };
  };
  /**
   * Added source metadata.
   */
  to: {
    time: number;
    source: {
      duration: number;
      isActive: boolean;
      isAttachedToPlayer: boolean;
      metadata?: Record<string, any>;
    };
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
  source: {
    duration: number;
    isActive: boolean;
    isAttachedToPlayer: boolean;
    metadata?: Record<string, any>;
  };
}

/**
 * Emitted when a new source is loaded.
 * It doesn't mean that the loading of the new manifest has finished.
 */
export interface SourceLoadedEvent extends Event {
  /**
   * Source that was loaded into player.
   */
  source: {
    duration: number;
    isActive: boolean;
    isAttachedToPlayer: boolean;
    metadata?: Record<string, any>;
  };
}

/**
 * Emitted when the current source has been unloaded.
 */
export interface SourceUnloadedEvent extends Event {
  /**
   * Source that was unloaded from player.
   */
  source: {
    duration: number;
    isActive: boolean;
    isAttachedToPlayer: boolean;
    metadata?: Record<string, any>;
  };
}

/**
 * Emitted when a source error happens.
 */
export interface SourceErrorEvent extends ErrorEvent {}

/**
 * Emitted when a source warning happens.
 */
export interface SourceWarningEvent extends ErrorEvent {}
