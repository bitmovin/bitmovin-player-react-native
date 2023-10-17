/**
 * Represents different types of media.
 */
export enum MediaType {
  /**
   * Combined audio and video media type.
   */
  MEDIATYPE_AUDIO_AND_VIDEO = 0, //TODO: Android has 2 enum values: Audio, Video
}

/**
 * Represents different types of buffered data.
 */
export enum BufferType {
  /**
   * Represents the buffered data starting at the current playback time.
   */
  FORWARD_DURATION = 0,
  /**
   * Represents the buffered data up until the current playback time.
   */
  BACKWARD_DURATION = 1,
}

/**
 * Holds different information about the buffer levels.
 */
export interface BufferLevel {
  /**
   * The amount of currently buffered data, e.g. audio or video buffer level.
   */
  level?: number;
  /**
   * The target buffer level the player tries to maintain.
   */
  targetLevel?: number;
  /**
   * The media type the buffer data applies to.
   */
  media?: MediaType;
  /**
   * The buffer type the buffer data applies to.
   */
  type?: BufferType;
}

/**
 * Provides the means to configure buffer settings and to query the current buffer state.
 * Accessible through Player.buffer.
 */
export interface BufferApi {
  /**
   * Returns the {@link BufferLevel} for the chosen {@link BufferType|buffer type} and {@link MediaType|media type} of the active Source.
   * @param type The type of buffer to return the level for.
   * @param media TODO: android only
   * @returns a {@link BufferLevel} where {@link BufferLevel.level} and {@link BufferLevel.targetLevel} is `0.0` if there is no active playback session.
   */
  getLevel: (type: BufferType, media: MediaType) => BufferLevel;
  /**
   * Sets the target buffer level for the chosen buffer type across all {@link MediaType|MediaTypes}.
   * @param type TODO: android only
   * @param value The value to set.
   */
  setTargetLevel: (type: BufferType, value: number) => void;
}
