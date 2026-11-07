import { setNativeOwner } from '../nativeOwner';
import { Platform } from 'react-native';
import type { Source } from '../source';
import type { FairplayConfig } from './fairplayConfig';
import type { WidevineConfig } from './widevineConfig';
import { FairplayDrmApi } from './fairplayDrmApi';
import DrmModule, { getNativeDrm } from './drmModule';
import {
  createNativeCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';

// Export config types and API classes from DRM module.
export type { FairplayConfig, WidevineConfig };
export { FairplayDrmApi };

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
 * Represents a native DRM configuration object.
 * @internal
 */
export class Drm {
  readonly config?: DrmConfig;
  /**
   * Provides FairPlay-specific DRM runtime APIs such as {@link FairplayDrmApi.renewExpiringLicense}.
   *
   * @platform iOS, tvOS
   */
  readonly fairplay: FairplayDrmApi;
  /**
   * Whether this object's native instance has been created.
   */
  isInitialized = false;
  /**
   * Whether this object's native instance has been disposed.
   */
  isDestroyed = false;

  constructor(config?: DrmConfig, source?: Source) {
    this.config = config;
    this.fairplay = new FairplayDrmApi(source);
  }

  initialize = async () => {
    if (!this.isInitialized) {
      const config = this.config;
      setNativeOwner(
        this,
        DrmModule.create(
          serializeNativeConfig(config ?? {}),
          createNativeCallback((operation, args) => {
            const platformConfig =
              Platform.OS === 'ios' ? config?.fairplay : config?.widevine;
            const callback =
              platformConfig?.[operation as keyof typeof platformConfig];
            return typeof callback === 'function'
              ? (callback as (...values: any[]) => any).apply(
                  platformConfig,
                  args
                )
              : null;
          })
        )
      );
      this.isInitialized = true;
    }
  };

  destroy = async () => {
    if (!this.isDestroyed) {
      const native = getNativeDrm(this);
      if (native) {
        setNativeOwner(this);
        await native.destroy();
      }
      this.isDestroyed = true;
    }
  };
}
