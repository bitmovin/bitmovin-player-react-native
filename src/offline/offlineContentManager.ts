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

interface OfflineManagerState {
  config: OfflineContentConfig;
  nativeId: string;
  initialized: boolean;
  destroyed: boolean;
  ready: Promise<void>;
  listeners: Set<OfflineContentManagerListener>;
  subscription?: EventSubscription;
}
const offlineStates = new WeakMap<NativeOffline, OfflineManagerState>();

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
  constructor(config: OfflineContentConfig) {
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
    const nativeId = legacyOfflineRegistry.register(config.nativeId, this);
    const state: OfflineManagerState = {
      config,
      nativeId,
      initialized: false,
      destroyed: false,
      ready: Promise.resolve(),
      listeners: new Set(),
    };
    offlineStates.set(this, state);
    bindNativeMethods(this, NativeOffline.prototype);
    this.observeEvents(events);
    state.ready = super.initialize().then(() => {
      state.initialized = true;
    });
    void state.ready.catch(() => {
      state.subscription?.remove();
      state.subscription = undefined;
      legacyOfflineRegistry.remove(nativeId, this);
    });
  }

  /** User-defined compatibility ID, or a generated UUIDv4. */
  get nativeId(): string {
    return offlineStates.get(this)!.nativeId;
  }
  get config(): OfflineContentConfig {
    return offlineStates.get(this)!.config;
  }

  /** Whether the constructor's native creation attempt has completed successfully. */
  get isInitialized(): boolean {
    return offlineStates.get(this)!.initialized;
  }

  /** Whether `destroy()` has been called on this wrapper. */
  get isDestroyed(): boolean {
    return offlineStates.get(this)!.destroyed;
  }

  /** Waits for the native manager creation started by the constructor. */
  initialize = (): Promise<void> => offlineStates.get(this)!.ready;

  private observeEvents(events: NativeOfflineEvents) {
    const state = offlineStates.get(this)!;
    if (!state.subscription)
      state.subscription = events.addListener(
        'onBitmovinOfflineEvent',
        OfflineContentManager.weakEventListener(new WeakRef(this))
      );
  }

  // A separate scope keeps the native-held listener from capturing the manager.
  private static weakEventListener(reference: WeakRef<OfflineContentManager>) {
    return (event: Omit<BitmovinNativeOfflineEventData, 'nativeId'>) => {
      const manager = reference.deref();
      if (!manager) return;
      const state = offlineStates.get(manager)!;
      handleBitmovinNativeOfflineEvent(
        {
          ...event,
          nativeId: state.nativeId,
        } as BitmovinNativeOfflineEventData,
        state.listeners
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
    const listeners = offlineStates.get(this)!.listeners;
    listeners.add(listenerOrEvent);
    return () => {
      listeners.delete(listenerOrEvent);
    };
  }

  /**
   * Destroys the native `OfflineManager` and releases all of its allocated resources.
   */
  destroy = async (): Promise<void> => {
    const state = offlineStates.get(this)!;
    state.destroyed = true;
    state.subscription?.remove();
    state.subscription = undefined;
    state.listeners.clear();
    legacyOfflineRegistry.remove(state.nativeId, this);
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
