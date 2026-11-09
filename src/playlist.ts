import { Platform } from 'react-native';
import type { Player } from './player';
import { Source, TimelineReferencePoint } from './source';
import {
  nativePlayerReference,
  type NativePlayerReference,
  refreshLoadedSources,
  resolveLoadedSource,
} from './modules/PlayerModule';
import { getNativeSource } from './modules/SourceModule';

/** Where playback starts when replaying a finished playlist. */
export enum ReplayMode {
  PLAYLIST = 'playlist',
  LAST_SOURCE = 'lastSource',
}

/** Additional native playlist configuration. */
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

/** Sources and options to load into a player. */
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
 */
export class PlaylistApi {
  private readonly native: NativePlayerReference;

  constructor(player: Player | NativePlayerReference) {
    this.native = nativePlayerReference(player);
  }

  /** Returns the sources currently in the native playlist. */
  getSources = async (): Promise<Source[]> => {
    const player = await this.native();
    if (!player) return [];
    return (await player.getPlaylistSources()).map((source) =>
      Source.fromNative(resolveLoadedSource(player, source))
    );
  };

  /** Adds a source at the given index, or appends it when omitted. */
  add = async (source: Source, index?: number): Promise<void> => {
    await source.initialize();
    const player = await this.native();
    const nativeSource = getNativeSource(source);
    if (player && nativeSource)
      await refreshLoadedSources(
        player,
        [nativeSource],
        player.playlistAdd(nativeSource, index)
      );
  };

  /** Removes a source. The active source cannot be removed. */
  remove = async (source: Source): Promise<void> => {
    const nativeSource = getNativeSource(source);
    if (!nativeSource) return;
    const player = await this.native();
    if (player)
      await refreshLoadedSources(
        player,
        [],
        player.playlistRemove(nativeSource)
      );
  };

  /** Removes the source at the given index. The active source cannot be removed. */
  removeAt = async (index: number): Promise<void> => {
    const player = await this.native();
    if (player)
      await refreshLoadedSources(player, [], player.playlistRemoveAt(index));
  };

  /** Seeks to a time in a source that is already part of the playlist. */
  seek = async (source: Source, time: number): Promise<void> => {
    const nativeSource = getNativeSource(source);
    if (!nativeSource) return;
    await (await this.native())?.playlistSeek(nativeSource, time);
  };

  /** Seeks relative to a timeline reference point. @platform Android */
  seekTo = async (source: Source, target: SeekTarget): Promise<void> => {
    if (Platform.OS !== 'android')
      throw new Error('PlaylistApi.seekTo is only supported on Android.');
    const nativeSource = getNativeSource(source);
    if (!nativeSource) return;
    await (await this.native())?.playlistSeekTo(nativeSource, target);
  };
}
