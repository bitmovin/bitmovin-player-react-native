/**
 * Configures the adaptation logic.
 */
export interface AdaptationConfig {
  /**
   * The upper bitrate boundary in bits per second for approximate network bandwidth consumption of the played source.
   * Can be set to `undefined` for no limitation.
   */
  maxSelectableBitrate?: number;

  /**
   * The initial bandwidth estimate in bits per second the player uses to select the optimal media tracks before actual bandwidth data is available. Overriding this value should only be done in specific cases and will most of the time not result in better selection logic.
   *
   * @platform Android
   * @see https://cdn.bitmovin.com/player/android/3/docs/player-core/com.bitmovin.player.api.media/-adaptation-config/initial-bandwidth-estimate-override.html?query=var%20initialBandwidthEstimateOverride:%20Long?
   */
  initialBandwidthEstimateOverride?: number;
}
