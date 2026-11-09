import type { Source } from '../source';

/**
 * The {@link Source}s that exist natively, keyed by {@link Source.nativeId}, to resolve native source ids back to
 * their JS instances. Only {@link Source.initialize} and {@link Source.destroy} change it, as native never
 * releases a source on its own.
 */
const sources = new Map<string, Source>();

export const SourceRegistry = {
  /**
   * Registers `source`, unless another source with the same `nativeId` is registered, whose native source both
   * then share.
   */
  register(source: Source) {
    if (sources.has(source.nativeId)) {
      console.warn(
        `[Source ${source.nativeId}] Another source with the same nativeId exists, whose native source this source uses. Use a unique nativeId for every source.`
      );
      return;
    }
    sources.set(source.nativeId, source);
  },

  /**
   * Unregisters `source`, unless another source with the same `nativeId` is registered.
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
