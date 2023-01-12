import {
  NativeEventEmitter,
  EmitterSubscription,
  NativeModules,
  NativeModule,
} from 'react-native';
import NativeInstance, { NativeInstanceConfig } from './nativeInstance';
import { SourceConfig } from './source';
import {
  BitmovinNativeOfflineEventData,
  OfflineContentManagerListener,
  OfflineEventType,
} from './offlineContentManagerListener';
import { OfflineDownloadRequest } from './offlineContentOptions';

interface NativeOfflineModule extends NativeModule {
  initWithConfig(
    nativeId: string,
    config: { offlineId: string; sourceConfig: SourceConfig }
  ): Promise<void>;
  getOfflineSourceConfig(nativeId: string): Promise<SourceConfig>;
  getOptions(nativeId: string): void;
  process(nativeId: string, request: OfflineDownloadRequest): Promise<void>;
  resume(nativeId: string): void;
  suspend(nativeId: string): void;
  cancelDownload(nativeId: string): void;
  deleteAll(nativeId: string): void;
  downloadLicense(nativeId: string): void;
  releaseLicense(nativeId: string): void;
  renewOfflineLicense(nativeId: string): void;
  release(nativeId: string): void;
}

const OfflineModule =
  NativeModules.BitmovinOfflineModule as NativeOfflineModule;

/**
 * Object used to configure a new `OfflineContentManager` instance.
 */
export interface OfflineContentConfig extends NativeInstanceConfig {
  /**
   * An identifier for this source that is unique within the location and must never change.
   * The root folder will contain a folder based on this id.
   */
  offlineId: string;
  /**
   * The `SourceConfig` used to download the offline resources.
   */
  sourceConfig: SourceConfig;
  /**
   * The `OfflineContentManagerListener` where callbacks for event data will be passed to.
   */
  listener?: OfflineContentManagerListener;
}

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
            } else if (data.eventType === OfflineEventType.onSuspended) {
              this.config?.listener?.onSuspended?.(data);
            } else if (data.eventType === OfflineEventType.onResumed) {
              this.config?.listener?.onResumed?.(data);
            }
          }
        );
      }

      initPromise = OfflineModule.initWithConfig(this.nativeId, {
        offlineId: this.config.offlineId,
        sourceConfig: this.config.sourceConfig,
      });
    }

    this.isInitialized = true;
    return initPromise;
  };

  /**
   * Destroys the native `OfflineManager` and releases all of its allocated resources.
   */
  destroy = () => {
    if (!this.isDestroyed) {
      this.isDestroyed = true;
      this.eventSubscription?.remove?.();
      OfflineModule.release(this.nativeId);
    }
  };

  /**
   * Gets the current offline source config of the `OfflineContentManager`
   */
  getOfflineSourceConfig = (): Promise<SourceConfig> => {
    return OfflineModule.getOfflineSourceConfig(this.nativeId);
  };

  /**
   * Loads the current `OfflineContentOptions`.
   * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
   */
  getOptions = () => {
    OfflineModule.getOptions(this.nativeId);
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
  resume = () => {
    OfflineModule.resume(this.nativeId);
  };

  /**
   * Suspends all active actions.
   */
  suspend = () => {
    OfflineModule.suspend(this.nativeId);
  };

  /**
   * Cancels and deletes the active download.
   */
  cancelDownload = () => {
    OfflineModule.cancelDownload(this.nativeId);
  };

  /**
   * Deletes everything related to the related content ID.
   */
  deleteAll = () => {
    OfflineModule.deleteAll(this.nativeId);
  };

  /**
   * Downloads the offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  downloadLicense = () => {
    OfflineModule.downloadLicense(this.nativeId);
  };

  /**
   * Releases the currently held offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  releaseLicense = () => {
    OfflineModule.releaseLicense(this.nativeId);
  };

  /**
   * Renews the already downloaded DRM license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  renewOfflineLicense = () => {
    OfflineModule.renewOfflineLicense(this.nativeId);
  };
}
