import { NativeInstanceConfig } from 'src/nativeInstance';
import { FairplayConfig } from './fairplayConfig';
import { WidevineConfig } from './widevineConfig';

// Export config types from DRM module.
export { FairplayConfig, WidevineConfig };

/**
 * Represents the general Streaming DRM config.
 */
export interface DrmConfig extends NativeInstanceConfig {
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
