import type { EventSubscription } from 'expo-modules-core';
import type {
  BitmovinNativeOfflineEventData,
  OfflineContentManagerListener,
} from './offlineContentManagerListener';
import { OfflineEventType } from './offlineContentManagerListener';
import type { OfflineContentConfig } from './offlineContentConfig';
import type { OfflineDownloadRequest } from './offlineDownloadRequest';
import type { OfflineState } from './offlineState';
import { NativeOffline, NativeOfflineEvents } from './offlineModule';
import { legacyOfflineRegistry } from '../nativeInstanceRegistry';
import { NativeConfigSerializer } from '../native/nativeConfigSerializer';
import { bindNativeMethods } from '../native/bindNativeMethods';

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
export class OfflineContentManager extends NativeOffline {
  declare private readonly ready: Promise<void>;
  private readonly listeners = new Set<OfflineContentManagerListener>();
  private subscription?: EventSubscription;

  constructor(readonly config: OfflineContentConfig) {
    const alias = legacyOfflineRegistry.get(config.nativeId);
    if (alias) return alias as OfflineContentManager;
    const serializer = new NativeConfigSerializer();
    const converted = serializer.serialize({
      identifier: config.identifier,
      sourceConfig: config.sourceConfig,
    });
    const events = new NativeOfflineEvents();
    super(converted, events, serializer.dispatcher.callback);
    serializer.dispatcher.retain(this);
    this.nativeId = legacyOfflineRegistry.register(config.nativeId, this);
    bindNativeMethods(this, NativeOffline.prototype);
    this.observeEvents(events);
    this.ready = super.initialize().then(() => {
      this.isInitialized = true;
    });
    void this.ready.catch(() => {
      this.subscription?.remove();
      this.subscription = undefined;
      legacyOfflineRegistry.remove(this.nativeId, this);
    });
  }

  /** User-defined compatibility ID, or a generated UUIDv4. */
  declare readonly nativeId: string;

  /** Whether the constructor's native creation attempt has completed successfully. */
  isInitialized = false;

  /** Whether `destroy()` has been called on this wrapper. */
  isDestroyed = false;

  /** Waits for the native manager creation started by the constructor. */
  initialize = (): Promise<void> => this.ready;

  private observeEvents(events: NativeOfflineEvents) {
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

  /**
   * Adds a listener to the receive data from the native `OfflineContentManagerListener` callbacks
   * Returns a function that removes this listener from the `OfflineContentManager` that registered it.
   */
  addListener(listener: OfflineContentManagerListener): () => void;
  /** @internal Expo's inherited event-emitter signature; Offline SDK events use the separate events owner. */
  addListener(eventName: never, listener: never): EventSubscription;
  addListener(
    listenerOrEvent: OfflineContentManagerListener | string,
    listener?: never
  ): (() => void) | EventSubscription {
    if (typeof listenerOrEvent === 'string')
      return super.addListener(listenerOrEvent as never, listener as never);
    const listeners = this.listeners;
    listeners.add(listenerOrEvent);
    return () => {
      listeners.delete(listenerOrEvent);
    };
  }

  /**
   * Destroys the native `OfflineManager` and releases all of its allocated resources.
   */
  destroy = async (): Promise<void> => {
    this.isDestroyed = true;
    this.subscription?.remove();
    this.subscription = undefined;
    this.listeners.clear();
    legacyOfflineRegistry.remove(this.nativeId, this);
    await super.destroy();
  };

  /**
   * Gets the current state of the `OfflineContentManager`
   */
  declare state: () => Promise<OfflineState>;

  /**
   * Loads the current `OfflineContentOptions`.
   * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
   */
  declare getOptions: () => Promise<void>;

  /**
   * Enqueues downloads according to the `OfflineDownloadRequest`.
   * The native SDK handles requests according to the current download state.
   * A resolved promise does not indicate that the download has finished.
   * Observe `OfflineContentManagerListener` for download completion and errors.
   */
  declare download: (request: OfflineDownloadRequest) => Promise<void>;

  /**
   * Resumes all suspended actions.
   */
  declare resume: () => Promise<void>;

  /**
   * Suspends all active actions.
   */
  declare suspend: () => Promise<void>;

  /**
   * Cancels and deletes the active download.
   */
  declare cancelDownload: () => Promise<void>;

  /**
   * Resolves how many bytes of storage are used by the offline content.
   */
  declare usedStorage: () => Promise<number>;

  /**
   * Deletes everything related to the related content ID.
   */
  declare deleteAll: () => Promise<void>;

  /**
   * Downloads the offline license.
   * When finished successfully, data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  declare downloadLicense: () => Promise<void>;

  /**
   * Releases the currently held offline license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   *
   * @platform Android
   */
  declare releaseLicense: () => Promise<void>;

  /**
   * Renews the already downloaded DRM license.
   * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
   * Errors are transmitted to the `OfflineContentManagerListener.onError`.
   */
  declare renewOfflineLicense: () => Promise<void>;
}
