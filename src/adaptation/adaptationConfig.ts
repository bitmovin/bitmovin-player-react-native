import { NativeInstanceConfig } from '../nativeInstance';

/**
 * Can be implemented and added to the AdaptationConfig to customize the video adaptation logic.
 *
 * @platform Android
 */
export interface VideoAdaptation {
  /**
   * Is called before the next video segment is downloaded. The quality according to VideoQuality.id that is returned will be downloaded next. Invalid IDs or null will result in a fallback to the ID provided in data.
   *
   * @platform Android
   * @see https://cdn.bitmovin.com/player/android/3/docs/player-core/com.bitmovin.player.api.media.video.quality/-video-adaptation/on-video-adaptation.html
   */
  onVideoAdaptation?: (data: VideoAdaptationData) => Promise<string>;
}

/**
 * Holds information about the current video adaptation.
 *
 * @platform Android
 */
export interface VideoAdaptationData {
  suggested?: string;
}

/**
 * Configures the adaptation logic.
 */
export interface AdaptationConfig extends NativeInstanceConfig {
  /**
   * The upper bitrate boundary in bits per second for approximate network bandwidth consumption of the played source.
   * Can be set to `undefined` for no limitation.
   */
  maxSelectableBitrate?: number;

  /**
   * The initial bandwidth estimate in bits per second the player uses to select the optimal media tracks before actual bandwidth data is available. Overriding this value should only be done in specific cases and will most of the time not result in better selection logic.
   *
   * @platform Android
   * @see https://cdn.bitmovin.com/player/android/3/docs/player-core/com.bitmovin.player.api.media/-adaptation-config/initial-bandwidth-estimate-override.html
   */
  initialBandwidthEstimateOverride?: number;

  /**
   * A callback to customize the player's adaptation logic. VideoAdaptation.onVideoAdaptation is called before the player tries to download a new video segment.
   *
   * @platform Android
   * @see https://cdn.bitmovin.com/player/android/3/docs/player-core/com.bitmovin.player.api.media/-adaptation-config/video-adaptation.html
   */
  videoAdaptation?: VideoAdaptation;
}
