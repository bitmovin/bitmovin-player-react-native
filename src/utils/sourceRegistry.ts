import type { EventSubscription } from 'expo-modules-core';
import SourceModule from '../modules/sourceModule';
import type { Source } from '../source';

/**
 * The {@link Source}s that exist natively, keyed by {@link Source.nativeId}, to resolve the native sources of a
 * player, e.g. its active source, back to their JS instances.
 *
 * Mirrors the native source registry: a source is registered once native created it and unregistered once native
 * released it, e.g. after its player removed it, or when it is destroyed.
 */
const sources = new Map<string, Source>();
let releaseSubscription: EventSubscription | undefined;

export const SourceRegistry = {
  register(source: Source) {
    sources.set(source.nativeId, source);
    releaseSubscription ??= SourceModule.addListener(
      'onSourceReleased',
      ({ nativeId, instanceId }) =>
        sources.get(nativeId)?.handleNativeRelease(instanceId)
    );
  },

  /**
   * Unregisters `source`, unless another instance with the same `nativeId` replaced it.
   */
  unregister(source: Source) {
    if (sources.get(source.nativeId) === source) {
      sources.delete(source.nativeId);
    }
  },

  get(nativeId: string): Source | undefined {
    return sources.get(nativeId);
  },
};
