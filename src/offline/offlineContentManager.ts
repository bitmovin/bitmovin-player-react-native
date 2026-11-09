import type { EventSubscription } from 'expo-modules-core';
import NativeInstance from '../nativeInstance';
import type {
  BitmovinNativeOfflineEventData,
  OfflineContentManagerListener,
} from './offlineContentManagerListener';
import { OfflineEventType } from './offlineContentManagerListener';
import type { OfflineContentConfig } from './offlineContentConfig';
import type { OfflineDownloadRequest } from './offlineDownloadRequest';
import type { OfflineState } from './offlineState';
import OfflineModule, {
  type NativeOffline,
  type NativeOfflineBackend,
  type NativeOfflineEvents,
} from './offlineModule';
import { legacyOfflineRegistry } from '../nativeInstanceRegistry';
import { nativeOwner } from '../nativeOwner';
import {
  createConfigurationCallbacks,
  createSharedObjectWithCallback,
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
 * the constructor, which starts native resource creation.
 *
 * @platform Android, iOS
 */
export class OfflineContentManager extends NativeInstance<NativeOffline> {
  constructor(readonly config: OfflineContentConfig) {
    super(config.nativeId, legacyOfflineRegistry, () =>
      this.createNativeOffline()
    );
    void this.native.then(
      (native) => {
        nativeOwner.set(this, native);
        this.observeEvents(native.events);
      },
      () => {}
    );
  }

  /** Whether native creation has completed successfully. */
  get isInitialized(): boolean {
    return nativeOwner.get(this) !== undefined;
  }

  /** Whether `destroy()` has been called on this wrapper. */
  isDestroyed = false;
  private eventSubscription?: EventSubscription;
  private listeners: Set<OfflineContentManagerListener> =
    new Set<OfflineContentManagerListener>();

  /** Waits for the native manager creation started by the constructor. */
  initialize = async (): Promise<void> => {
    await this.native;
  };

  private async createNativeOffline(): Promise<NativeOffline> {
    const callbacks = createConfigurationCallbacks();
    const events = OfflineModule.createEvents();
    this.observeEvents(events);
    let native: NativeOfflineBackend | undefined;
    try {
      native = await createSharedObjectWithCallback(
        (callback) =>
          OfflineModule.create(
            callbacks.serialize(this.config),
            events,
            callback
          ),
        callbacks.callback
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
    this.isDestroyed = true;
    this.eventSubscription?.remove();
    this.listeners.clear();
    legacyOfflineRegistry.remove(this.nativeId, this.native);
    let native;
    try {
      native = await this.native;
    } catch {
      // A failed constructor has no native manager to destroy.
      return;
    }
    // Creation can subscribe after destroy() starts; detach it before cleanup completes.
    this.eventSubscription?.remove();
    await native.destroy();
  };

  /**
   * Gets the current state of the `OfflineContentManager`
   */
  state = async (): Promise<OfflineState> => {
    return (await (await this.native).getState()) as OfflineState;
  };

  /**
   * Loads the current `OfflineContentOptions`.
   * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
   */
  getOptions = async (): Promise<void> => {
    return (await this.native).getOptions();
  };

  /**
   * Enqueues downloads according to the `OfflineDownloadRequest`.
   * The native SDK handles requests according to the current download state.
   * A resolved promise does not indicate that the download has finished.
   * Observe `OfflineContentManagerListener` for download completion and errors.
   */
  download = async (request: OfflineDownloadRequest): Promise<void> => {
    return (await this.native).download(request);
  };

  /**
   * Resumes all suspended actions.
   */
  resume = async (): Promise<void> => {
    return (await this.native).resume();
  };

  /**
   * Suspends all active actions.
   */
  suspend = async (): Promise<void> => {
    return (await this.native).suspend();
  };

  /**
   * Cancels and deletes the active download.
   */
  cancelDownload = async (): Promise<void> => {
    return (await this.native).cancelDownload();
  };

  /**
   * Resolves how many bytes of storage are used by the offline content.
   */
  usedStorage = async (): Promise<number> => {
    return (await (await this.native).usedStorage()) as number;
  };

  /**
   * Deletes everything related to the related content ID.
   */
  deleteAll = async (): Promise<void> => {
    return (await this.native).deleteAll();
  };

  /**
   * Downloads the offline license.
   * When finished successfully, data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  downloadLicense = async (): Promise<void> => {
    return (await this.native).downloadLicense();
  };

  /**
   * Releases the currently held offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   *
   * @platform Android
   */
  releaseLicense = async (): Promise<void> => {
    return (await this.native).releaseLicense();
  };

  /**
   * Renews the already downloaded DRM license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  renewOfflineLicense = async (): Promise<void> => {
    return (await this.native).renewOfflineLicense();
  };
}
