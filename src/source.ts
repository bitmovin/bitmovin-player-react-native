/**
 * Types of media that can be handled by the player.
 */
export enum SourceType {
  /**
   * Indicates a missing source type.
   */
  NONE = 'none',
  /**
   * Indicates media type HLS.
   */
  HLS = 'hls',
  /**
   * Indicates media type DASH.
   */
  DASH = 'dash',
  /**
   * Indicates media type Progressive MP4.
   */
  PROGRESSIVE = 'progressive',
}

/**
 * The different loading states a `Source` instance can be in.
 */
export enum LoadingState {
  /**
   * The source is unloaded.
   */
  UNLOADED = 0,
  /**
   * The source is currently loading.
   */
  LOADING = 1,
  /**
   * The source is loaded.
   */
  LOADED = 2,
}

/**
 * Represents a source configuration that be loaded into a player instance.
 */
export interface SourceConfig {
  /**
   *  The url for this source configuration.
   */
  url: string;
  /**
   * The `SourceType` for this configuration.
   */
  type?: SourceType;
  /**
   * The URL to a preview image displayed until the video starts.
   */
  poster?: string;
}

/**
 * Represents audio and video content that can be loaded into a player.
 */
export interface Source {
  /**
   * The duration of the source in seconds if it’s a VoD or `INFINITY` if it’s a live stream.
   * Default value is `0` if the duration is not available or not known.
   */
  duration: number;
  /**
   * Whether the source is currently active in a player (i.e. playing back or paused).
   * Only one source can be active in the same player instance at any time.
   */
  isActive: boolean;
  /**
   * Whether the source is currently attached to a player instance.
   */
  isAttachedToPlayer: boolean;
  /**
   * Metadata for the currently loaded source.
   * Setting the metadata value for a source is not supported yet.
   */
  metadata?: Record<string, any>;
  /**
   * The current `LoadingState` of the source.
   */
  loadingState?: LoadingState;
}
