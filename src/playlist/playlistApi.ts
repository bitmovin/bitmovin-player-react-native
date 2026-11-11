import PlaylistModule from '../modules/PlaylistModule';
import type { Source } from '../source';
import { releaseSourceOwner } from '../utils/sourceOwners';

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
  private readonly takeOwnership: (sources: Source[]) => void;

  constructor(
    playerId: string,
    knownSources: Map<string, Source>,
    takeOwnership: (sources: Source[]) => void
  ) {
    this.nativeId = playerId;
    this.knownSources = knownSources;
    this.takeOwnership = takeOwnership;
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
   * On iOS and tvOS, no `PlayerWarning` is emitted; the native SDK logs a warning instead.
   *
   * On iOS and tvOS, only HLS, progressive and `movpkg` sources can be part of a playlist.
   *
   * @returns a promise that rejects if the `source` is already attached to a player, was destroyed, or (on iOS
   * and tvOS) has an unsupported type.
   */
  add = async (source: Source, index?: number): Promise<void> => {
    this.knownSources.set(source.nativeId, source);
    await source.initialize();
    await PlaylistModule.add(this.nativeId, source.nativeId, index);
    this.takeOwnership([source]);
  };

  /**
   * Removes the `source` from the active playback session.
   * A removed `source` is not destroyed with the player. Destroy it via {@link Source.destroy} once it is no
   * longer needed.
   *
   * Has no effect if the `source` is not part of the playback session. Has no effect and emits a `PlayerWarning`
   * if there is no active playback session or if the `source` is the active source.
   * On iOS and tvOS, no `PlayerWarning` is emitted; the native SDK logs a warning instead.
   */
  remove = async (source: Source): Promise<void> => {
    if (await PlaylistModule.remove(this.nativeId, source.nativeId)) {
      this.knownSources.delete(source.nativeId);
      releaseSourceOwner(source, this.nativeId);
    }
  };

  /**
   * Removes the source at `index` from the active playback session, like {@link PlaylistApi.remove}.
   *
   * Has no effect if `index` is < 0 or >= the number of sources. Has no effect and emits a `PlayerWarning` if
   * there is no active playback session or if the source at `index` is the active source.
   * On iOS and tvOS, no `PlayerWarning` is emitted; the native SDK logs a warning instead.
   */
  removeAt = async (index: number): Promise<void> => {
    const removedNativeId = await PlaylistModule.removeAt(this.nativeId, index);
    if (removedNativeId) {
      const removed = this.knownSources.get(removedNativeId);
      this.knownSources.delete(removedNativeId);
      if (removed) {
        releaseSourceOwner(removed, this.nativeId);
      }
    }
  };

  /**
   * Seeks to the specified `time` in seconds in the specified `source`.
   * The `source` must be part of the playback session.
   *
   * Has no effect and emits a `PlayerWarning` if there is no active playback session, or if `source` is the
   * active source and a live stream (use {@link Player.timeShift} instead).
   * On iOS and tvOS, no `PlayerWarning` is emitted.
   */
  seek = async (source: Source, time: number): Promise<void> => {
    return PlaylistModule.seek(this.nativeId, source.nativeId, time);
  };
}
