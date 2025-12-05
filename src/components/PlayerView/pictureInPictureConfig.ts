/**
 * Provides options to configure Picture in Picture playback.
 */
export interface PictureInPictureConfig {
  /**
   * Whether Picture in Picture feature is enabled or not.
   *
   * Default is `false`.
   */
  isEnabled?: boolean;

  /**
   * Defines whether Picture in Picture should start automatically when the app transitions to background.
   *
   * Does not have any affect when Picture in Picture is disabled.
   *
   * Default is `false`.
   *
   * On Android, this requests Picture in Picture as soon as the host activity is backgrounded.
   *
   * @platform iOS 14.2+, Android 8.0+
   */
  shouldEnterOnBackground?: boolean;
}
