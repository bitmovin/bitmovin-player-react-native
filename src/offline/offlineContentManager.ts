import { EventSubscription } from 'expo-modules-core';
import NativeInstance from '../nativeInstance';
import {
  BitmovinNativeOfflineEventData,
  OfflineContentManagerListener,
  OfflineEventType,
} from './offlineContentManagerListener';
import { OfflineContentConfig } from './offlineContentConfig';
import { OfflineDownloadRequest } from './offlineDownloadRequest';
import { OfflineState } from './offlineState';
import { Drm } from '../drm';
import OfflineModule from './offlineModule';

const handleBitmovinNativeOfflineEvent = (
  data: BitmovinNativeOfflineEventData,
  listeners: Set<OfflineContentManagerListener>
) => {
  listeners.forEach((listener) => {
    if (!listener) return;

    if (data.eventType === OfflineEventType.onCompleted) {
      listener.onCompleted?.(data);
    } else if (data.eventType === OfflineEventType.onError) {
      listener.onError?.(data);
    } else if (data.eventType === OfflineEventType.onProgress) {
      listener.onProgress?.(data);
    } else if (data.eventType === OfflineEventType.onOptionsAvailable) {
      listener.onOptionsAvailable?.(data);
    } else if (data.eventType === OfflineEventType.onDrmLicenseUpdated) {
      listener.onDrmLicenseUpdated?.(data);
    } else if (data.eventType === OfflineEventType.onDrmLicenseExpired) {
      listener.onDrmLicenseExpired?.(data);
    } else if (data.eventType === OfflineEventType.onSuspended) {
      listener.onSuspended?.(data);
    } else if (data.eventType === OfflineEventType.onResumed) {
      listener.onResumed?.(data);
    } else if (data.eventType === OfflineEventType.onCanceled) {
      listener.onCanceled?.(data);
    }
  });
};

/**
 * Provides the means to download and store sources locally that can be played back with a Player
 * without an active network connection. An OfflineContentManager instance can be created via
 * the constructor and will be idle until initialized.
 *
 * @remarks Platform: Android, iOS
 */
export class OfflineContentManager extends NativeInstance<OfflineContentConfig> {
  isInitialized = false;
  isDestroyed = false;
  private eventSubscription?: EventSubscription;
  private listeners: Set<OfflineContentManagerListener> =
    new Set<OfflineContentManagerListener>();
  private drm?: Drm;

  /**
   * Allocates the native `OfflineManager` instance and its resources natively.
   * Registers the `DeviceEventEmitter` listener to receive data from the native `OfflineContentManagerListener` callbacks
   */
  initialize = async (): Promise<void> => {
    if (!this.isInitialized && this.config) {
      this.eventSubscription = OfflineModule.addListener(
        'onBitmovinOfflineEvent',
        (event: BitmovinNativeOfflineEventData) => {
          if (this.nativeId !== event.nativeId) {
            return;
          }

          handleBitmovinNativeOfflineEvent(event, this.listeners);
        }
      );

      if (this.config.sourceConfig.drmConfig) {
        this.drm = new Drm(this.config.sourceConfig.drmConfig);
        await this.drm.initialize();
      }

      await OfflineModule.initializeWithConfig(
        this.nativeId,
        {
          identifier: this.config.identifier,
          sourceConfig: this.config.sourceConfig,
        },
        this.drm?.nativeId
      );
    }

    this.isInitialized = true;
    return Promise.resolve();
  };

  /**
   * Adds a listener to the receive data from the native `OfflineContentManagerListener` callbacks
   * Returns a function that removes this listener from the `OfflineContentManager` that registered it.
   */
  addListener = (listener: OfflineContentManagerListener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Destroys the native `OfflineManager` and releases all of its allocated resources.
   */
  destroy = async (): Promise<void> => {
    if (!this.isDestroyed) {
      this.isDestroyed = true;
      this.eventSubscription?.remove?.();
      this.listeners.clear();
      this.drm?.destroy();

      return OfflineModule.release(this.nativeId);
    }

    return Promise.resolve();
  };

  /**
   * Gets the current state of the `OfflineContentManager`
   */
  state = async (): Promise<OfflineState> => {
    return OfflineModule.getState(this.nativeId) as Promise<OfflineState>;
  };

  /**
   * Loads the current `OfflineContentOptions`.
   * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
   */
  getOptions = async (): Promise<void> => {
    return OfflineModule.getOptions(this.nativeId);
  };

  /**
   * Enqueues downloads according to the `OfflineDownloadRequest`.
   * The promise will reject in the event of null or invalid request parameters.
   * The promise will reject when calling this method when download has already started or is completed.
   * The promise will resolve when the download has been queued. The download will is not finished when the promise resolves.
   */
  download = async (request: OfflineDownloadRequest): Promise<void> => {
    return OfflineModule.download(this.nativeId, request);
  };

  /**
   * Resumes all suspended actions.
   */
  resume = async (): Promise<void> => {
    return OfflineModule.resume(this.nativeId);
  };

  /**
   * Suspends all active actions.
   */
  suspend = async (): Promise<void> => {
    return OfflineModule.suspend(this.nativeId);
  };

  /**
   * Cancels and deletes the active download.
   */
  cancelDownload = async (): Promise<void> => {
    return OfflineModule.cancelDownload(this.nativeId);
  };

  /**
   * Resolves how many bytes of storage are used by the offline content.
   */
  usedStorage = async (): Promise<number> => {
    return OfflineModule.usedStorage(this.nativeId);
  };

  /**
   * Deletes everything related to the related content ID.
   */
  deleteAll = async (): Promise<void> => {
    return OfflineModule.deleteAll(this.nativeId);
  };

  /**
   * Downloads the offline license.
   * When finished successfully, data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  downloadLicense = async (): Promise<void> => {
    return OfflineModule.downloadLicense(this.nativeId);
  };

  /**
   * Releases the currently held offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   *
   * @remarks Platform: Android
   */
  releaseLicense = async (): Promise<void> => {
    return OfflineModule.releaseLicense(this.nativeId);
  };

  /**
   * Renews the already downloaded DRM license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  renewOfflineLicense = async (): Promise<void> => {
    return OfflineModule.renewOfflineLicense(this.nativeId);
  };
}
