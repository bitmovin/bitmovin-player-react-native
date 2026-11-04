import PlaylistModule from '../modules/PlaylistModule';
import type { Source } from '../source';

/**
 * Provides the means to manage multiple {@link Source}s inside a playback session.
 *
 * When the player transitions from one source in the playback session to another (either by normal playback or
 * by seeking), a `PlaylistTransition` event is emitted and the new source becomes active while the old one becomes
 * inactive.
 *
 * Accessible through {@link Player.playlist}.
 */
export class PlaylistApi {
  /**
   * The native player id that this playlist api is attached to.
   */
  readonly nativeId: string;

  private readonly knownSources: Map<string, Source>;

  constructor(playerId: string, knownSources: Map<string, Source>) {
    this.nativeId = playerId;
    this.knownSources = knownSources;
  }

  /**
   * Gets the {@link Source}s currently in the playback session. Exactly one source is always active in a
   * playback session.
   *
   * @returns the sources of the playback session, or an empty list if there is no active playback session.
   * Sources that were not created through a {@link Source} instance (e.g. offline content) are not included.
   */
  getSources = async (): Promise<Source[]> => {
    const nativeIds = await PlaylistModule.sources(this.nativeId);
    return nativeIds.flatMap((nativeId) => {
      const source = this.knownSources.get(nativeId);
      return source ? [source] : [];
    });
  };

  /**
   * Adds the `source` to the active playback session, either at `index` or at the end if `index` is omitted.
   *
   * Has no effect if `index` is < 0 or > the number of sources. Has no effect and emits a `PlayerWarning` if
   * there is no active playback session.
   *
   * @returns a promise that rejects if the `source` is already attached to a player or was destroyed.
   */
  add = async (source: Source, index?: number): Promise<void> => {
    await source.initialize();
    this.knownSources.set(source.nativeId, source);
    return PlaylistModule.add(this.nativeId, source.nativeId, index);
  };

  /**
   * Removes the `source` from the active playback session.
   *
   * Has no effect if the `source` is not part of the playback session. Has no effect and emits a `PlayerWarning`
   * if there is no active playback session or if the `source` is the active source.
   */
  remove = async (source: Source): Promise<void> => {
    return PlaylistModule.remove(this.nativeId, source.nativeId);
  };

  /**
   * Removes the source at `index` from the active playback session.
   *
   * Has no effect if `index` is < 0 or >= the number of sources. Has no effect and emits a `PlayerWarning` if
   * there is no active playback session or if the source at `index` is the active source.
   */
  removeAt = async (index: number): Promise<void> => {
    return PlaylistModule.removeAt(this.nativeId, index);
  };

  /**
   * Seeks to the specified `time` in seconds in the specified `source`.
   * The `source` must be part of the playback session.
   *
   * Has no effect and emits a `PlayerWarning` if there is no active playback session, or if `source` is the
   * active source and a live stream (use {@link Player.timeShift} instead).
   */
  seek = async (source: Source, time: number): Promise<void> => {
    return PlaylistModule.seek(this.nativeId, source.nativeId, time);
  };
}
