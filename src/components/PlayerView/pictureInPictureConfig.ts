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
   * @platform iOS 14.2 and above
   */
  shouldEnterOnBackground?: boolean;

  /**
   * PiP actions that should be displayed on the PiP window.
   * To update the PiP actions use {@link PlayerViewRef.updatePictureInPictureActions}.
   *
   * Limitations:
   * - On Android if an empty list is passed and {@link MediaControlConfig.isEnabled} is set to true
   * play, pause, next, and previous controls will appear, due to the default Android PiP implementation:
   * https://developer.android.com/develop/ui/views/picture-in-picture#add_controls
   * Set {@link MediaControlConfig.isEnabled} to false if this is
   * not the desired behaviour.
   * - on iOS/tvOS if {@link PictureInPictureAction.TogglePlayback} is not specified also other actions are
   * disabled due to OS limitations.
   *
   * Default value is unspecified, which translates to:
   * - Android: No actions, unless {@link MediaControlConfig.isEnabled} is set to true
   * - iOS: All actions enabled
   */
  pictureInPictureActions?: PictureInPictureAction[];
}

export enum PictureInPictureAction {
  /**
   * PiP window shows Play/Pause button depending on the player state.
   */
  TogglePlayback = 'TogglePlayback',
  /**
   * PiP window shows seek forward and seek backward buttons. The player seeks by 10s when the buttons are pressed.
   */
  Seek = 'Seek',
}
