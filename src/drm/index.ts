import { Platform } from 'react-native';
import type { NativeInstanceConfig } from '../nativeInstance';
import NativeInstance from '../nativeInstance';
import type { FairplayConfig } from './fairplayConfig';
import type { WidevineConfig } from './widevineConfig';
import { FairplayDrmApi } from './fairplayDrmApi';
import DrmModule, { getNativeDrm } from './drmModule';
import { getOrCreate, remove } from '../nativeInstanceRegistry';
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

/**
 * Represents a native DRM configuration object.
 * @internal
 */
export class Drm extends NativeInstance<DrmConfig> {
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

  constructor(config?: DrmConfig, sourceNativeId?: string) {
    super(config);
    this.fairplay = new FairplayDrmApi(sourceNativeId ?? '');
  }

  initialize = async () => {
    if (!this.isInitialized) {
      getOrCreate('drm', this.nativeId, () =>
        DrmModule.create(
          serializeNativeConfig(this.config ?? {}),
          createNativeCallback((operation, args) => {
            const config =
              Platform.OS === 'ios'
                ? this.config?.fairplay
                : this.config?.widevine;
            const callback = config?.[operation as keyof typeof config];
            return typeof callback === 'function'
              ? (callback as (...values: any[]) => any).apply(config, args)
              : null;
          })
        )
      );
      this.isInitialized = true;
    }
  };

  destroy = async () => {
    if (!this.isDestroyed) {
      const native = getNativeDrm(this.nativeId);
      if (native) {
        remove('drm', this.nativeId, native);
        await native.destroy();
      }
      this.isDestroyed = true;
    }
  };
}
