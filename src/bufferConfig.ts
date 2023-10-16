/** Represents different types of media. */
export enum MediaType {
  /** Combined audio and video media type. */
  MEDIATYPE_AUDIO_AND_VIDEO,
}

/** Represents different types of buffered data. */
export enum BufferType {
  /** Represents the buffered data starting at the current playback time. */
  FORWARD_DURATION,
  /** Represents the buffered data up until the current playback time. */
  BACKWARD_DURATION,
}

/** Holds different information about the buffer levels. */
export interface BufferLevel {
  /** The amount of currently buffered data, e.g. audio or video buffer level. */
  level?: number;
  /** The target buffer level the player tries to maintain. */
  targetLevel?: number;
  /** The media type the buffer data applies to. */
  media?: MediaType;
  /** The buffer type the buffer data applies to. */
  type?: BufferType;
}

/**
 * Configures buffer target levels for different MediaTypes.
 */
export interface BufferMediaTypeConfig {
  /**
   * The amount of data in seconds the player tries to buffer in advance. If set to 0, the player will
   * choose an appropriate forward buffer duration suitable for most use-cases.
   *
   * Default value is `0`.
   *
   * TODO: update docs here
   */
  forwardDuration?: number;
}

/**
 * Player buffer config object to configure buffering behavior.
 */
export interface BufferConfig {
  /**
   * Configures various settings for the audio and video buffer.
   */
  audioAndVideo?: BufferMediaTypeConfig;
  /**
   * Amount of seconds the player buffers before playback starts again after a stall. This value is
   * restricted to the maximum value of the buffer minus 0.5 seconds.
   *
   * Default is `5` seconds.
   *
   * @platform Android
   */
  restartThreshold?: number;
  /**
   * Amount of seconds the player buffers before playback starts. This value is restricted to the
   * maximum value of the buffer minus 0.5 seconds.
   *
   * Default is `2.5` seconds.
   *
   * @platform Android
   */
  startupThreshold?: number;
}
