/**
 * Configures the media control information for the application. This information will be displayed
 * wherever current media information typically appears, such as the lock screen, in notifications, and
 * and inside the control center.
 */
export interface MediaControlConfig {
  /**
   * Enable the default behavior of displaying media information
   * on the lock screen, in notifications, and within the control center.
   *
   * Default is `false`.
   *
   * For a detailed list of the supported features in the **default behavior**,
   * check the **Default Supported Features** section.
   *
   * @note Enabling this flag will automatically treat {@link TweaksConfig.updatesNowPlayingInfoCenter} as `false`.
   *
   * ## Limitations
   * ---
   * - At the moment, the current media information is disabled during casting.
   *
   * ## Known Issues
   * ---
   * **iOS**:
   * - There is unexpected behavior when using the IMA SDK. The Google IMA SDK adds its own commands
   *   for play/pause as soon as the ad starts loading (not when it starts playing). Within this window
   *   (approximately around 10 seconds), it is possible that both the ad and the main content are playing
   *   at the same time when a user interacts with the media control feature.
   *
   * ## Default Supported Features
   * ---
   * Here is the list of features supported by the default behavior.
   *
   * ### Populated Metadata
   * - media type (to visualize the correct kind of data — _e.g. a waveform for audio files_)
   * - title
   * - artwork
   * - elapsed time
   * - duration
   *
   * **Android-only**
   * - source description
   *
   * **iOS-only**
   * - live or VOD status
   * - playback rate
   * - default playback rate
   *
   * ### Registered Commands
   * - toggle play/pause
   * - change playback position
   *
   * **iOS-only**
   * - skip forward
   * - skip backward
   */
  isEnabled?: boolean;
}
