import type { EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';
import NativeInstance from '../nativeInstance';
import type {
  BitmovinNativeOfflineEventData,
  OfflineContentManagerListener,
} from './offlineContentManagerListener';
import { OfflineEventType } from './offlineContentManagerListener';
import type { OfflineContentConfig } from './offlineContentConfig';
import type { OfflineDownloadRequest } from './offlineDownloadRequest';
import { OfflineState } from './offlineState';
import OfflineModule, {
  getNativeOffline,
  getOfflineForOperation,
  offlineCompatibilityError,
  type NativeOffline,
  type NativeOfflineBackend,
  type NativeOfflineEvents,
} from './offlineModule';
import { createNativeDrmConfig, type NativeDrmConfig } from '../drm/drmModule';
import {
  getOrCreateAsync,
  holdDependencies,
  destroyDependencies,
  lookupPending,
  remove,
} from '../nativeInstanceRegistry';
import { serializeNativeConfig } from '../nativeCallbacks';

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
 * @platform Android, iOS
 */
export class OfflineContentManager extends NativeInstance<OfflineContentConfig> {
  isInitialized = false;
  isDestroyed = false;
  private eventSubscription?: EventSubscription;
  private listeners: Set<OfflineContentManagerListener> =
    new Set<OfflineContentManagerListener>();
  private drm?: NativeDrmConfig;

  /**
   * Allocates the native `OfflineManager` instance and its resources natively.
   * Registers the object-scoped listener for native offline callbacks.
   */
  initialize = async (): Promise<void> => {
    if (!this.isInitialized && this.config) {
      const existing = getNativeOffline(this.nativeId);
      if (existing) this.observeEvents(existing.events);
      if (
        Platform.OS === 'android' &&
        (existing || lookupPending('offline', this.nativeId))
      ) {
        throw offlineCompatibilityError(
          'initializeWithConfig',
          this.nativeId,
          true
        );
      }
      const native = await getOrCreateAsync(
        'offline',
        this.nativeId,
        () => this.createNativeOffline(),
        async (created) => {
          await created.destroy();
          destroyDependencies(created);
        }
      );
      if (!native || getNativeOffline(this.nativeId) !== native) return;
      this.observeEvents(native.events);
      if (existing) {
        await this.initializeDrm();
        holdDependencies(native, [this.drm]);
      }
    }
    this.isInitialized = true;
  };

  private async createNativeOffline(): Promise<NativeOffline> {
    const events = OfflineModule.createEvents();
    this.observeEvents(events);
    let native: NativeOfflineBackend | undefined;
    try {
      await this.initializeDrm();
      native = await OfflineModule.create(
        serializeNativeConfig({
          identifier: this.config?.identifier,
          sourceConfig: this.config?.sourceConfig,
        }),
        this.drm,
        events
      );
      const created = Object.defineProperty(native, 'events', {
        value: events,
      }) as NativeOffline;
      holdDependencies(created, [this.drm]);
      return created;
    } catch (error) {
      this.eventSubscription?.remove();
      this.eventSubscription = undefined;
      await native?.destroy();
      await this.destroyDrm();
      throw error;
    }
  }

  private async initializeDrm() {
    if (this.config?.sourceConfig.drmConfig) {
      this.drm = createNativeDrmConfig(this.config.sourceConfig.drmConfig);
    }
  }

  private async destroyDrm() {
    const drm = this.drm;
    this.drm = undefined;
    await drm?.destroy();
  }

  private observeEvents(events: NativeOfflineEvents) {
    if (this.eventSubscription) return;
    this.eventSubscription = events.addListener(
      'onBitmovinOfflineEvent',
      (event) => {
        handleBitmovinNativeOfflineEvent(
          {
            ...event,
            nativeId: this.nativeId,
          } as BitmovinNativeOfflineEventData,
          this.listeners
        );
      }
    );
  }

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
      this.eventSubscription?.remove();
      this.listeners.clear();
      await this.destroyDrm();
      const pending = lookupPending('offline', this.nativeId);
      if (pending) {
        remove('offline', this.nativeId, pending);
        await pending;
      } else {
        const native = getOfflineForOperation(this.nativeId, 'release');
        if (native) {
          remove('offline', this.nativeId, native);
          try {
            await native.destroy();
          } finally {
            destroyDependencies(native);
          }
        }
      }
    }
  };

  /**
   * Gets the current state of the `OfflineContentManager`
   */
  state = async (): Promise<OfflineState> => {
    const native = getOfflineForOperation(this.nativeId, 'getState');
    return (
      native
        ? await native.getState()
        : Platform.OS === 'ios' && !Platform.isTV
          ? OfflineState.NotDownloaded
          : null
    ) as OfflineState;
  };

  /**
   * Loads the current `OfflineContentOptions`.
   * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
   */
  getOptions = async (): Promise<void> => {
    return getOfflineForOperation(this.nativeId, 'getOptions')?.getOptions();
  };

  /**
   * Enqueues downloads according to the `OfflineDownloadRequest`.
   * The promise will reject in the event of null or invalid request parameters.
   * The promise will reject when calling this method when download has already started or is completed.
   * The promise will resolve when the download has been queued. The download will is not finished when the promise resolves.
   */
  download = async (request: OfflineDownloadRequest): Promise<void> => {
    return getOfflineForOperation(this.nativeId, 'download')?.download(request);
  };

  /**
   * Resumes all suspended actions.
   */
  resume = async (): Promise<void> => {
    return getOfflineForOperation(this.nativeId, 'resume')?.resume();
  };

  /**
   * Suspends all active actions.
   */
  suspend = async (): Promise<void> => {
    return getOfflineForOperation(this.nativeId, 'suspend')?.suspend();
  };

  /**
   * Cancels and deletes the active download.
   */
  cancelDownload = async (): Promise<void> => {
    return getOfflineForOperation(
      this.nativeId,
      'cancelDownload'
    )?.cancelDownload();
  };

  /**
   * Resolves how many bytes of storage are used by the offline content.
   */
  usedStorage = async (): Promise<number> => {
    return ((await getOfflineForOperation(
      this.nativeId,
      'usedStorage'
    )?.usedStorage()) ?? null) as number;
  };

  /**
   * Deletes everything related to the related content ID.
   */
  deleteAll = async (): Promise<void> => {
    return getOfflineForOperation(this.nativeId, 'deleteAll')?.deleteAll();
  };

  /**
   * Downloads the offline license.
   * When finished successfully, data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  downloadLicense = async (): Promise<void> => {
    return getOfflineForOperation(
      this.nativeId,
      'downloadLicense'
    )?.downloadLicense();
  };

  /**
   * Releases the currently held offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   *
   * @platform Android
   */
  releaseLicense = async (): Promise<void> => {
    return getOfflineForOperation(
      this.nativeId,
      'releaseLicense'
    )?.releaseLicense();
  };

  /**
   * Renews the already downloaded DRM license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  renewOfflineLicense = async (): Promise<void> => {
    return getOfflineForOperation(
      this.nativeId,
      'renewOfflineLicense'
    )?.renewOfflineLicense();
  };
}
