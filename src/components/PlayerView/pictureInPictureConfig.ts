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
   * Picture in Picture actions that should be displayed on the Picture in Picture window.
   * To update the Picture in Picture actions use {@link PlayerViewRef.updatePictureInPictureActions}.
   *
   * Limitations:
   * - On Android if an empty list is passed and {@link MediaControlConfig.isEnabled} is set to true
   * play, pause, next, and previous controls will appear, due to the default Android Picture in Picture implementation:
   * https://developer.android.com/develop/ui/views/picture-in-picture#add_controls
   * Set {@link MediaControlConfig.isEnabled} to false if this is
   * not the desired behaviour.
   * - on iOS/tvOS if {@link PictureInPictureAction.TogglePlayback} is not specified also other actions are
   * disabled due to OS limitations.
   *
   * Default value is `undefined`, which translates to:
   * - Android: No actions, unless {@link MediaControlConfig.isEnabled} is set to true
   * - iOS: All actions enabled
   */
  pictureInPictureActions?: PictureInPictureAction[];
}

export enum PictureInPictureAction {
  /**
   * Picture in Picture window shows Play/Pause button depending on the player state.
   */
  TogglePlayback = 'TogglePlayback',
  /**
   * Picture in Picture window shows seek forward and seek backward buttons.
   * The player seeks by 10s when the buttons are pressed.
   */
  Seek = 'Seek',
}
