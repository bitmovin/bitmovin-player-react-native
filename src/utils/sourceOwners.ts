import type { Source } from '../source';

/**
 * The native id of the player each {@link Source} was last attached to by a successful load or add.
 * A player only destroys the sources it owns. A source removed from a playlist has no owner.
 */
const owners = new WeakMap<Source, string>();

export const getSourceOwner = (source: Source): string | undefined =>
  owners.get(source);

export const setSourceOwner = (source: Source, playerId: string) => {
  owners.set(source, playerId);
};

/**
 * Clears the owner of `source` if it is `playerId`, e.g. after the player removed it.
 */
export const releaseSourceOwner = (source: Source, playerId: string) => {
  if (owners.get(source) === playerId) {
    owners.delete(source);
  }
};
