import { Platform } from 'react-native';
import { Source, TimelineReferencePoint } from './source';
import type { Player } from './player';
import { NativePlaylistApi } from './modules/playerModule';

/**
 * Where playback starts when replaying a finished playlist.
 * @experimental
 */
export enum ReplayMode {
  PLAYLIST = 'playlist',
  LAST_SOURCE = 'lastSource',
  /** @deprecated Use PLAYLIST. */
  Playlist = 'playlist',
  /** @deprecated Use LAST_SOURCE. */
  LastSource = 'lastSource',
}

/**
 * Additional native playlist configuration.
 * @experimental
 */
export interface PlaylistOptions {
  /**
   * Start preloading every source when the playlist is loaded.
   * @defaultValue `false`
   */
  preloadAllSources?: boolean;
  /**
   * Where playback starts when replaying the finished playlist.
   * @defaultValue {@link ReplayMode.PLAYLIST}
   */
  replayMode?: ReplayMode;
}

/**
 * Sources and options to load into a player.
 * @experimental
 */
export interface PlaylistConfig {
  sources: Source[];
  options?: PlaylistOptions;
}

/** A position in a playlist source. @platform Android */
export interface SeekTarget {
  offset: number;
  startOffsetTimelineReference?: TimelineReferencePoint;
}

/**
 * Manages the native player's playlist. The SDK owns source order, preloading,
 * transitions and source attachment. Mutations retain the SDK's no-op and warning behavior.
 * @experimental
 */
export class PlaylistApi {
  private readonly native: NativePlaylistApi;
  /** @internal */
  constructor(private readonly player: Player) {
    this.native = new NativePlaylistApi(player.native);
  }

  /**
   * Queries the sources currently in the native playlist.
   * Reuses the original Source objects while they remain reachable.
   */
  getSources = async (): Promise<Source[]> => {
    const player = this.player;
    const sources = (
      await this.native.getSources(
        player.knownSources.map((source) => source.native)
      )
    ).map(Source.fromNative);
    sources.forEach(player.retainSource);
    return sources;
  };

  /** Adds a source at the given index, or appends it when omitted. */
  add = async (source: Source, index?: number): Promise<void> => {
    await this.native.add(source.native, index);
    this.player.retainSource(source);
  };

  /** Removes a source. The active source cannot be removed. */
  remove = (source: Source): Promise<void> => this.native.remove(source.native);

  /** Removes the source at the given index. The active source cannot be removed. */
  removeAt = (index: number): Promise<void> => this.native.removeAt(index);

  /** Seeks to a time in a source that is already part of the playlist. */
  seek = (source: Source, time: number): Promise<void> =>
    this.native.seek(source.native, time);

  /** Seeks relative to a timeline reference point. @platform Android */
  seekTo = async (source: Source, target: SeekTarget): Promise<void> => {
    if (Platform.OS !== 'android')
      throw new Error('PlaylistApi.seekTo is only supported on Android.');
    await this.native.seekTo(source.native, target);
  };
}
