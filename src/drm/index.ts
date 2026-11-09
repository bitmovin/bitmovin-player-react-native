import type { FairplayConfig } from './fairplayConfig';
import type { WidevineConfig } from './widevineConfig';

// Export config types and API classes from DRM module.
export type { FairplayConfig, WidevineConfig };
export { FairplayDrmApi } from './fairplayDrmApi';
export { SourceDrmApi } from './sourceDrmApi';

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

/**
 * Contains streaming DRM configuration. Runtime operations are available through {@link Source.drm}.
 */
export class Drm {
  constructor(readonly config?: DrmConfig) {}
}
