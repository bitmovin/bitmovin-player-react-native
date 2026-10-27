import type { EventSubscription as ModuleSubscription } from 'expo-modules-core';
import type { Event } from '../events';
import type { EventSubscription } from '../eventMap';
import { normalizeNonFinite } from './normalizeNonFinite';

/**
 * Payload of the native `onPlayerEvent` / `onSourceEvent` module events.
 */
export interface NativeEventPayload {
  nativeId: string;
  event: Event;
}

/**
 * The native module functions that attach and detach native event listeners.
 */
interface NativeEventModule {
  subscribe(nativeId: string, eventName: string): Promise<void>;
  unsubscribe(nativeId: string, eventName: string): Promise<void>;
}

type Listener = (event: any) => void;

const noop = () => {};

/**
 * Calls `listener` with `event`. A throwing listener is reported and does not prevent the other listeners
 * from receiving the event.
 */
export const callListener = <T extends Event>(
  listener: (event: T) => void,
  event: T
) => {
  try {
    listener(event);
  } catch (error) {
    console.error(`Error in a listener for ${event.name}:`, error);
  }
};

/**
 * Converts a native event name to its event map key, e.g. `onPlayerActive` -> `playerActive`.
 */
const toEventMapKey = (name: string) =>
  name.charAt(2).toLowerCase() + name.slice(3);

/**
 * Keeps the JS listeners of one native instance and attaches a native listener per event name
 * only while at least one JS listener for that name exists.
 *
 * Native listeners can only be attached once the native instance exists. Listeners registered
 * before are attached by {@link EventListeners.attachNative}.
 */
export class EventListeners<EventMap> {
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly pending = new Set<Promise<void>>();
  private moduleSubscription?: ModuleSubscription;
  private isNativeAttached = false;

  constructor(
    private readonly nativeId: string,
    private readonly nativeModule: NativeEventModule,
    private readonly addModuleListener: (
      listener: (payload: NativeEventPayload) => void
    ) => ModuleSubscription
  ) {}

  on<K extends keyof EventMap & string>(
    eventName: K,
    listener: (event: EventMap[K]) => void
  ): EventSubscription {
    let eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(eventName, eventListeners);
      this.moduleSubscription ??= this.addModuleListener(this.dispatch);
      if (this.isNativeAttached) {
        this.track(this.nativeModule.subscribe(this.nativeId, eventName));
      }
    }
    eventListeners.add(listener);
    return { remove: () => this.off(eventName, listener) };
  }

  off<K extends keyof EventMap & string>(
    eventName: K,
    listener: (event: EventMap[K]) => void
  ): void {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners?.delete(listener) || eventListeners.size > 0) {
      return;
    }
    this.listeners.delete(eventName);
    if (this.isNativeAttached) {
      this.track(this.nativeModule.unsubscribe(this.nativeId, eventName));
    }
    if (this.listeners.size === 0) {
      this.moduleSubscription?.remove();
      this.moduleSubscription = undefined;
    }
  }

  /**
   * Attaches the native listeners for all registered event names. Call once the native instance exists.
   */
  attachNative = (): Promise<void> => {
    this.isNativeAttached = true;
    this.listeners.forEach((_, eventName) =>
      this.track(this.nativeModule.subscribe(this.nativeId, eventName))
    );
    return this.settled();
  };

  /**
   * Resolves once all pending native subscription changes have been applied.
   */
  settled = async (): Promise<void> => {
    await Promise.all(this.pending);
  };

  /**
   * Removes all listeners. The native listeners are expected to be released with the native instance.
   */
  removeAll = () => {
    this.listeners.clear();
    this.moduleSubscription?.remove();
    this.moduleSubscription = undefined;
    this.isNativeAttached = false;
  };

  private track(promise: Promise<void>) {
    const settled = promise.then(noop, noop);
    this.pending.add(settled);
    void settled.then(() => this.pending.delete(settled));
  }

  private dispatch = ({ nativeId, event }: NativeEventPayload) => {
    if (nativeId !== this.nativeId) {
      return;
    }
    const eventListeners = this.listeners.get(toEventMapKey(event.name));
    if (!eventListeners) {
      return;
    }
    const normalized = normalizeNonFinite(event);
    [...eventListeners].forEach((listener) =>
      callListener(listener, normalized)
    );
  };
}
