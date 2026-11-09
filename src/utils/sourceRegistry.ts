import type { Source } from '../source';

/**
 * The {@link Source}s that exist natively, keyed by {@link Source.nativeId}, to resolve the native sources of a
 * player, e.g. its active source, back to their JS instances.
 *
 * A source is registered once it is created natively and unregistered once it is destroyed. Native never
 * releases a source on its own, so the registry matches the native one.
 */
const sources = new Map<string, Source>();
const pendingDestroys = new Map<string, Promise<void>>();

export const SourceRegistry = {
  /**
   * Registers `source`, unless another source with the same `nativeId` is registered. Both then share the
   * native source of the registered one.
   */
  register(source: Source) {
    const registered = sources.get(source.nativeId);
    if (registered && registered !== source) {
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

  /**
   * Tracks the native destroy of the source with `nativeId` until `destroy` settles, so that a new source
   * with the same `nativeId` is only created natively afterwards.
   */
  trackDestroy(nativeId: string, destroy: Promise<unknown>) {
    const pendingDestroy: Promise<void> = destroy.then(
      () => untrackDestroy(nativeId, pendingDestroy),
      () => untrackDestroy(nativeId, pendingDestroy)
    );
    pendingDestroys.set(nativeId, pendingDestroy);
  },

  pendingDestroy(nativeId: string): Promise<void> | undefined {
    return pendingDestroys.get(nativeId);
  },
};

const untrackDestroy = (nativeId: string, pendingDestroy: Promise<void>) => {
  if (pendingDestroys.get(nativeId) === pendingDestroy) {
    pendingDestroys.delete(nativeId);
  }
};
