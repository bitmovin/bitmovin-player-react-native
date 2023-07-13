import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModule,
  NativeModules,
  Platform,
} from 'react-native';
import NativeInstance from '../nativeInstance';
import { SourceConfig } from '../source';
import {
  BitmovinNativeOfflineEventData,
  OfflineEventType,
} from './offlineContentManagerListener';
import {
  DrmLicenseInformation,
  OfflineContentConfig,
  OfflineDownloadRequest,
  OfflineSourceOptions,
} from './offlineContentOptions';

interface NativeOfflineModule extends NativeModule {
  initWithConfig(
    nativeId: string,
    config: { identifier: string; sourceConfig: SourceConfig }
  ): Promise<void>;
  getOfflineSourceConfig(
    nativeId: string,
    options?: OfflineSourceOptions
  ): Promise<SourceConfig>;
  getOptions(nativeId: string): Promise<void>;
  process(nativeId: string, request: OfflineDownloadRequest): Promise<void>;
  resume(nativeId: string): Promise<void>;
  suspend(nativeId: string): Promise<void>;
  cancelDownload(nativeId: string): Promise<void>;
  usedStorage(nativeId: string): Promise<number>;
  deleteAll(nativeId: string): Promise<void>;
  offlineDrmLicenseInformation(
    nativeId: string
  ): Promise<DrmLicenseInformation>;
  downloadLicense(nativeId: string): Promise<void>;
  releaseLicense(nativeId: string): Promise<void>;
  renewOfflineLicense(nativeId: string): Promise<void>;
  release(nativeId: string): Promise<void>;
}

const OfflineModule =
  NativeModules.BitmovinOfflineModule as NativeOfflineModule;

/**
 * Provides the means to download and store sources locally that can be played back with a Player
 * without an active network connection.  An OfflineContentManager instance can be created via
 * the constructor and will be idle until initialized.
 */
export class OfflineContentManager extends NativeInstance<OfflineContentConfig> {
  isInitialized = false;
  isDestroyed = false;
  eventSubscription?: EmitterSubscription = undefined;

  constructor(config: OfflineContentConfig) {
    super(config);
  }

  /**
   * Allocates the native `OfflineManager` instance and its resources natively.
   * Registers the `DeviceEventEmitter` listener to receive data from the native `OfflineContentManagerListener` callbacks
   */
  initialize = (): Promise<void> => {
    let initPromise = Promise.resolve();
    if (!this.isInitialized && this.config) {
      if (this.config.listener) {
        this.eventSubscription = new NativeEventEmitter(
          OfflineModule
        ).addListener(
          'BitmovinOfflineEvent',
          (data?: BitmovinNativeOfflineEventData) => {
            if (this.nativeId !== data?.nativeId) {
              return;
            }

            if (data.eventType === OfflineEventType.onCompleted) {
              this.config?.listener?.onCompleted?.(data);
            } else if (data.eventType === OfflineEventType.onError) {
              this.config?.listener?.onError?.(data);
            } else if (data.eventType === OfflineEventType.onProgress) {
              this.config?.listener?.onProgress?.(data);
            } else if (data.eventType === OfflineEventType.onOptionsAvailable) {
              this.config?.listener?.onOptionsAvailable?.(data);
            } else if (
              data.eventType === OfflineEventType.onDrmLicenseUpdated
            ) {
              this.config?.listener?.onDrmLicenseUpdated?.(data);
            } else if (
              data.eventType === OfflineEventType.onDrmLicenseExpired
            ) {
              this.config?.listener?.onDrmLicenseExpired?.(data);
            } else if (data.eventType === OfflineEventType.onSuspended) {
              this.config?.listener?.onSuspended?.(data);
            } else if (data.eventType === OfflineEventType.onResumed) {
              this.config?.listener?.onResumed?.(data);
            } else if (data.eventType === OfflineEventType.onCanceled) {
              this.config?.listener?.onCanceled?.(data);
            }
          }
        );
      }

      initPromise = OfflineModule.initWithConfig(this.nativeId, {
        identifier: this.config.identifier,
        sourceConfig: this.config.sourceConfig,
      });
    }

    this.isInitialized = true;
    return initPromise;
  };

  /**
   * Destroys the native `OfflineManager` and releases all of its allocated resources.
   */
  destroy = (): Promise<void> => {
    if (!this.isDestroyed) {
      this.isDestroyed = true;
      this.eventSubscription?.remove?.();

      return OfflineModule.release(this.nativeId);
    }

    return Promise.resolve();
  };

  /**
   * Gets the current offline source config of the `OfflineContentManager`
   */
  getOfflineSourceConfig = (
    options?: OfflineSourceOptions
  ): Promise<SourceConfig> => {
    if (Platform.OS === 'ios') {
      return OfflineModule.getOfflineSourceConfig(this.nativeId, options);
    }

    return OfflineModule.getOfflineSourceConfig(this.nativeId);
  };

  /**
   * Loads the current `OfflineContentOptions`.
   * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
   */
  getOptions = (): Promise<void> => {
    return OfflineModule.getOptions(this.nativeId);
  };

  /**
   * Enqueues downloads according to the `OfflineDownloadRequest`.
   * The promise will reject in the event of null or invalid request parameters.
   * The promise will reject when selecting an `OfflineOptionEntry` to download that is not compatible with the current state.
   * The promise will resolve when the download has been queued.  The download will is not finished when the promise resolves.
   */
  process = (request: OfflineDownloadRequest): Promise<void> => {
    return OfflineModule.process(this.nativeId, request);
  };

  /**
   * Resumes all suspended actions.
   */
  resume = (): Promise<void> => {
    return OfflineModule.resume(this.nativeId);
  };

  /**
   * Suspends all active actions.
   */
  suspend = (): Promise<void> => {
    return OfflineModule.suspend(this.nativeId);
  };

  /**
   * Cancels and deletes the active download.
   */
  cancelDownload = (): Promise<void> => {
    return OfflineModule.cancelDownload(this.nativeId);
  };

  /**
   * Resolves how many bytes of storage are used by the offline content.
   */
  usedStorage = (): Promise<number> => {
    return OfflineModule.usedStorage(this.nativeId);
  };

  /**
   * Deletes everything related to the related content ID.
   */
  deleteAll = (): Promise<void> => {
    return OfflineModule.deleteAll(this.nativeId);
  };

  /**
   * Resolves A `DrmLicenseInformation` object containing the remaining drm license duration and the remaining playback duration.
   * The promise will reject if the loading of the DRM key fails.
   * The promise will reject if the provided DRM technology is not supported.
   * The promise will reject if the DRM licensing call to the server fails.
   */
  offlineDrmLicenseInformation = (): Promise<DrmLicenseInformation> => {
    return OfflineModule.offlineDrmLicenseInformation(this.nativeId);
  };

  /**
   * Downloads the offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  downloadLicense = (): Promise<void> => {
    return OfflineModule.downloadLicense(this.nativeId);
  };

  /**
   * Releases the currently held offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  releaseLicense = (): Promise<void> => {
    return OfflineModule.releaseLicense(this.nativeId);
  };

  /**
   * Renews the already downloaded DRM license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  renewOfflineLicense = (): Promise<void> => {
    return OfflineModule.renewOfflineLicense(this.nativeId);
  };
}
