import type { FairplayConfig } from './fairplayConfig';
import type { WidevineConfig } from './widevineConfig';

// Export configuration and runtime API types.
export type { FairplayConfig, WidevineConfig };
export type { FairplayDrmApi } from './fairplayDrmApi';
export type { SourceDrmApi } from './sourceDrmApi';

/**
 * Represents the general Streaming DRM config.
 */
export interface DrmConfig {
  /**
   * FairPlay specific configuration.
   *
   * @platform iOS
   */
  fairplay?: FairplayConfig;
  /**
   * Widevine specific configuration.
   *
   * @platform Android, iOS (only for casting).
   */
  widevine?: WidevineConfig;
}
