import type { Source } from '../source';
import type { Player } from '../player';

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
  /** @internal */
  constructor(
    private readonly player: Pick<
      Player,
      'native' | 'retainSource' | 'getPlaylistSources'
    >
  ) {}

  /**
   * Gets the {@link Source}s currently in the playback session. Exactly one source is always active in a
   * playback session.
   *
   * @returns the sources of the playback session, or an empty list if there is no active playback session.
   * Includes native-owned sources such as offline content.
   */
  getSources = async (): Promise<Source[]> => {
    return this.player.getPlaylistSources();
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
   * @returns a promise that rejects if the `source` is already attached to a player or, on iOS and tvOS, has an
   * unsupported type.
   */
  add = async (source: Source, index?: number): Promise<void> => {
    const nativeSource = await source.native;
    const native = await this.player.native;
    await native.playlistAdd(nativeSource, index);
    this.player.retainSource(native, nativeSource);
  };

  /**
   * Removes the `source` from the active playback session.
   *
   * Has no effect if the `source` is not part of the playback session. Has no effect and emits a `PlayerWarning`
   * if there is no active playback session or if the `source` is the active source.
   * On iOS and tvOS, no `PlayerWarning` is emitted; the native SDK logs a warning instead.
   */
  remove = async (source: Source): Promise<void> => {
    const nativeSource = await source.native;
    await (await this.player.native).playlistRemove(nativeSource);
  };

  /**
   * Removes the source at `index` from the active playback session.
   *
   * Has no effect if `index` is < 0 or >= the number of sources. Has no effect and emits a `PlayerWarning` if
   * there is no active playback session or if the source at `index` is the active source.
   * On iOS and tvOS, no `PlayerWarning` is emitted; the native SDK logs a warning instead.
   */
  removeAt = async (index: number): Promise<void> => {
    await (await this.player.native).playlistRemoveAt(index);
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
    const nativeSource = await source.native;
    await (await this.player.native).playlistSeek(nativeSource, time);
  };
}
