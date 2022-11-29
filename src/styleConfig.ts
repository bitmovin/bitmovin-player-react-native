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
  isUiEnabled?: boolean;
  /**
   * Set the CSS file that will be used for the UI. The default CSS file will be completely replaced by the CSS file set with this property.
   * @example
   * ```
   * const player = new Player({
   *   styleConfig: {
   *     playerUiCss: 'https://domain.tld/path/to/bitmovinplayer-ui.css',
   *   },
   * });
   * ```
   */
  playerUiCss?: string;
  /**
   * Set a CSS file which contains supplemental styles for the player UI. These styles will be added to the default CSS file or the CSS file set with StyleConfig#playerUiCss.
   * @example
   * ```
   * const player = new Player({
   *   styleConfig: {
   *     playerUiCss: 'https://domain.tld/path/to/bitmovinplayer-supplemental-ui.css',
   *   },
   * });
   * ```
   */
  supplementalPlayerUiCss?: string;
  /**
   * Sets the JS file that will be used for the UI. The default JS file will be completely replaced by the JS file set with this property.
   * @example
   * ```
   * const player = new Player({
   *   styleConfig: {
   *     playerUiJs: 'https://domain.tld/path/to/bitmovinplayer-ui.js',
   *   },
   * });
   * ```
   */
  playerUiJs?: string;
  /**
   * Determines how the video content is scaled or stretched within the parent container’s bounds.  Possible values are defined in ScalingMode.
   * Default value is ScalingMode.fit.
   * @example
   * ```
   * const player = new Player({
   *   styleConfig: {
   *     scalingMode: ScalingMode.Zoom,
   *   },
   * });
   * ```
   */
  scalingMode?: ScalingMode;
}

/**
 * Specifies how the video content is scaled or stretched.
 */
export enum ScalingMode {
  /**
   * Specifies that the player should preserve the video’s aspect ratio and fit the video within the container's bounds.
   */
  Fit = 'Fit',
  /**
   * Specifies that the video should be stretched to fill the container’s bounds. The aspect ratio may not be preserved.
   */
  Stretch = 'Stretch',
  /**
   * Specifies that the player should preserve the video’s aspect ratio and fill the container’s bounds.
   */
  Zoom = 'Zoom',
}
