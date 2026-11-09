import type { Player } from '../player';
import type { Source } from '../source';

/**
 * The {@link Source}s that exist natively, keyed by {@link Source.nativeId}, to resolve native source ids back to
 * their JS instances. Only {@link Source.initialize} and {@link Source.destroy} change it, as native never
 * releases a source on its own.
 */
const sources = new Map<string, Source>();
/**
 * The player that owns a source and destroys it with itself, including sources that are still initializing, and
 * the number of the {@link SourceRegistry.own} call that made it the owner.
 */
const owners = new Map<Source, { player: Player; ownership: number }>();
let ownerships = 0;

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
   * Forgets the destroyed `source`.
   */
  unregister(source: Source) {
    if (sources.get(source.nativeId) === source) {
      sources.delete(source.nativeId);
    }
    owners.delete(source);
  },

  get(nativeId: string): Source | undefined {
    return sources.get(nativeId);
  },

  /**
   * Makes `player` the owner of the sources it loads, also if another player owned them before.
   * A destroyed player takes no sources, and destroyed sources are not taken.
   */
  own(player: Player, loadedSources: Source[]) {
    if (player.isDestroyed) {
      return;
    }
    ownerships += 1;
    loadedSources
      .filter((source) => !source.isDestroyed)
      .forEach((source) =>
        owners.set(source, { player, ownership: ownerships })
      );
  },

  /**
   * Hands the source that `removal` resolves to back to the app, so `player` no longer destroys it, unless
   * `player` loaded it again since the removal started.
   */
  async release(
    player: Player,
    removal: Promise<Source | undefined>
  ): Promise<Source | undefined> {
    const ownershipsBeforeRemoval = ownerships;
    const source = await removal;
    const owner = source && owners.get(source);
    if (
      source &&
      owner?.player === player &&
      owner.ownership <= ownershipsBeforeRemoval
    ) {
      owners.delete(source);
    }
    return source;
  },

  /**
   * Destroys the sources `player` owns, once it is destroyed.
   */
  destroyOwned(player: Player) {
    [...owners]
      .filter(([, owner]) => owner.player === player)
      .forEach(([source]) => source.destroy());
  },
};
