import type { EventSubscription } from 'expo-modules-core';
import type { Event } from '../events';
import type { BitmovinEventSubscription } from '../eventMap';
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
 *
 * Native subscription changes are not awaited: they run on the native main queue in call order, so they are
 * applied before any later native call on that queue, e.g. a load.
 */
export class EventListeners<EventMap> {
  private readonly listeners = new Map<string, Set<Listener>>();
  private moduleSubscription?: EventSubscription;
  private isNativeAttached = false;

  constructor(
    private readonly nativeId: string,
    private readonly nativeModule: NativeEventModule,
    private readonly addModuleListener: (
      listener: (payload: NativeEventPayload) => void
    ) => EventSubscription
  ) {}

  on<K extends keyof EventMap & string>(
    eventName: K,
    listener: (event: EventMap[K]) => void
  ): BitmovinEventSubscription {
    let eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(eventName, eventListeners);
      this.moduleSubscription ??= this.addModuleListener(this.dispatch);
      if (this.isNativeAttached) {
        void this.nativeModule.subscribe(this.nativeId, eventName);
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
      void this.nativeModule.unsubscribe(this.nativeId, eventName);
    }
    if (this.listeners.size === 0) {
      this.moduleSubscription?.remove();
      this.moduleSubscription = undefined;
    }
  }

  /**
   * Attaches the native listeners for all registered event names. Call once the native instance exists.
   */
  attachNative = () => {
    this.isNativeAttached = true;
    this.listeners.forEach(
      (_, eventName) =>
        void this.nativeModule.subscribe(this.nativeId, eventName)
    );
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
