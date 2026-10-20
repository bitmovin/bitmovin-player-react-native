import type { Source } from '../source';

/**
 * Defines where playback starts when replaying a finished playlist.
 */
export enum ReplayMode {
  /**
   * Replays the whole playlist, starting with the first source.
   */
  Playlist = 'playlist',
  /**
   * Replays only the last source of the playlist.
   */
  LastSource = 'lastSource',
}

/**
 * Configures the behavior of a playlist.
 */
export interface PlaylistOptions {
  /**
   * Whether all {@link Source}s of the playlist immediately start preloading when the playlist is loaded.
   * Progressive sources cannot be preloaded as part of this setting, although they are preloaded naturally
   * before a playlist transition according to the configured target buffer level.
   *
   * @defaultValue `false`
   */
  preloadAllSources?: boolean;
  /**
   * Whether replay starts at the beginning of the playlist or at the beginning of the last source.
   *
   * @defaultValue `ReplayMode.Playlist`
   */
  replayMode?: ReplayMode;
}

/**
 * Configures a playlist that can be loaded into a {@link Player} via {@link Player.loadPlaylist}.
 */
export interface PlaylistConfig {
  /**
   * The sources of the playlist, in playback order. Must not be empty.
   */
  sources: Source[];
  /**
   * The options of the playlist.
   */
  options?: PlaylistOptions;
}
