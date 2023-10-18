/**
 * Configures the visual presentation and behaviour of the `PlayerView`.
 */
export interface PlayerViewConfig {
  /**
   * Configures the visual presentation and behaviour of the Bitmovin Player UI.
   * A `WebUiConfig` can be used to configure the default Bitmovin Player Web UI.
   *
   * Default is [`WebUiConfig`].
   *
   * Limitations:
   * Configuring the `uiConfig` only has effect if the `StyleConfig.userInterfaceType` is set to `Bitmovin`.
   */
  uiConfig: UiConfig;
}
/**
 * Configures the visual presentation and behaviour of the Bitmovin Player UI.
 */
export interface UiConfig {}
/**
 * Configures the visual presentation and behaviour of the Bitmovin Web UI.
 */
export interface WebUiConfig extends UiConfig {
  /**
   * Whether the Bitmovin Web UI will show playback speed selection options in the settings menu.
   * Default is `true`.
   */
  playbackSpeedSelectionEnabled?: boolean;
}
