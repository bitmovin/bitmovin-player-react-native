import { PictureInPictureConfig } from './pictureInPictureConfig';

/**
 * Configures the visual presentation and behaviour of the `PlayerView`.
 */
export interface PlayerViewConfig {
  /**
   * Configures the visual presentation and behaviour of the Bitmovin Player UI.
   * A {@link WebUiConfig} can be used to configure the default Bitmovin Player Web UI.
   *
   * Default is {@link WebUiConfig}.
   *
   * Limitations:
   * Configuring the `uiConfig` only has an effect if the {@link StyleConfig.userInterfaceType} is set to {@link UserInterfaceType.Bitmovin}.
   */
  uiConfig?: UiConfig;

  /**
   * Provides options to configure Picture in Picture playback.
   */
  pictureInPictureConfig?: PictureInPictureConfig;

  /**
   * When set to `true`, the first frame of the main content will not be rendered before playback starts. Default is `false`.
   * This configuration has no effect for the {@link UserInterfaceType.Subtitle} on iOS/tvOS.
   *
   * To reliably hide the first frame before a pre-roll ad, please ensure that you are using the {@link AdvertisingConfig} to schedule ads and not the {@link Player.scheduleAd} API call.
   */
  hideFirstFrame?: boolean;
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
