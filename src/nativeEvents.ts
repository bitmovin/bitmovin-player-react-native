import type { EventSubscription } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';

/** Await the native creation Promise, then attach directly to the SharedObject. */
export async function subscribeToNativeEvent<
  Events extends Record<string, (payload: any) => void>,
  Name extends keyof Events,
>(
  owner: SharedObject<Events>,
  event: Name,
  listener: Events[Name]
): Promise<EventSubscription> {
  return owner.addListener(event, listener);
}
