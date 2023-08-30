/**
 * Configures the adaptation logic.
 */
export interface AdaptationConfig {
  /**
   * The upper bitrate boundary in bits per second for network bandwidth consumption of the played source.
   * Can be set to `undefined` for no limitation.
   */
  maxSelectableBitrate?: number;
}
