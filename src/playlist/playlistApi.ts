import PlaylistModule from '../modules/PlaylistModule';
import { Source } from '../source';
import type { Player } from '../player';

/**
 * Provides the means to manage multiple {@link Source}s inside a playback session.
 *
 * When the player transitions from one source in the playback session to another (either by normal playback or
 * by seeking), a `PlaylistTransition` event is emitted and the new source becomes active while the old one becomes
 * inactive.
 *
 * Accessible through {@link Player.playlist}.
 *
 * @experimental
 */
export class PlaylistApi {
  /**
   * The native player id that this playlist api is attached to.
   */
  readonly nativeId: string;

  constructor(private readonly player: Player) {
    this.nativeId = player.nativeId;
  }

  /**
   * Gets the {@link Source}s currently in the playback session. Exactly one source is always active in a
   * playback session.
   *
   * @returns the sources of the playback session, or an empty list if there is no active playback session.
   */
  getSources = async (): Promise<Source[]> => {
    const native = await PlaylistModule.sources(
      this.player.native,
      this.player.knownSources.map((source) => source.native)
    );
    return native.map((peer) => {
      const source = Source.fromNative(peer);
      this.player.retainSource(source);
      return source;
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
   * @returns a promise that rejects if the `source` is already attached to a player, or (on iOS
   * and tvOS) has an unsupported type.
   */
  add = async (source: Source, index?: number): Promise<void> => {
    await PlaylistModule.add(this.player.native, source.native, index);
    this.player.retainSource(source);
  };

  /**
   * Removes the `source` from the active playback session.
   *
   * Has no effect if the `source` is not part of the playback session. Has no effect and emits a `PlayerWarning`
   * if there is no active playback session or if the `source` is the active source.
   * On iOS and tvOS, no `PlayerWarning` is emitted; the native SDK logs a warning instead.
   */
  remove = async (source: Source): Promise<void> => {
    await PlaylistModule.remove(this.player.native, source.native);
  };

  /**
   * Removes the source at `index` from the active playback session, like {@link PlaylistApi.remove}.
   *
   * Has no effect if `index` is < 0 or >= the number of sources. Has no effect and emits a `PlayerWarning` if
   * there is no active playback session or if the source at `index` is the active source.
   * On iOS and tvOS, no `PlayerWarning` is emitted; the native SDK logs a warning instead.
   */
  removeAt = async (index: number): Promise<void> => {
    await PlaylistModule.removeAt(this.player.native, index);
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
    return PlaylistModule.seek(this.player.native, source.native, time);
  };
}
