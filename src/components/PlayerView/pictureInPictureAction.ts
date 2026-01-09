export enum PictureInPictureAction {
  /**
   * Picture in Picture window shows Play/Pause button depending on the player state.
   * 
   * @remarks In iOS, when using the {@link UserInterfaceType.system}, this property is only supported on iOS 17 and above.
   */
  TogglePlayback = 'TogglePlayback',
  /**
   * Picture in Picture window shows seek forward and seek backward buttons.
   * The player seeks by 10s when the buttons are pressed.
   */
  Seek = 'Seek',
}
