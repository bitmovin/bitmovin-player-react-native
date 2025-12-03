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
