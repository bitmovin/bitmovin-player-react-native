import type { EventSubscription } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { addPlatformToMetadataEvent } from './utils/metadataPlatform';
import type { MetadataEvent, MetadataParsedEvent } from './events';

/** Attach directly to the native SharedObject once lazy creation completes. */
export function subscribeToNativeEvent<
  Events extends Record<string, (payload: any) => void>,
  Name extends keyof Events,
>(
  native: SharedObject<Events> | Promise<SharedObject<Events> | undefined>,
  event: Name,
  listener: Events[Name]
): EventSubscription {
  let removed = false;
  let subscription: EventSubscription | undefined;
  const attach = (owner: SharedObject<Events> | undefined) => {
    if (removed || !owner) return;
    subscription = owner.addListener(event, ((payload: unknown) => {
      listener(
        event === 'metadata' || event === 'metadataParsed'
          ? addPlatformToMetadataEvent(
              payload as MetadataEvent | MetadataParsedEvent
            )
          : payload
      );
    }) as Events[Name]);
  };
  if (native instanceof Promise) void native.then(attach);
  else attach(native);
  return {
    remove() {
      removed = true;
      subscription?.remove();
    },
  };
}
