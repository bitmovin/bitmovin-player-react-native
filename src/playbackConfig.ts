/**
 * Configures the playback behaviour of the player.
 */
export interface PlaybackConfig {
  /**
   * Whether the player starts playing automatically after loading a source or not. Default is `false`.
   * @example
   * ```
   * const player = new Player({
   *   playbackConfig: {
   *     isAutoplayEnabled: true,
   *   },
   * });
   * ```
   */
  isAutoplayEnabled?: boolean;
  /**
   * Whether the sound is muted on startup or not. Default value is `false`.
   * @example
   * ```
   * const player = new Player({
   *   playbackConfig: {
   *     isMuted: true,
   *   },
   * });
   * ```
   */
  isMuted?: boolean;
  /**
   * Whether time shift / DVR for live streams is enabled or not. Default is `true`.
   *  @example
   * ```
   * const player = new Player({
   *   playbackConfig: {
   *     isTimeShiftEnabled: false,
   *   },
   * });
   * ```
   */
  isTimeShiftEnabled?: boolean;
  /**
   * Whether background playback is enabled or not.
   * Default is `false`.
   *
   * When set to `true`, playback is not automatically paused
   * anymore when the app moves to the background.
   * When set to `true`, also make sure to properly configure your app to allow
   * background playback.
   *
   * On tvOS, background playback is only supported for audio-only content.
   *
   * Default is `false`.
   *
   *  @example
   * ```
   * const player = new Player({
   *   {
   *     isBackgroundPlaybackEnabled: true,
   *   }
   * })
   * ```
   * @platform iOS, tvOS
   */
  isBackgroundPlaybackEnabled?: boolean;
  /**
   * Whether the Picture in Picture mode option is enabled or not. Default is `false`.
   *  @example
   * ```
   * const player = new Player({
   *   playbackConfig: {
   *     isPictureInPictureEnabled: true,
   *   },
   * });
   * ```
   * @deprecated Use {@link PictureInPictureConfig.isEnabled} instead.
   */
  isPictureInPictureEnabled?: boolean;
}
