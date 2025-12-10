import { Platform } from 'react-native';
import type { MetadataEntry, MetadataCollection } from '../metadata';

/**
 * Adds platform discriminator to metadata entries received from native code.
 *
 * Native code doesn't include the platform field to avoid redundancy with `Platform.OS`.
 * This utility injects the platform field based on the current platform, enabling
 * TypeScript discriminated union type narrowing for platform-specific metadata structures.
 *
 * @param collection - Metadata collection from native code without platform discriminators
 * @returns Metadata collection with platform field added to each entry
 */
export function addPlatformToMetadata<T extends MetadataEntry>(
  collection: Omit<MetadataCollection<T>, 'entries'> & {
    entries: Omit<T, 'platform'>[];
  }
): MetadataCollection<T> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  return {
    ...collection,
    entries: collection.entries.map((entry) => ({
      ...entry,
      platform,
    })) as T[],
  };
}
