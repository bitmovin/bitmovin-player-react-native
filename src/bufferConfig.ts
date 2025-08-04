/**
 * Configures buffer target levels for different MediaTypes.
 */
export interface BufferMediaTypeConfig {
  /**
   * The amount of data in seconds the player tries to buffer in advance.
   *
   * iOS and tvOS, only: If set to `0`, the player will choose an appropriate forward buffer duration suitable
   * for most use-cases.
   *
   * Default value is `0` on iOS and tvOS, `50` on Android
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
   * @remarks Platform: Android
   */
  restartThreshold?: number;
  /**
   * Amount of seconds the player buffers before playback starts. This value is restricted to the
   * maximum value of the buffer minus 0.5 seconds.
   *
   * Default is `2.5` seconds.
   *
   * @remarks Platform: Android
   */
  startupThreshold?: number;
}
