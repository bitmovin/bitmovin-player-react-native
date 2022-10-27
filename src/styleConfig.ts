/**
 * Contains config values which can be used to alter the visual presentation and behaviour of the player UI.
 */
export interface StyleConfig {
  /**
   * Sets if the UI should be enabled or not. Default value is true.
   * @example
   * ```
   * const player = new Player({
   *   styleConfig: {
   *     isUiEnabled: false,
   *   },
   * });
   * ```
   */
  isUiEnabled: boolean;
  /**
   * iOS/tvOS only.
   *
   * Set which user interface type should be used.
   * Default value is UserInterfaceType.bitmovin on iOS and UserInterfaceType.system on tvOS.
   * This setting only applies if StyleConfig#isUiEnabled is set to true.
   * @example
   * ```
   * const player = new Player({
   *   styleConfig: {
   *     isUiEnabled: false,
   *     userInterfaceType: UserInterfaceType.subtitle,
   *   },
   * });
   * ```
   */
  userInterfaceType?: UserInterfaceType;
}

/**
 * Indicates which type of UI should be used.
 */
export enum UserInterfaceType {
  /**
   * Indicates that Bitmovin’s customizable UI should be used.
   */
  bitmovin = 'bitmovin',
  /**
   * Indicates that the system UI should be used.
   */
  system = 'system',
  /**
   * Indicates that only subtitles should be displayed along with the video content
   */
  subtitle = 'subtitle',
}
