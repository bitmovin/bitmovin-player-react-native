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
  offlineCompatibilityError,
  type NativeOffline,
  type NativeOfflineBackend,
  type NativeOfflineEvents,
} from './offlineModule';
import {
  getOrCreateAsync,
  lookupPending,
  remove,
} from '../nativeInstanceRegistry';
import {
  configurationCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';

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
 * the constructor. Native resources are created lazily on first use.
 *
 * @platform Android, iOS
 */
export class OfflineContentManager extends NativeInstance<OfflineContentConfig> {
  isInitialized = false;
  isDestroyed = false;
  private eventSubscription?: EventSubscription;
  private listeners: Set<OfflineContentManagerListener> =
    new Set<OfflineContentManagerListener>();

  private get native() {
    const existing = getNativeOffline(this);
    if (this.isDestroyed) return Promise.resolve(existing);
    if (existing) {
      this.observeEvents(existing.events);
      this.isInitialized = true;
      return Promise.resolve(existing);
    }
    return getOrCreateAsync(
      'offline',
      this.nativeId,
      () =>
        this.isDestroyed
          ? Promise.resolve(undefined)
          : this.createNativeOffline(),
      (created) => created.destroy()
    ).then((native) => {
      if (!native || getNativeOffline(this) !== native) return undefined;
      this.observeEvents(native.events);
      this.isInitialized = true;
      return native;
    });
  }

  /**
   * Allocates the native `OfflineManager` and subscribes to its events.
   * Runtime methods initialize it automatically on first use.
   */
  initialize = async (): Promise<void> => {
    if (!this.isInitialized && !this.isDestroyed && Platform.OS === 'android') {
      const existing = getNativeOffline(this);
      if (existing) this.observeEvents(existing.events);
      if (existing)
        throw offlineCompatibilityError(
          'initializeWithConfig',
          this.nativeId,
          true
        );
    }
    await this.native;
  };

  private async createNativeOffline(): Promise<NativeOffline> {
    const events = OfflineModule.createEvents();
    this.observeEvents(events);
    let native: NativeOfflineBackend | undefined;
    try {
      native = await OfflineModule.create(
        serializeNativeConfig({
          identifier: this.config?.identifier,
          sourceConfig: this.config?.sourceConfig,
        }),
        events,
        configurationCallback(this.config)
      );
      const created = Object.defineProperty(native, 'events', {
        value: events,
      }) as NativeOffline;
      return created;
    } catch (error) {
      this.eventSubscription?.remove();
      this.eventSubscription = undefined;
      await native?.destroy();
      throw error;
    }
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
      const pending = lookupPending('offline', this.nativeId);
      if (pending) {
        remove('offline', this.nativeId, pending);
        await pending;
      } else {
        const native = getNativeOffline(this);
        if (native) {
          remove('offline', this.nativeId, native);
          await native.destroy();
        }
      }
    }
  };

  /**
   * Gets the current state of the `OfflineContentManager`
   */
  state = async (): Promise<OfflineState> => {
    const native = await this.native;
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
    return (await this.native)?.getOptions();
  };

  /**
   * Enqueues downloads according to the `OfflineDownloadRequest`.
   * The native SDK handles requests according to the current download state.
   * A resolved promise does not indicate that the download has finished.
   * Observe `OfflineContentManagerListener` for download completion and errors.
   */
  download = async (request: OfflineDownloadRequest): Promise<void> => {
    return (await this.native)?.download(request);
  };

  /**
   * Resumes all suspended actions.
   */
  resume = async (): Promise<void> => {
    return (await this.native)?.resume();
  };

  /**
   * Suspends all active actions.
   */
  suspend = async (): Promise<void> => {
    return (await this.native)?.suspend();
  };

  /**
   * Cancels and deletes the active download.
   */
  cancelDownload = async (): Promise<void> => {
    return (await this.native)?.cancelDownload();
  };

  /**
   * Resolves how many bytes of storage are used by the offline content.
   */
  usedStorage = async (): Promise<number> => {
    return ((await (await this.native)?.usedStorage()) ?? null) as number;
  };

  /**
   * Deletes everything related to the related content ID.
   */
  deleteAll = async (): Promise<void> => {
    return (await this.native)?.deleteAll();
  };

  /**
   * Downloads the offline license.
   * When finished successfully, data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  downloadLicense = async (): Promise<void> => {
    return (await this.native)?.downloadLicense();
  };

  /**
   * Releases the currently held offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   *
   * @platform Android
   */
  releaseLicense = async (): Promise<void> => {
    return (await this.native)?.releaseLicense();
  };

  /**
   * Renews the already downloaded DRM license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  renewOfflineLicense = async (): Promise<void> => {
    return (await this.native)?.renewOfflineLicense();
  };
}
