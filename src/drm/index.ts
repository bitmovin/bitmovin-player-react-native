import { Platform } from 'react-native';
import { EventSubscription } from 'expo-modules-core';
import NativeInstance, { NativeInstanceConfig } from '../nativeInstance';
import { FairplayConfig } from './fairplayConfig';
import { WidevineConfig } from './widevineConfig';
import DrmExpoModule from './drmExpoModule';

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

/**
 * Represents a native DRM configuration object.
 * @internal
 */
export class Drm extends NativeInstance<DrmConfig> {
  /**
   * Whether this object's native instance has been created.
   */
  isInitialized = false;
  /**
   * Whether this object's native instance has been disposed.
   */
  isDestroyed = false;

  private eventSubscriptions: EventSubscription[] = [];

  /**
   * Allocates the DRM config instance and its resources natively.
   */
  initialize = async () => {
    if (!this.isInitialized) {
      // Set up event listeners for DRM preparation callbacks
      this.setupEventListeners();

      // Create native configuration object using Expo module.
      if (this.config) {
        await DrmExpoModule.initializeWithConfig(this.nativeId, this.config);
      }
      this.isInitialized = true;
    }
  };

  /**
   * Destroys the native DRM config and releases all of its allocated resources.
   */
  destroy = async () => {
    if (!this.isDestroyed) {
      await DrmExpoModule.destroy(this.nativeId);
      // Clean up event subscriptions
      this.eventSubscriptions.forEach((subscription) => subscription.remove());
      this.eventSubscriptions = [];
      this.isDestroyed = true;
    }
  };

  /**
   * Sets up event listeners for all DRM preparation callbacks
   */
  private setupEventListeners() {
    // iOS-only events
    this.eventSubscriptions.push(
      DrmExpoModule.addListener(
        'onPrepareCertificate',
        ({ nativeId, certificate }) => {
          if (nativeId !== this.nativeId) return;
          this.onPrepareCertificate(certificate);
        }
      )
    );

    this.eventSubscriptions.push(
      DrmExpoModule.addListener(
        'onPrepareSyncMessage',
        ({ nativeId, syncMessage, assetId }) => {
          if (nativeId !== this.nativeId) return;
          this.onPrepareSyncMessage(syncMessage, assetId);
        }
      )
    );

    this.eventSubscriptions.push(
      DrmExpoModule.addListener(
        'onPrepareLicenseServerUrl',
        ({ nativeId, licenseServerUrl }) => {
          if (nativeId !== this.nativeId) return;
          this.onPrepareLicenseServerUrl(licenseServerUrl);
        }
      )
    );

    this.eventSubscriptions.push(
      DrmExpoModule.addListener(
        'onPrepareContentId',
        ({ nativeId, contentId }) => {
          if (nativeId !== this.nativeId) return;
          this.onPrepareContentId(contentId);
        }
      )
    );

    // Cross-platform events
    this.eventSubscriptions.push(
      DrmExpoModule.addListener(
        'onPrepareMessage',
        ({ nativeId, data, message, assetId }) => {
          if (nativeId !== this.nativeId) return;
          // Android sends 'data', iOS sends 'message'
          this.onPrepareMessage(data || message, assetId);
        }
      )
    );

    this.eventSubscriptions.push(
      DrmExpoModule.addListener(
        'onPrepareLicense',
        ({ nativeId, data, license }) => {
          if (nativeId !== this.nativeId) return;
          // Android sends 'data', iOS sends 'license'
          this.onPrepareLicense(data || license);
        }
      )
    );
  }

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
  private onPrepareCertificate = (certificate: string) => {
    if (this.config?.fairplay?.prepareCertificate) {
      const result = this.config?.fairplay?.prepareCertificate?.(certificate);
      DrmExpoModule.setPreparedCertificate(this.nativeId, result);
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
  private onPrepareMessage = (message?: string, assetId?: string) => {
    if (!message) {
      DrmExpoModule.setPreparedMessage(this.nativeId, undefined);
      return;
    }
    const config =
      Platform.OS === 'ios' ? this.config?.fairplay : this.config?.widevine;
    if (config && config.prepareMessage) {
      const result =
        Platform.OS === 'ios'
          ? (config as FairplayConfig).prepareMessage?.(message, assetId!)
          : (config as WidevineConfig).prepareMessage?.(message);
      DrmExpoModule.setPreparedMessage(this.nativeId, result);
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
  private onPrepareSyncMessage = (syncMessage: string, assetId: string) => {
    if (this.config?.fairplay?.prepareSyncMessage) {
      const result = this.config?.fairplay?.prepareSyncMessage?.(
        syncMessage,
        assetId
      );
      DrmExpoModule.setPreparedSyncMessage(this.nativeId, result);
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
  private onPrepareLicense = (license?: string) => {
    if (!license) {
      DrmExpoModule.setPreparedLicense(this.nativeId, undefined);
      return;
    }
    const prepareLicense =
      Platform.OS === 'ios'
        ? this.config?.fairplay?.prepareLicense
        : this.config?.widevine?.prepareLicense;
    if (prepareLicense) {
      DrmExpoModule.setPreparedLicense(this.nativeId, prepareLicense(license));
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
  private onPrepareLicenseServerUrl = (licenseServerUrl: string) => {
    if (this.config?.fairplay?.prepareLicenseServerUrl) {
      const result =
        this.config?.fairplay?.prepareLicenseServerUrl?.(licenseServerUrl);
      DrmExpoModule.setPreparedLicenseServerUrl(this.nativeId, result);
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
  private onPrepareContentId = (contentId: string) => {
    console.log('onPrepareContentId', contentId);
    if (this.config?.fairplay?.prepareContentId) {
      const result = this.config?.fairplay?.prepareContentId?.(contentId);
      DrmExpoModule.setPreparedContentId(this.nativeId, result);
    }
  };
}
