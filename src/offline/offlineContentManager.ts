import type { EventSubscription } from 'expo-modules-core';
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
import { NativeConfigSerializer } from '../nativeCallbacks';

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
export class OfflineContentManager {
  constructor(readonly config: OfflineContentConfig) {
    const instance = legacyOfflineRegistry.create(config.nativeId, () =>
      this.createNativeOffline()
    );
    this.nativeId = instance.nativeId;
    this.native = instance.native;
    void this.initialize().catch(() => {});
  }

  /** User-defined compatibility ID, or a generated UUIDv4. */
  readonly nativeId: string;

  /** @internal */
  readonly native: Promise<NativeOffline>;

  /** Whether the constructor's native creation attempt has completed successfully. */
  isInitialized = false;

  /** Whether `destroy()` has been called on this wrapper. */
  isDestroyed = false;
  private eventSubscription?: EventSubscription;
  private listeners: Set<OfflineContentManagerListener> =
    new Set<OfflineContentManagerListener>();

  /** Waits for the native manager creation started by the constructor. */
  initialize = async (): Promise<void> => {
    const native = await this.native;
    this.isInitialized = true;
    this.observeEvents(native.events);
  };

  private async createNativeOffline(): Promise<NativeOffline> {
    const serializer = new NativeConfigSerializer();
    const events = OfflineModule.createEvents();
    this.observeEvents(events);
    let native: NativeOfflineBackend | undefined;
    try {
      const config = serializer.serialize(this.config);
      delete config.nativeId;
      native = await serializer.dispatcher.create((callback) =>
        OfflineModule.create(config, events, callback)
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
      OfflineContentManager.weakEventListener(new WeakRef(this))
    );
  }

  // A separate scope keeps the native-held listener from capturing the manager.
  private static weakEventListener(reference: WeakRef<OfflineContentManager>) {
    return (event: Omit<BitmovinNativeOfflineEventData, 'nativeId'>) => {
      const manager = reference.deref();
      if (!manager) return;
      handleBitmovinNativeOfflineEvent(
        {
          ...event,
          nativeId: manager.nativeId,
        } as BitmovinNativeOfflineEventData,
        manager.listeners
      );
    };
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
