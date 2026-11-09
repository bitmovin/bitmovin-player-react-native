import type { Source } from '../source';

/**
 * The {@link Source}s that exist natively, keyed by {@link Source.nativeId}, to resolve native source ids back to
 * their JS instances. Only {@link Source.initialize} and {@link Source.destroy} change it, as native never
 * releases a source on its own.
 */
const sources = new Map<string, Source>();
/**
 * The {@link Player.nativeId} of the player that created a source in {@link Player.load} and destroys it.
 * Set before the source is registered, so it is weak to not keep sources that are never registered.
 */
const owners = new WeakMap<Source, string>();

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

  setOwner(source: Source, playerNativeId: string) {
    owners.set(source, playerNativeId);
  },

  /**
   * Makes the player that loads `source` its owner, if `source` is owned by a player.
   */
  transferOwner(source: Source, playerNativeId: string) {
    if (owners.has(source)) {
      owners.set(source, playerNativeId);
    }
  },

  ownedBy(playerNativeId: string): Source[] {
    return [...sources.values()].filter(
      (source) => owners.get(source) === playerNativeId
    );
  },
};
