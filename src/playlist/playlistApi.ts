import PlaylistModule from '../modules/PlaylistModule';
import type { Source } from '../source';
import { SourceRegistry } from '../utils/sourceRegistry';

/**
 * Provides the means to manage multiple {@link Source}s inside a playback session.
 *
 * When the player transitions from one source in the playback session to another (either by normal playback or
 * by seeking), a `PlaylistTransition` event is emitted and the new source becomes active while the old one becomes
 * inactive.
 *
 * Accessible through {@link Player.playlist}.
 *
 * @platform Android
 */
export class PlaylistApi {
  /**
   * The native player id that this playlist api is attached to.
   */
  readonly nativeId: string;

  constructor(playerId: string) {
    this.nativeId = playerId;
  }

  /**
   * Gets the {@link Source}s currently in the playback session. Exactly one source is always active in a
   * playback session.
   *
   * @returns the sources of the playback session, or an empty list if there is no active playback session.
   * Sources that were not created through a {@link Source} instance (e.g. offline content) are not included.
   */
  getSources = async (): Promise<Source[]> => {
    const nativeIds = (await PlaylistModule?.sources(this.nativeId)) ?? [];
    return nativeIds.flatMap((nativeId) => {
      const source = SourceRegistry.get(nativeId);
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
    SourceRegistry.own(this.nativeId, [source]);
    await source.initialize();
    return PlaylistModule?.add(this.nativeId, source.nativeId, index);
  };

  /**
   * Removes the `source` from the active playback session.
   * The player no longer owns a removed `source`, so it is not destroyed with the player. Load it again, or destroy
   * it via {@link Source.destroy} once it is no longer needed.
   *
   * Has no effect if the `source` is not part of the playback session. Has no effect and emits a `PlayerWarning`
   * if there is no active playback session or if the `source` is the active source.
   */
  remove = async (source: Source): Promise<void> => {
    if (await PlaylistModule?.remove(this.nativeId, source.nativeId)) {
      SourceRegistry.disown(this.nativeId, source);
    }
  };

  /**
   * Removes the source at `index` from the active playback session, like {@link PlaylistApi.remove}.
   *
   * Has no effect if `index` is < 0 or >= the number of sources. Has no effect and emits a `PlayerWarning` if
   * there is no active playback session or if the source at `index` is the active source.
   *
   * @returns the removed source, or `undefined` if no source was removed or it was not created through a
   * {@link Source} instance (e.g. offline content).
   */
  removeAt = async (index: number): Promise<Source | undefined> => {
    const nativeId = await PlaylistModule?.removeAt(this.nativeId, index);
    const source = nativeId ? SourceRegistry.get(nativeId) : undefined;
    if (source) {
      SourceRegistry.disown(this.nativeId, source);
    }
    return source;
  };

  /**
   * Seeks to the specified `time` in seconds in the specified `source`.
   * The `source` must be part of the playback session.
   *
   * Has no effect and emits a `PlayerWarning` if there is no active playback session, or if `source` is the
   * active source and a live stream (use {@link Player.timeShift} instead).
   */
  seek = async (source: Source, time: number): Promise<void> => {
    return PlaylistModule?.seek(this.nativeId, source.nativeId, time);
  };
}
