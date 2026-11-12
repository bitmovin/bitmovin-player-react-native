import type { EventSubscription } from 'expo-modules-core';
import type {
  BitmovinNativeOfflineEventData,
  OfflineContentManagerListener,
} from './offlineContentManagerListener';
import { OfflineEventType } from './offlineContentManagerListener';
import type { OfflineContentConfig } from './offlineContentConfig';
import type { OfflineDownloadRequest } from './offlineDownloadRequest';
import type { OfflineState } from './offlineState';
import {
  SharedOfflineContentManager,
  SharedOfflineEvents,
} from './offlineModule';
import { legacyOfflineRegistry } from '../nativeInstanceRegistry';

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
 * the constructor. Native SDK resources are created on the first SDK operation.
 *
 */
export class OfflineContentManager {
  /** @internal Native peer used by the view and runtime API adapters. */
  readonly native!: SharedOfflineContentManager;
  private readonly listeners = new Set<OfflineContentManagerListener>();
  private subscription?: EventSubscription;

  constructor(readonly config: OfflineContentConfig) {
    const alias = legacyOfflineRegistry.get(config.nativeId);
    if (alias) return alias;
    const events = new SharedOfflineEvents();
    this.native = new SharedOfflineContentManager(
      { identifier: config.identifier, sourceConfig: config.sourceConfig },
      events
    );
    this.nativeId = legacyOfflineRegistry.register(config.nativeId, this);
    this.observeEvents(events);
  }

  /** User-defined compatibility ID, or a generated UUIDv4. */
  declare readonly nativeId: string;

  /** Whether `destroy()` has been called on this wrapper. */
  isDestroyed = false;

  /**
   * Adds a listener to the receive data from the native `OfflineContentManagerListener` callbacks
   * Returns a function that removes this listener from the `OfflineContentManager` that registered it.
   */
  addListener = (listener: OfflineContentManagerListener): (() => void) => {
    const listeners = this.listeners;
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  /**
   * Destroys the native `OfflineManager` and releases all of its allocated resources.
   */
  destroy = async (): Promise<void> => {
    this.isDestroyed = true;
    this.subscription?.remove();
    this.subscription = undefined;
    this.listeners.clear();
    legacyOfflineRegistry.remove(this.nativeId, this);
    await this.native.destroy();
  };

  /**
   * Gets the current state of the `OfflineContentManager`
   */
  state = (): Promise<OfflineState> => this.native.state();

  /**
   * Loads the current `OfflineContentOptions`.
   * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
   */
  getOptions = (): Promise<void> => this.native.getOptions();

  /**
   * Enqueues downloads according to the `OfflineDownloadRequest`.
   * The native SDK handles requests according to the current download state.
   * A resolved promise does not indicate that the download has finished.
   * Observe `OfflineContentManagerListener` for download completion and errors.
   */
  download = (request: OfflineDownloadRequest): Promise<void> =>
    this.native.download(request);

  /**
   * Resumes all suspended actions.
   */
  resume = (): Promise<void> => this.native.resume();

  /**
   * Suspends all active actions.
   */
  suspend = (): Promise<void> => this.native.suspend();

  /**
   * Cancels and deletes the active download.
   */
  cancelDownload = (): Promise<void> => this.native.cancelDownload();

  /**
   * Resolves how many bytes of storage are used by the offline content.
   */
  usedStorage = (): Promise<number> => this.native.usedStorage();

  /**
   * Deletes everything related to the related content ID.
   */
  deleteAll = (): Promise<void> => this.native.deleteAll();

  /**
   * Downloads the offline license.
   * When finished successfully, data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  downloadLicense = (): Promise<void> => this.native.downloadLicense();

  /**
   * Releases the currently held offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   *
   * @platform Android
   */
  releaseLicense = (): Promise<void> => this.native.releaseLicense();

  /**
   * Renews the already downloaded DRM license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  renewOfflineLicense = (): Promise<void> => this.native.renewOfflineLicense();
  private observeEvents(events: SharedOfflineEvents) {
    if (!this.subscription)
      this.subscription = events.addListener(
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
}
