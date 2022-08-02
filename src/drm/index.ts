import { NativeModules, Platform } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import NativeInstance, { NativeInstanceConfig } from '../nativeInstance';
import { FairplayConfig } from './fairplayConfig';
import { WidevineConfig } from './widevineConfig';

// Export config types from DRM module.
export { FairplayConfig, WidevineConfig };

const DrmModule = NativeModules.DrmModule;

/**
 * Represents the general Streaming DRM config.
 */
export interface DRMConfig extends NativeInstanceConfig {
  /**
   * FairPlay specific configuration. Only appliable for iOS.
   */
  fairplay?: FairplayConfig;
  /**
   * Widevine specific configuration. Only appliable for Android.
   */
  widevine?: WidevineConfig;
}

/**
 * Represents a native DRM configuration object.
 */
export class DRM extends NativeInstance<DRMConfig> {
  /**
   * Whether this object's native instance has been created.
   */
  isInitialized = false;
  /**
   * Whether this object's native instance has been disposed.
   */
  isDestroyed = false;

  /**
   * Allocates the DRM config instance and its resources natively.
   */
  initialize = () => {
    if (!this.isInitialized) {
      // Register this object as a callable module so it's possible to
      // call functions on it from native code, e.g `onPrepareMessage`.
      BatchedBridge.registerCallableModule(`DRM-${this.nativeId}`, this);
      // Create native configuration object.
      DrmModule.initWithConfig(this.nativeId, this.config);
      this.isInitialized = true;
    }
  };

  /**
   * Destroys the native DRM config and releases all of its allocated resources.
   */
  destroy = () => {
    if (!this.isDestroyed) {
      DrmModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `prepareCertificate` function to native's `certificate` data and store
   * the result back in `DrmModule`.
   *
   * Called from native code when `FairplayConfig.prepareCertificate` is dispatched.
   *
   * @param certificate - Base64 encoded certificate data.
   */
  onPrepareCertificate = (certificate: string) => {
    if (this.config?.fairplay?.prepareCertificate) {
      DrmModule.setPreparedCertificate(
        this.nativeId,
        this.config?.fairplay?.prepareCertificate?.(certificate)
      );
    }
  };

  /**
   * Applies the user-defined `prepareMessage` function to native's `message` data and store
   * the result back in `DrmModule`.
   *
   * Called from native code when `prepareMessage` is dispatched.
   *
   * @param message - Base64 encoded message data.
   * @param assetId - Optional asset ID. Only sent by iOS.
   */
  onPrepareMessage = (message: string, assetId?: string) => {
    const config =
      Platform.OS === 'ios' ? this.config?.fairplay : this.config?.widevine;
    if (config && config.prepareMessage) {
      DrmModule.setPreparedMessage(
        this.nativeId,
        Platform.OS === 'ios'
          ? (config as FairplayConfig).prepareMessage?.(message, assetId!)
          : (config as WidevineConfig).prepareMessage?.(message)
      );
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `prepareSyncMessage` function to native's `syncMessage` data and
   * store the result back in `DrmModule`.
   *
   * Called from native code when `FairplayConfig.prepareSyncMessage` is dispatched.
   *
   * @param syncMessage - Base64 encoded sync SPC message data.
   */
  onPrepareSyncMessage = (syncMessage: string, assetId: string) => {
    if (this.config?.fairplay?.prepareSyncMessage) {
      DrmModule.setPreparedSyncMessage(
        this.nativeId,
        this.config?.fairplay?.prepareSyncMessage?.(syncMessage, assetId)
      );
    }
  };

  /**
   * Applies the user-defined `prepareLicense` function to native's `license` data and store
   * the result back in `DrmModule`.
   *
   * Called from native code when `prepareLicense` is dispatched.
   *
   * @param license - Base64 encoded license data.
   */
  onPrepareLicense = (license: string) => {
    const prepareLicense =
      Platform.OS === 'ios'
        ? this.config?.fairplay?.prepareLicense
        : this.config?.widevine?.prepareLicense;
    if (prepareLicense) {
      DrmModule.setPreparedLicense(this.nativeId, prepareLicense(license));
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `prepareLicenseServerUrl` function to native's `licenseServerUrl` data
   * and store the result back in `DrmModule`.
   *
   * Called from native code when `FairplayConfig.prepareLicenseServerUrl` is dispatched.
   *
   * @param licenseServerUrl - The license server URL string.
   */
  onPrepareLicenseServerUrl = (licenseServerUrl: string) => {
    if (this.config?.fairplay?.prepareLicenseServerUrl) {
      DrmModule.setPreparedLicenseServerUrl(
        this.nativeId,
        this.config?.fairplay?.prepareLicenseServerUrl?.(licenseServerUrl)
      );
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `prepareContentId` function to native's `contentId` string
   * and store the result back in `DrmModule`.
   *
   * Called from native code when `FairplayConfig.prepareContentId` is dispatched.
   *
   * @param contentId - The extracted contentId string.
   */
  onPrepareContentId = (contentId: string) => {
    if (this.config?.fairplay?.prepareContentId) {
      DrmModule.setPreparedContentId(
        this.nativeId,
        this.config?.fairplay?.prepareContentId?.(contentId)
      );
    }
  };
}
