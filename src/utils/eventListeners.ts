import type { EventSubscription } from 'expo-modules-core';
import type { Event } from '../events';
import { normalizeNonFinite } from './normalizeNonFinite';

/**
 * Payload of the native `onPlayerEvent` / `onSourceEvent` module events.
 */
export interface NativeEventPayload {
  nativeId: string;
  /**
   * The event map key the native listener was attached for, e.g. `playerActive`.
   */
  eventName: string;
  event: Event;
}

/**
 * The native module functions that attach and detach native event listeners.
 */
interface NativeEventModule {
  on(nativeId: string, eventName: string): Promise<void>;
  off(nativeId: string, eventName: string): Promise<void>;
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
 * Keeps the JS listeners of one native instance and attaches a native listener per event name
 * only while at least one JS listener for that name exists.
 *
 * Native listeners can only be attached once the native instance exists. Listeners registered
 * before are attached by {@link EventListeners.attachNative}.
 *
 * Native subscription changes are not awaited: they run on the native main queue in call order, so they are
 * applied before any later native call on that queue, e.g. a load.
 *
 * Several instances can share a native instance, e.g. two `Player`s created with the same `nativeId`.
 */
export class EventListeners<EventMap> {
  /**
   * The instances that have listeners, per native module and `nativeId`. Instances without listeners are not kept,
   * so that unused ones (e.g. one `Player` per render of `usePlayer`) can be garbage collected.
   */
  private static readonly withListeners = new Map<
    NativeEventModule,
    Map<string, Set<EventListeners<unknown>>>
  >();

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
  ): void {
    let eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(eventName, eventListeners);
      if (!this.moduleSubscription) {
        this.moduleSubscription = this.addModuleListener(this.dispatch);
        this.sharingInstances(true).add(this);
      }
      if (this.isNativeAttached) {
        void this.nativeModule.on(this.nativeId, eventName);
      }
    }
    eventListeners.add(listener);
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
      void this.nativeModule.off(this.nativeId, eventName);
    }
    if (this.listeners.size === 0) {
      this.removeModuleSubscription();
    }
  }

  /**
   * Attaches the native listeners for all registered event names once the native instance exists.
   * Has no effect if they are already attached, e.g. when initializing again.
   */
  attachNative = () => {
    if (this.isNativeAttached) {
      return;
    }
    this.isNativeAttached = true;
    this.listeners.forEach(
      (_, eventName) => void this.nativeModule.on(this.nativeId, eventName)
    );
  };

  /**
   * Removes all listeners of this instance and of all other instances sharing its native instance, as the native
   * listeners are released with the native instance, e.g. when the player is destroyed.
   */
  removeAll = () => {
    new Set([this, ...this.sharingInstances()]).forEach((instance) =>
      instance.clear()
    );
  };

  private clear() {
    this.listeners.clear();
    this.removeModuleSubscription();
    this.isNativeAttached = false;
  }

  private removeModuleSubscription() {
    if (!this.moduleSubscription) {
      return;
    }
    this.moduleSubscription.remove();
    this.moduleSubscription = undefined;
    const instances = this.sharingInstances();
    instances.delete(this);
    if (instances.size === 0) {
      EventListeners.withListeners
        .get(this.nativeModule)
        ?.delete(this.nativeId);
    }
  }

  /**
   * The instances with listeners that share the native instance of this one, including this one if it has listeners.
   */
  private sharingInstances(create = false): Set<EventListeners<unknown>> {
    let byNativeId = EventListeners.withListeners.get(this.nativeModule);
    if (!byNativeId) {
      byNativeId = new Map();
      if (create) {
        EventListeners.withListeners.set(this.nativeModule, byNativeId);
      }
    }
    let instances = byNativeId.get(this.nativeId);
    if (!instances) {
      instances = new Set();
      if (create) {
        byNativeId.set(this.nativeId, instances);
      }
    }
    return instances;
  }

  private dispatch = ({ nativeId, eventName, event }: NativeEventPayload) => {
    if (nativeId !== this.nativeId) {
      return;
    }
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      return;
    }
    const normalized = normalizeNonFinite(event);
    [...eventListeners].forEach((listener) =>
      callListener(listener, normalized)
    );
  };
}
