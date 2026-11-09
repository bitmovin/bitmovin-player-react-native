import type { EventSubscription } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { addPlatformToMetadataEvent } from './utils/metadataPlatform';
import type { MetadataEvent, MetadataParsedEvent } from './events';

/** Await lazy creation, then attach directly to the native SharedObject. */
export async function subscribeToNativeEvent<
  Events extends Record<string, (payload: any) => void>,
  Name extends keyof Events,
>(
  native: Promise<SharedObject<Events> | undefined>,
  event: Name,
  listener: Events[Name]
): Promise<EventSubscription> {
  const owner = await native;
  if (!owner) {
    console.warn(
      `Cannot subscribe to '${String(event)}': the native object is unavailable. It may have been destroyed during registration.`
    );
    return { remove() {} };
  }
  return owner.addListener(event, ((payload: unknown) => {
    listener(
      event === 'metadata' || event === 'metadataParsed'
        ? addPlatformToMetadataEvent(
            payload as MetadataEvent | MetadataParsedEvent
          )
        : payload
    );
  }) as Events[Name]);
}
