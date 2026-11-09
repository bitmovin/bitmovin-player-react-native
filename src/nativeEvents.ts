import type { EventSubscription } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { addPlatformToMetadataEvent } from './utils/metadataPlatform';
import type { MetadataEvent, MetadataParsedEvent } from './events';

/** Await the native creation Promise, then attach directly to the SharedObject. */
export async function subscribeToNativeEvent<
  Events extends Record<string, (payload: any) => void>,
  Name extends keyof Events,
>(
  native: Promise<SharedObject<Events>>,
  event: Name,
  listener: Events[Name]
): Promise<EventSubscription> {
  const owner = await native;
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
